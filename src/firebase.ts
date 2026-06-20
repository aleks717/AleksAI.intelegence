import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBOa0ffEtHqHtwfl5FKgqh3YboR_xgOOHY",
  authDomain: "gen-lang-client-0247387289.firebaseapp.com",
  projectId: "gen-lang-client-0247387289",
  storageBucket: "gen-lang-client-0247387289.firebasestorage.app",
  messagingSenderId: "864723823708",
  appId: "1:864723823708:web:cd8de51e5196646ae8ca99"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider
};
