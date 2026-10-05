import {
  ActivitySubmission,
  getAllSubmissions,
  getSubmissionCounts,
} from '@/services/database';
import NetInfo from '@react-native-community/netinfo';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [progressCounts, setProgressCounts] = useState({
    completed: 0,
    inProgress: 0,
    pending: 0,
  });

  const [isOnline, setIsOnline] = useState(true);

  const [recentSubmission, setRecentSubmission] =
  useState<ActivitySubmission | null>(null);

  const loadProgressCounts = useCallback(async () => {
    try {
      const counts = await getSubmissionCounts();
      const submissions = await getAllSubmissions();

      setProgressCounts({
        completed: counts.synced,
        inProgress: counts.drafts,
        pending: counts.pending,
      });

      setRecentSubmission(
        submissions.length > 0 ? submissions[0] : null
      );
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true &&
        state.isInternetReachable === true;

      console.log('Network state:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });

      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressCounts();
    }, [loadProgressCounts])
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>FieldLearn</Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>S</Text>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Learn anywhere.</Text>

          <Text style={styles.heroDescription}>
            Complete practical learning activities, capture evidence and
            continue working even when you are offline.
          </Text>

          <Pressable
            testID="home-view-activities-button"
            accessibilityLabel="View Activities"
            style={styles.primaryButton}
            onPress={() => router.push('/activities')}
          >
            <Text style={styles.primaryButtonText}>View Activities</Text>
          </Pressable>
        </View>

        {/* Sync status */}
        <View style={styles.syncCard}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline ? '#22C55E' : '#F59E0B',
              },
            ]}
          />

          <View style={styles.syncTextContainer}>
            <Text
              testID="home-network-status"
              style={styles.syncTitle}
            >
              {isOnline ? "You're online" : "You're offline"}
            </Text>

            <Text style={styles.syncDescription}>
              {isOnline
                ? 'Your learning progress is ready to sync.'
                : 'You can continue working. Progress will be saved on this device.'}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <Pressable
          testID="home-progress-button"
          accessibilityLabel="Your Progress"
          onPress={() => router.push('/progress')}
        >
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View>
                <Text style={styles.progressNumber}>
                  {progressCounts.completed}
                </Text>
                <Text style={styles.progressLabel}>Completed</Text>
              </View>

              <View>
                <Text style={styles.progressNumber}>
                  {progressCounts.inProgress}
                </Text>
                <Text style={styles.progressLabel}>In Progress</Text>
              </View>

              <View>
                <Text style={styles.progressNumber}>
                  {progressCounts.pending}
                </Text>
                <Text style={styles.progressLabel}>Pending Sync</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Activities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>

          <Pressable onPress={() => router.push('/progress')}>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>

        {recentSubmission ? (
          <Pressable
            onPress={() => {
              if (recentSubmission.submissionStatus === 'DRAFT') {
                router.push({
                  pathname: '/activity/complete',
                  params: {
                    id: recentSubmission.activityId,
                    draftId: String(recentSubmission.id),
                  },
                });
              } else {
                router.push('/progress');
              }
            }}
          >
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🌱</Text>

              <Text style={styles.emptyTitle}>
                Local Plant Observation
              </Text>

              <Text style={styles.emptyDescription}>
                {recentSubmission.observation}
              </Text>

              <Text
                style={[
                  styles.recentStatus,
                  recentSubmission.submissionStatus === 'DRAFT'
                    ? styles.draftStatus
                    : recentSubmission.syncStatus === 'SYNCED'
                      ? styles.syncedStatus
                      : styles.pendingStatus,
                ]}
              >
                {recentSubmission.submissionStatus === 'DRAFT'
                  ? '◷ IN PROGRESS'
                  : recentSubmission.syncStatus === 'SYNCED'
                    ? '✓ SYNCED'
                    : '⏳ PENDING SYNC'}
              </Text>

              {recentSubmission.submissionStatus === 'DRAFT' && (
                <View style={styles.continueHint}>
                  <Text style={styles.continueHintText}>Continue Activity →</Text>
                </View>
              )}

            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyDescription}>
              Your practical learning activities will appear here.
            </Text>
          </View>
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
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  welcomeText: {
    fontSize: 15,
    color: '#6B7280',
  },

  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172554',
  },

  profileCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  heroCard: {
    backgroundColor: '#1D4ED8',
    padding: 22,
    borderRadius: 20,
    marginBottom: 18,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#DBEAFE',
    marginBottom: 20,
  },

  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  primaryButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 15,
  },

  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 26,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    marginRight: 12,
  },

  syncTextContainer: {
    flex: 1,
  },

  syncTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  syncDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 26,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  progressNumber: {
    fontSize: 23,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
  },

  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  recentStatus: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },

  syncedStatus: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
  },

  pendingStatus: {
    color: '#854D0E',
    backgroundColor: '#FEF3C7',
  },

  draftStatus: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  continueHint: {
    marginTop: 16,
    alignItems: 'center',
  },

  continueHintText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
});