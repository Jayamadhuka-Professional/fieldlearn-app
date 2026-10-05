import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActivityCard from '@/components/ActivityCard';
import { getDraftByActivityId } from '@/services/database';

export default function ActivitiesScreen() {
  const [plantDraftId, setPlantDraftId] = useState<number | null>(null);
  const [communityDraftId, setCommunityDraftId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function loadDrafts() {
        try {
          const plantDraft =
            await getDraftByActivityId('plant-observation');

          const communityDraft =
            await getDraftByActivityId('community-observation');

          setPlantDraftId(plantDraft?.id ?? null);
          setCommunityDraftId(communityDraft?.id ?? null);

          console.log('Activity drafts:', {
            plant: plantDraft?.id ?? null,
            community: communityDraft?.id ?? null,
          });
        } catch (error) {
          console.error('Failed to load activity drafts:', error);
        }
      }

      loadDrafts();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Available Activities</Text>

        <Text style={styles.description}>
          Select a practical learning activity to begin.
        </Text>

        <ActivityCard
          testID="activity-plant-button"
          category="ENVIRONMENT"
          title="Local Plant Observation"
          description="Observe and document a plant in your local area using a photo, location and a short observation."
          requiresPhoto
          requiresLocation
          offlineSupported
          inProgress={plantDraftId !== null}
          onPress={() => {
            if (plantDraftId) {
              router.push({
                pathname: '/activity/complete',
                params: {
                  id: 'plant-observation',
                  draftId: String(plantDraftId),
                },
              });
            } else {
              router.push({
                pathname: '/activity/[id]',
                params: { id: 'plant-observation' },
              });
            }
          }}
        />

        <ActivityCard
          testID="activity-community-button"
          category="COMMUNITY"
          title="Community Learning Observation"
          description="Observe an educational or community facility and record what you learned from the visit."
          requiresPhoto
          offlineSupported
          inProgress={communityDraftId !== null}
          onPress={() => {
            if (communityDraftId) {
              router.push({
                pathname: '/activity/complete',
                params: {
                  id: 'community-observation',
                  draftId: String(communityDraftId),
                },
              });
            } else {
              router.push({
                pathname: '/activity/[id]',
                params: { id: 'community-observation' },
              });
            }
          }}
        />
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

  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 6,
  },

  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
});