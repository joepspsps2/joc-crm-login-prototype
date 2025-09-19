import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, linkWithCredential, AuthCredential } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Configure Apple provider to request email and name
appleProvider.addScope('email');
appleProvider.addScope('name');

// Auth functions with proper Firebase handler logging  
export const signInWithGoogle = () => {
  console.log('🔵 Starting Google OAuth sign-in...');
  console.log('🔵 Firebase Project ID:', auth.app.options.projectId);
  const domain = auth.app.options.authDomain;
  console.log('🔵 Firebase auth handler:', domain ? `https://${domain}/__/auth/handler` : '(missing authDomain)');
  return signInWithRedirect(auth, googleProvider);
};

export const signInWithApple = () => {
  console.log('🍎 Starting Apple OAuth sign-in...');
  console.log('🍎 Firebase Project ID:', auth.app.options.projectId);
  const domain = auth.app.options.authDomain;
  console.log('🍎 Firebase auth handler:', domain ? `https://${domain}/__/auth/handler` : '(missing authDomain)');
  return signInWithRedirect(auth, appleProvider);
};

export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);

export const linkAccount = (credential: AuthCredential) => {
  if (auth.currentUser) {
    return linkWithCredential(auth.currentUser, credential);
  }
  throw new Error('No authenticated user');
};

// Handle redirect result with detailed error diagnostics
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Handle successful authentication
      console.log('✅ Authentication successful:', result.user.email);
      
      // Log provider for debugging
      if (result.user.providerData.length > 0) {
        console.log('✅ Login provider:', result.user.providerData[0].providerId);
      }
      
      return result.user;
    }
  } catch (error: any) {
    // Enhanced error logging for OAuth troubleshooting
    console.error('❌ Authentication error details:');
    console.error('  Error code:', error.code);
    console.error('  Error message:', error.message);
    if (error.customData) {
      console.error('  Custom data:', error.customData);
    }
    
    // Common OAuth error codes and explanations
    switch (error.code) {
      case 'auth/unauthorized-domain':
        console.error('  → Domain not authorized in Firebase Console');
        break;
      case 'auth/operation-not-allowed':
        console.error('  → Provider not enabled in Firebase Auth');
        break;
      case 'auth/account-exists-with-different-credential':
        console.error('  → Account exists with different sign-in method');
        break;
      default:
        console.error('  → Check Firebase Auth configuration');
    }
    
    throw error;
  }
};
