import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Standard sign-in helper - Using Redirect for better cross-domain reliability
export const signInWithGoogle = async () => {
  try {
    // If you want to keep using Popup, use signInWithPopup(auth, googleProvider)
    // But for many production issues on custom domains, Redirect is safer.
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error("Firebase Auth Initiation Error:", {
      code: error.code,
      message: error.message,
    });
    
    if (error.code === 'auth/unauthorized-domain') {
      alert("خطأ: هذا النطاق غير مصرح به في Firebase. يرجى إضافة رابط Vercel إلى Authorized Domains في إعدادات Firebase (Authentication -> Settings -> Authorized Domains).");
    } else {
      alert(`حدث خطأ أثناء بدء تسجيل الدخول: ${error.message}`);
    }
    
    throw error;
  }
};

// Handle redirect result (call this in your main hook or component)
export const handleRedirectResponse = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect success:", result.user.email);
      return result.user;
    }
  } catch (error: any) {
    console.error("Firebase Redirect Error:", error);
    alert(`فشل تسجيل الدخول بعد التحويل: ${error.message}`);
  }
  return null;
};

// Logout helper
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// Validation for first boot as per instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
