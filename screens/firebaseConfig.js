// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOAoPNHla_2jGN2AWEJGZip9sPcuLDSrc",
  authDomain: "centroespiritabzmbd.firebaseapp.com",
  projectId: "centroespiritabzmbd",
  storageBucket: "centroespiritabzmbd.firebasestorage.app",
  messagingSenderId: "1008003125312",
  appId: "1:1008003125312:web:a907ad037b29990cc7cfa5",
  measurementId: "G-VQ8NB2Z5NM"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
