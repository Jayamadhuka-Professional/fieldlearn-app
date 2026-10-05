import { syncPendingSubmissions } from '@/services/sync';

import { router, useFocusEffect } from 'expo-router';

import { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActivitySubmission,
  getAllSubmissions,
} from '@/services/database';

export default function ProgressScreen() {
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const inProgressSubmissions = submissions.filter(
    (submission) => submission.submissionStatus === 'DRAFT'
  );

  const completedSubmissions = submissions.filter(
    (submission) => submission.submissionStatus === 'COMPLETED'
  );

  async function loadSubmissions() {
    try {
      setLoading(true);

      const data = await getAllSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSubmissions();
    }, [])
  );

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const data = await getAllSubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error(
          'Failed to refresh progress submissions:',
          error
        );
      }
    }, 2000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  

  async function handleSync() {
    const result = await syncPendingSubmissions();

    if (result.offline) {
      Alert.alert(
        'Offline',
        'No internet connection. Your progress will remain saved on this device.'
      );
      return;
    }

    // Reload SQLite data so the UI shows the new SYNCED status
    await loadSubmissions();

    Alert.alert(
      'Synchronization complete',
      `${result.syncedCount} submission(s) synchronized successfully.`
    );
  }

  return (
    <SafeAreaView
      testID="progress-screen"
      style={styles.safeArea}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Saved Progress</Text>

        <Text style={styles.description}>
          Activities saved on this device, including work waiting to sync.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : submissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No saved activities</Text>

            <Text style={styles.emptyText}>
              Your completed activities will appear here.
            </Text>
          </View>
        ) : (
        <>
          {inProgressSubmissions.length > 0 && (
            <Text style={styles.sectionTitle}>In Progress</Text>
          )}

          {inProgressSubmissions.map((submission) => (
            <View key={submission.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.activityName}>
                  {submission.activityId === 'plant-observation'
                    ? 'Local Plant Observation'
                    : 'Community Learning Observation'}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    submission.submissionStatus === 'DRAFT'
                      ? styles.draftBadge
                      : submission.syncStatus === 'SYNCED'
                        ? styles.syncedBadge
                        : styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {submission.submissionStatus === 'DRAFT'
                      ? 'IN PROGRESS'
                      : submission.syncStatus === 'SYNCED'
                        ? 'SYNCED'
                        : 'PENDING SYNC'}
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Observation</Text>
              <Text style={styles.value}>{submission.observation}</Text>

              <Text style={styles.label}>Evidence</Text>
              <Text style={styles.value}>
                {submission.photoUri ? '✓ Photo saved' : 'No photo added yet'}
              </Text>

              {submission.photoUri ? (
                <Image
                  source={{ uri: submission.photoUri }}
                  style={styles.evidenceImage}
                  resizeMode="cover"
                />
              ) : null}

              {submission.latitude !== null &&
                submission.longitude !== null && (
                  <>
                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.value}>✓ GPS location saved</Text>
                  </>
                )}

              <Text style={styles.date}>
                Saved: {new Date(submission.createdAt).toLocaleString()}
              </Text>
              {submission.submissionStatus === 'DRAFT' && (
                <Pressable
                  testID={`continue-draft-${submission.id}`}
                  accessibilityLabel="Continue Activity"
                  style={styles.continueButton}
                  onPress={() =>
                    router.push({
                      pathname: '/activity/complete',
                      params: {
                        id: submission.activityId,
                        draftId: String(submission.id),
                      },
                    })
                  }
                >
                  <Text style={styles.continueButtonText}>
                    Continue Activity
                  </Text>
                </Pressable>
              )}
              
              {submissions.some(
                (submission) =>
                  submission.submissionStatus === 'COMPLETED' &&
                  submission.syncStatus === 'PENDING'
              ) && (
                <Pressable
                  testID="progress-sync-all-button"
                  accessibilityLabel="Sync All Pending"
                  style={styles.syncButton}
                  onPress={handleSync}
                >
                  <Text style={styles.syncButtonText}>☁️ Sync Now</Text>
                </Pressable>
              )}
            </View>
          ))}

          {completedSubmissions.length > 0 && (
            <Text style={styles.sectionTitle}>Completed</Text>
          )}

          {completedSubmissions.map((submission) => (
            <View key={submission.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.activityName}>
                  {submission.activityId === 'plant-observation'
                    ? 'Local Plant Observation'
                    : 'Community Learning Observation'}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    submission.syncStatus === 'SYNCED'
                      ? styles.syncedBadge
                      : styles.pendingBadge,
                  ]}
                >
                  <Text
                    testID={`submission-status-${submission.id}`}
                    accessibilityLabel={`Submission ${submission.id} ${submission.syncStatus}`}
                    style={styles.statusText}
                  >
                    {submission.syncStatus === 'SYNCED'
                      ? 'SYNCED'
                      : 'PENDING SYNC'}
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Observation</Text>
              <Text style={styles.value}>{submission.observation}</Text>

              <Text style={styles.label}>Evidence</Text>
              <Text style={styles.value}>
                {submission.photoUri ? '✓ Photo saved' : 'No photo saved'}
              </Text>

              {submission.photoUri ? (
                <Image
                  source={{ uri: submission.photoUri }}
                  style={styles.evidenceImage}
                  resizeMode="cover"
                />
              ) : null}

              {submission.latitude !== null &&
                submission.longitude !== null && (
                  <>
                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.value}>✓ GPS location saved</Text>
                  </>
                )}

              <Text style={styles.date}>
                Saved: {new Date(submission.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}

          {completedSubmissions.some(
            (submission) => submission.syncStatus === 'PENDING'
          ) && (
            <Pressable
              testID="progress-sync-all-button"
              accessibilityLabel="Sync All Pending"
              style={styles.syncButton}
              onPress={handleSync}
            >
              <Text style={styles.syncButtonText}>☁️ Sync All Pending</Text>
            </Pressable>
          )}
          </>
        )}
      </ScrollView>
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

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 6,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 24,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  emptyText: {
    color: '#6B7280',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  cardHeader: {
    marginBottom: 16,
  },

  activityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 10,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },

  syncedBadge: {
    backgroundColor: '#DCFCE7',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 3,
  },

  value: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },

  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
  syncButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },

  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  evidenceImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  draftBadge: {
    backgroundColor: '#DBEAFE',
  },
  continueButton: {
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 12,
    marginTop: 4,
  },
});