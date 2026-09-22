import * as SQLite from 'expo-sqlite';

export type ActivitySubmission = {
  id: number;
  activityId: string;
  observation: string;
  photoUri: string;
  latitude: number | null;
  longitude: number | null;
  syncStatus: 'PENDING' | 'SYNCED';
  submissionStatus: 'DRAFT' | 'COMPLETED';
  createdAt: string;
};

const dbPromise = SQLite.openDatabaseAsync('fieldlearn.db');

export async function initializeDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS activity_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id TEXT NOT NULL,
      observation TEXT NOT NULL,
      photo_uri TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      sync_status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );
  `);

   try {
    await db.execAsync(`
      ALTER TABLE activity_submissions
      ADD COLUMN submission_status TEXT NOT NULL DEFAULT 'COMPLETED';
    `);

    console.log('submission_status column added.');
  } catch (error) {
    // Expected when the column already exists.
    console.log('submission_status column already exists.');
  }
}

export async function saveActivitySubmission(
  activityId: string,
  observation: string,
  photoUri: string,
  latitude: number | null,
  longitude: number | null
) {
  const db = await dbPromise;

  const createdAt = new Date().toISOString();

  const result = await db.runAsync(
    `
      INSERT INTO activity_submissions
      (
        activity_id,
        observation,
        photo_uri,
        latitude,
        longitude,
        sync_status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    activityId,
    observation,
    photoUri,
    latitude,
    longitude,
    'PENDING',
    createdAt
  );

  return result;
}

export async function saveDraftSubmission(
  activityId: string,
  observation: string,
  photoUri: string | null,
  latitude: number | null,
  longitude: number | null
) {
  const db = await dbPromise;

  const createdAt = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO activity_submissions (
      activity_id,
      observation,
      photo_uri,
      latitude,
      longitude,
      sync_status,
      submission_status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, 'PENDING', 'DRAFT', ?)
    `,
    [
      activityId || 'unknown',
      observation || '',
      photoUri || '',
      latitude,
      longitude,
      createdAt,
    ]
  );

  console.log('Draft saved successfully.');
}

export async function getAllSubmissions() {
  const db = await dbPromise;

  return db.getAllAsync<ActivitySubmission>(`
    SELECT
      id,
      activity_id AS activityId,
      observation,
      photo_uri AS photoUri,
      latitude,
      longitude,
      sync_status AS syncStatus,
      submission_status AS submissionStatus,
      created_at AS createdAt
    FROM activity_submissions
    ORDER BY id DESC
  `);
}

export async function getDraftById(id: number) {
  const db = await dbPromise;

  return db.getFirstAsync<ActivitySubmission>(
    `
    SELECT
      id,
      activity_id AS activityId,
      observation,
      photo_uri AS photoUri,
      latitude,
      longitude,
      sync_status AS syncStatus,
      submission_status AS submissionStatus,
      created_at AS createdAt
    FROM activity_submissions
    WHERE id = ?
      AND submission_status = 'DRAFT'
    LIMIT 1
    `,
    [id]
  );
}

export async function getPendingSubmissions() {
  const db = await dbPromise;

  return db.getAllAsync<ActivitySubmission>(`
    SELECT
      id,
      activity_id AS activityId,
      observation,
      photo_uri AS photoUri,
      latitude,
      longitude,
      sync_status AS syncStatus,
      submission_status AS submissionStatus,
      created_at AS createdAt
    FROM activity_submissions
    WHERE sync_status = 'PENDING'
      AND submission_status = 'COMPLETED'
    ORDER BY id ASC
  `);
}

export async function markSubmissionAsSynced(id: number) {
  const db = await dbPromise;

  await db.runAsync(
    `
      UPDATE activity_submissions
      SET sync_status = ?
      WHERE id = ?
    `,
    'SYNCED',
    id
  );
}

export async function getSubmissionCounts() {
  const db = await dbPromise;

  const totalResult = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count
    FROM activity_submissions
  `);

  const pendingResult = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count
    FROM activity_submissions
    WHERE sync_status = 'PENDING'
      AND submission_status = 'COMPLETED'
  `);

  const syncedResult = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count
    FROM activity_submissions
    WHERE sync_status = 'SYNCED'
      AND submission_status = 'COMPLETED'
  `);

  const draftResult = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count
    FROM activity_submissions
    WHERE submission_status = 'DRAFT'
  `);

  return {
    total: totalResult?.count ?? 0,
    pending: pendingResult?.count ?? 0,
    synced: syncedResult?.count ?? 0,
    drafts: draftResult?.count ?? 0,
  };
}