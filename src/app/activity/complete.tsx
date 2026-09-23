import {
  completeDraftSubmission,
  getDraftById,
  saveActivitySubmission,
  saveDraftSubmission,
  updateDraftSubmission,
} from '@/services/database';
import { syncPendingSubmissions } from '@/services/sync';
import NetInfo from '@react-native-community/netinfo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompleteActivityScreen() {
  const { id, draftId } = useLocalSearchParams<{
                            id: string;
                            draftId?: string;
                          }>();
  const [observation, setObservation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) {
        return;
      }

      try {
        const draft = await getDraftById(Number(draftId));

        if (!draft) {
          console.log('Draft not found.');
          return;
        }

        setObservation(draft.observation ?? '');

        if (draft.photoUri) {
          setPhotoUri(draft.photoUri);
        }

        if (draft.latitude !== null && draft.longitude !== null) {
          setLocation({
            coords: {
              latitude: draft.latitude,
              longitude: draft.longitude,
              altitude: null,
              accuracy: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        }

        console.log('Draft loaded successfully:', draft.id);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }

    loadDraft();
  }, [draftId]);

  const [cameraVisible, setCameraVisible] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const activityRequiresLocation = id === 'plant-observation';

  async function openCamera() {
  if (!cameraPermission?.granted) {
    const permission = await requestCameraPermission();

    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'FieldLearn needs camera access to capture activity evidence.'
      );
      return;
    }
  }

  setCameraVisible(true);
}

async function takePhoto() {
  if (!cameraRef.current) {
    return;
  }

  const photo = await cameraRef.current.takePictureAsync({
    quality: 0.7,
  });

  if (photo?.uri) {
    setPhotoUri(photo.uri);
    setCameraVisible(false);
  }
}
  
  async function captureLocation() {
    try {
        setLocationLoading(true);

        const { status } =
        await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
        Alert.alert(
            'Location permission required',
            'FieldLearn needs location access to record where this activity was completed.'
        );
        return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        });

        setLocation(currentLocation);
    } catch (error) {
        Alert.alert(
        'Location error',
        'Unable to capture your current location. Please make sure GPS is enabled and try again.'
        );
    } finally {
        setLocationLoading(false);
    }
  }

  async function handleSaveDraft() {
    try {
      if (draftId) {
        await updateDraftSubmission(
          Number(draftId),
          observation.trim(),
          photoUri,
          location?.coords.latitude ?? null,
          location?.coords.longitude ?? null
        );
      } else {
        await saveDraftSubmission(
          id ? String(id) : 'unknown',
          observation.trim(),
          photoUri,
          location?.coords.latitude ?? null,
          location?.coords.longitude ?? null
        );
      }

      Alert.alert(
        'Draft Saved',
        'Your activity has been saved as a draft. You can continue it later.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save draft:', error);

      Alert.alert(
        'Error',
        'The draft could not be saved. Please try again.'
      );
    }
  }

  async function handleSave() {
    if (!observation.trim()) {
      Alert.alert(
        'Observation required',
        'Please enter your observation before saving.'
      );
      return;
    }

    if (!photoUri) {
      Alert.alert(
        'Photo required',
        'Please add photo evidence before saving.'
      );
      return;
    }

    if (activityRequiresLocation && !location) {
      Alert.alert(
        'Location required',
        'Please capture your location before saving.'
      );
      return;
    }

    try {
        if (draftId) {
          await completeDraftSubmission(
            Number(draftId),
            observation.trim(),
            photoUri,
            location?.coords.latitude ?? null,
            location?.coords.longitude ?? null
          );
        } else {
          await saveActivitySubmission(
            id ?? 'unknown',
            observation.trim(),
            photoUri,
            location?.coords.latitude ?? null,
            location?.coords.longitude ?? null
          );
        }

        // Check internet immediately after saving
        const networkState = await NetInfo.fetch();

        const isOnline =
          networkState.isConnected === true &&
          networkState.isInternetReachable !== false;

        if (isOnline) {
          console.log('Online submission detected. Starting immediate sync...');

          const result = await syncPendingSubmissions();

          if (result.syncedCount > 0) {
            Alert.alert(
              'Saved & Synced',
              'Your activity was saved and synchronized successfully.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/progress'),
                },
              ]
            );

            return;
          }
        }

        // Offline OR synchronization could not happen
        Alert.alert(
          'Saved Offline',
          'Your activity has been saved on this device and will sync automatically when internet is available.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/progress'),
            },
          ]
        );

        setObservation('');
        setPhotoUri(null);
        setLocation(null);
        } catch (error) {
        console.error('Failed to save activity submission:', error);

        Alert.alert(
            'Save failed',
            'FieldLearn could not save your activity. Please try again.'
        );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Complete Activity</Text>

        <Text style={styles.subHeading}>
          Record your observations and learning evidence.
        </Text>

        <Text style={styles.label}>Your Observation</Text>

        <TextInput
          style={styles.textArea}
          placeholder="Describe what you observed and learned..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={observation}
          onChangeText={setObservation}
        />

        <Text style={styles.label}>Photo Evidence</Text>

        <View style={styles.card}>
          <Text style={styles.cardDescription}>
            Take a photo to provide evidence of your practical activity.
          </Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={openCamera}
            >
            <Text style={styles.secondaryButtonText}>
                {photoUri ? '📷 Retake Photo' : '📷 Add Photo'}
            </Text>
            </Pressable>

            {photoUri && (
            <Image
                source={{ uri: photoUri }}
                style={styles.previewImage}
            />
            )}
        </View>

        {activityRequiresLocation && (
          <>
            <Text style={styles.label}>Location</Text>

            <View style={styles.card}>
              <Text style={styles.cardDescription}>
                Capture the location where you completed this activity.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={captureLocation}
                disabled={locationLoading}
                >
                <Text style={styles.secondaryButtonText}>
                    {locationLoading
                    ? 'Getting Location...'
                    : location
                    ? '✓ Location Captured'
                    : '📍 Capture Location'}
                </Text>
                </Pressable>

                {location && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                    Latitude: {location.coords.latitude.toFixed(6)}
                    </Text>

                    <Text style={styles.locationText}>
                    Longitude: {location.coords.longitude.toFixed(6)}
                    </Text>

                    <Text style={styles.locationText}>
                    Accuracy: ±{Math.round(location.coords.accuracy ?? 0)} m
                    </Text>
                </View>
                )}
            </View>
          </>
        )}

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Completion Status</Text>

          <Text style={styles.statusItem}>
            {observation.trim() ? '✓' : '○'} Observation
          </Text>

          <Text style={styles.statusItem}>
            {photoUri ? '✓' : '○'} Photo Evidence
          </Text>

          {activityRequiresLocation && (
            <Text style={styles.statusItem}>
              {location ? '✓' : '○'} Location
            </Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.draftButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSaveDraft}
        >
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Progress</Text>
        </Pressable>

      </ScrollView>
      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
        >
        <View style={styles.cameraContainer}>
            <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            />

            <View style={styles.cameraControls}>
            <Pressable
                style={styles.cancelCameraButton}
                onPress={() => setCameraVisible(false)}
            >
                <Text style={styles.cameraButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
                style={styles.captureButton}
                onPress={takePhoto}
            >
                <View style={styles.captureInner} />
            </Pressable>

            <View style={styles.cameraSpacer} />
            </View>
        </View>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 6,
  },

  subHeading: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },

  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    minHeight: 140,
    fontSize: 15,
    color: '#111827',
    marginBottom: 24,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },

  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    marginBottom: 16,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 15,
  },

  statusCard: {
    backgroundColor: '#DBEAFE',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 12,
  },

  statusItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },

  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

    previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginTop: 16,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  camera: {
    flex: 1,
  },

  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
  },

  cancelCameraButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },

  cameraSpacer: {
    width: 70,
  },

  locationInfo: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 10,
  },

    locationText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  draftButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  draftButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
  },
});