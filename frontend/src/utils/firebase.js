// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';       // 👈 add this
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:               import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:           import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:            import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:                import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:        import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app  = initializeApp(firebaseConfig);

export const auth = getAuth(app);          // 🔑 Auth
export const db   = getFirestore(app);     // 🗄️ Firestore  ← NEW

// Analytics (only in browser, not SSR)
export const analytics = (await isSupported()) ? getAnalytics(app) : null;

export default app;
