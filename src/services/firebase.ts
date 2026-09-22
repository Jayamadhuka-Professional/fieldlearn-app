import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDIeSugWELs7PAzrk9yKorGafENqFAaDo",
  authDomain: "fieldlearn.firebaseapp.com",
  projectId: "fieldlearn",
  storageBucket: "fieldlearn.firebasestorage.app",
  messagingSenderId: "212807454176",
  appId: "1:212807454176:web:3998ba5ac977490ca1ef85"
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const firestore = getFirestore(app);

export default app;