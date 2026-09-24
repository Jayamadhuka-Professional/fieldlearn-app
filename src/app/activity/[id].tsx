import { getDraftByActivityId } from '@/services/database';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const activities = {
  'plant-observation': {
    category: 'ENVIRONMENT',
    title: 'Local Plant Observation',
    description:
      'Identify and document three different plants in your area using photos and short observations.',
    instructions: [
      'Find three different plants in your local area.',
      'Observe the visible characteristics of each plant.',
      'Take at least one photo as evidence.',
      'Write a short observation about what you discovered.',
      'Record your location when completing the activity.',
    ],
    photoRequired: true,
    locationRequired: true,
  },

  'community-observation': {
    category: 'COMMUNITY',
    title: 'Community Learning Observation',
    description:
      'Observe an educational or community facility and record what you learned from the visit.',
    instructions: [
      'Select an educational or community facility.',
      'Observe the purpose of the facility.',
      'Take a photo as evidence.',
      'Write a short description of what you learned.',
    ],
    photoRequired: true,
    locationRequired: false,
  },
};

export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [draftId, setDraftId] = useState<number | null>(null);

  const activity = activities[id as keyof typeof activities];

  useFocusEffect(
    useCallback(() => {
      async function loadDraft() {
        if (!id) return;

        try {
          const draft = await getDraftByActivityId(id);

          if (draft) {
            setDraftId(draft.id);
            console.log('Existing draft found:', draft.id);
          } else {
            setDraftId(null);
            console.log('No existing draft found.');
          }
        } catch (error) {
          console.error('Failed to check for existing draft:', error);
        }
      }

      loadDraft();
    }, [id])
  );

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Activity not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.category}>{activity.category}</Text>

        <Text style={styles.title}>{activity.title}</Text>

        <Text style={styles.description}>{activity.description}</Text>

        <View style={styles.requirementCard}>
          <Text style={styles.cardTitle}>Requirements</Text>

          {activity.photoRequired && (
            <Text style={styles.requirement}>📷 Photo evidence required</Text>
          )}

          {activity.locationRequired && (
            <Text style={styles.requirement}>📍 Location required</Text>
          )}

          <Text style={styles.requirement}>✓ Available offline</Text>
        </View>

        <Text style={styles.sectionTitle}>Instructions</Text>

        <View style={styles.instructionsCard}>
          {activity.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>

              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.buttonPressed,
        ]}
          onPress={() =>
            router.push({
              pathname: '/activity/complete',
              params: {
                id,
                ...(draftId ? { draftId: String(draftId) } : {}),
              },
            })
          }
        >
          <Text style={styles.startButtonText}>
            {draftId ? 'Continue Activity' : 'Start Activity'}
          </Text>
        </Pressable>
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

  category: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#6B7280',
    marginBottom: 24,
  },

  requirementCard: {
    backgroundColor: '#DBEAFE',
    padding: 18,
    borderRadius: 16,
    marginBottom: 26,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 12,
  },

  requirement: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  instructionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },

  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  numberText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },

  startButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});