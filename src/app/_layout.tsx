import { useEffect } from 'react';

import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { initializeDatabase } from '@/services/database';
import { syncPendingSubmissions } from '@/services/sync';

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log('FieldLearn database initialized');
      })
      .catch((error) => {
        console.error('Database initialization failed:', error);
      });
  }, []);

  // Global automatic synchronization
  useEffect(() => {
    let syncInProgress = false;

    const checkAndSync = async () => {
      try {
        const state = await NetInfo.fetch();

        const online =
          state.isConnected === true &&
          state.isInternetReachable !== false;

        console.log('GLOBAL connectivity check:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
        });

        if (!online || syncInProgress) {
          return;
        }

        syncInProgress = true;

        console.log('Checking for pending submissions...');

        const result = await syncPendingSubmissions();

        console.log('Global automatic sync result:', result);
      } catch (error) {
        console.error(
          'Global automatic synchronization failed:',
          error
        );
      } finally {
        syncInProgress = false;
      }
    };

    // Check once when the application starts
    checkAndSync();

    // Check periodically while the application is running
    const interval = setInterval(() => {
      checkAndSync();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#F5F7FB',
          },
          headerTintColor: '#172554',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#F5F7FB',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="activities"
          options={{
            title: 'Activities',
          }}
        />

        <Stack.Screen
          name="activity/[id]"
          options={{
            title: 'Activity Details',
          }}
        />

        <Stack.Screen
          name="activity/complete"
          options={{
            title: 'Complete Activity',
          }}
        />

        <Stack.Screen
          name="progress"
          options={{
            title: 'Saved Progress',
          }}
        />
      </Stack>
    </>
  );
}