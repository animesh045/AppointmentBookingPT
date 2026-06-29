import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

export const hasFirebaseCredentials = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain
  );
};

export const isDevMode = (): boolean => {
  return process.env.NODE_ENV === 'development' || true;
};

let app: any = null;
let auth: any = null;
let db: any = null;
let messaging: any = null;

if (typeof window !== 'undefined' && hasFirebaseCredentials()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Dynamically import messaging to avoid Next.js SSR crashes
    import('firebase/messaging').then(({ getMessaging, isSupported }) => {
      isSupported().then((supported) => {
        if (supported) {
          messaging = getMessaging(app);
        }
      }).catch(err => console.error('FCM support check failed:', err));
    }).catch(err => console.error('FCM import failed:', err));
  } catch (err) {
    console.error('Firebase Client SDK initialization error:', err);
  }
}

export { app, auth, db, messaging };
