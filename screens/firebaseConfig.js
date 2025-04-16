// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Importando Firestore

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
const auth = getAuth(app);
const db = getFirestore(app);  // Inicializando o Firestore

export { auth, db };  // Exportando o Firestore
