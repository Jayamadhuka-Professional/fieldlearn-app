import NetInfo from '@react-native-community/netinfo';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import {
  ActivitySubmission,
  getPendingSubmissions,
  markSubmissionAsSynced,
} from '@/services/database';

import { firestore } from '@/services/firebase';

async function uploadSubmissionToFirestore(
  submission: ActivitySubmission
) {
  const documentRef = doc(
    firestore,
    'activitySubmissions',
    `submission-${submission.id}`
  );

  await setDoc(documentRef, {
    localId: submission.id,
    activityId: submission.activityId,
    observation: submission.observation,
    photoUri: submission.photoUri,
    latitude: submission.latitude,
    longitude: submission.longitude,
    createdAt: submission.createdAt,
    syncedAt: serverTimestamp(),
  });

  return documentRef.id;
}

export async function syncPendingSubmissions() {
  try {

    const networkState = await NetInfo.fetch();

    const isOnline =
      networkState.isConnected === true &&
      networkState.isInternetReachable !== false;

    if (!isOnline) {
      console.log('Device is offline. Sync skipped.');

      return {
        success: false,
        syncedCount: 0,
        offline: true,
      };
    }

    console.log('Device is online. Starting synchronization.');

    const pendingSubmissions = await getPendingSubmissions();

    console.log(
      `Found ${pendingSubmissions.length} pending submission(s).`
    );

    if (pendingSubmissions.length === 0) {
      return {
        success: true,
        syncedCount: 0,
      };
    }

    let syncedCount = 0;

    for (const submission of pendingSubmissions) {
      try {
        const firestoreId =
          await uploadSubmissionToFirestore(submission);

        await markSubmissionAsSynced(submission.id);

        syncedCount++;

        console.log(
          `Submission ${submission.id} synced as ${firestoreId}`
        );
      } catch (error) {
        console.error(
          `Failed to sync submission ${submission.id}:`,
          error
        );
      }
    }

    return {
      success: true,
      syncedCount,
    };
  } catch (error) {
    console.error('Synchronization failed:', error);

    return {
      success: false,
      syncedCount: 0,
    };
  }
}