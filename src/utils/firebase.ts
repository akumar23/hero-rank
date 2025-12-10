// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app'
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if API key is available (not during build without env vars)
const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!firebase.apps.length && isFirebaseConfigured) {
    firebase.initializeApp(firebaseConfig)
}

// Export Firebase services (will be undefined if not configured)
export const auth = isFirebaseConfigured ? firebase.auth() : null;
export const firestore = isFirebaseConfigured ? firebase.firestore() : null;
export const storage = isFirebaseConfigured ? firebase.storage() : null;
export const googleAuthProvider = isFirebaseConfigured ? new firebase.auth.GoogleAuthProvider() : null;
export const fromMillis = firebase.firestore.Timestamp.fromMillis;
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const STATE_CHANGED = firebase.storage.TaskEvent.STATE_CHANGED;

// Type guard to check if Firebase is available
export const isFirebaseAvailable = (): boolean => isFirebaseConfigured && firebase.apps.length > 0;

export async function getUserWithUsername(username: any) {
    if (!firestore) return null;
    const usersRef = firestore.collection('users');
    const query = usersRef.where('username', '==', username).limit(1);
    const currUser = (await query.get()).docs[0];
    return currUser;
}

export function postToJSON(doc: { data: () => any; }) {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt.toMillis(),
      updatedAt: data.updatedAt.toMillis(),
    };
  }