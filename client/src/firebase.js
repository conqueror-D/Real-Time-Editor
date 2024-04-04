// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBowcPMjMJzQPhnyVc0ib-zIg3bbHtINdI",
  authDomain: "colive-coder.firebaseapp.com",
  projectId: "colive-coder",
  storageBucket: "colive-coder.appspot.com",
  messagingSenderId: "993340726857",
  appId: "1:993340726857:web:ab2f850646ad030d19a998",
  measurementId: "G-5Q585J52TK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
