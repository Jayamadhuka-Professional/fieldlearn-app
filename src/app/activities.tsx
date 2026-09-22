import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActivityCard from '@/components/ActivityCard';

export default function ActivitiesScreen() {
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
          category="ENVIRONMENT"
          title="Local Plant Observation"
          description="Identify and document three different plants in your area using photos and short observations."
          requiresPhoto
          requiresLocation
          offlineSupported
          onPress={() =>
            router.push({
              pathname: '/activity/[id]',
              params: { id: 'plant-observation' },
            })
          }
        />

        <ActivityCard
          category="COMMUNITY"
          title="Community Learning Observation"
          description="Observe an educational or community facility and record what you learned from the visit."
          requiresPhoto
          offlineSupported
          onPress={() =>
            router.push({
              pathname: '/activity/[id]',
              params: { id: 'community-observation' },
            })
          }
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