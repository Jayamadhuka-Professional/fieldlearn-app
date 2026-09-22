import { useEffect } from 'react';

import { initializeDatabase } from '@/services/database';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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