import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC7uYzZ3C1i6ND9Wly5xlwFN8RDcpvQ8wU',
  authDomain: 'ass1-mma.firebaseapp.com',
  projectId: 'ass1-mma',
  storageBucket: 'ass1-mma.firebasestorage.app',
  messagingSenderId: '976848690701',
  appId: '1:976848690701:web:8d6a2e3ea8321668d4ff44',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);

let authInstance: any;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

