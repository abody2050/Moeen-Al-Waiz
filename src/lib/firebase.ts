import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Standard sign-in helper
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Auth Error Details:", {
      code: error.code,
      message: error.message,
      email: error.customData?.email,
      credential: GoogleAuthProvider.credentialFromError(error),
    });
    
    // Check for specific common errors
    if (error.code === 'auth/unauthorized-domain') {
      alert("خطأ: هذا النطاق غير مصرح به في Firebase. يرجى إضافة رابط Vercel إلى Authorized Domains في إعدادات Firebase.");
    } else if (error.code === 'auth/popup-blocked') {
      alert("تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة للموقع.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup before finishing sign-in.");
    } else {
      alert(`حدث خطأ أثناء تسجيل الدخول: ${error.message}`);
    }
    
    throw error;
  }
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
