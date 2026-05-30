// firebaseConfig.js
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAOAoPNHla_2jGN2AWEJGZip9sPcuLDSrc',
  authDomain: 'centroespiritabzmbd.firebaseapp.com',
  projectId: 'centroespiritabzmbd',
  storageBucket: 'centroespiritabzmbd.firebasestorage.app',
  messagingSenderId: '1008003125312',
  appId: '1:1008003125312:web:a907ad037b29990cc7cfa5',
  measurementId: 'G-VQ8NB2Z5NM',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error?.code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}

const auth = createAuth();

const db = getFirestore(app);

export { auth, db };
