import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- เอากุญแจที่คุณก๊อปไว้ มาวางทับตรงนี้ทั้งก้อนเลยครับ ---
const firebaseConfig = {
 apiKey: "AIzaSyA4XZFXnb68A5BPYV7wMUon_9PphflRh4g",
  authDomain: "team-tawee-command-center.firebaseapp.com",
  projectId: "team-tawee-command-center",
  storageBucket: "team-tawee-command-center.firebasestorage.app",
  messagingSenderId: "1094944636986",
  appId: "1:1094944636986:web:e2f25cb3db139b3a1af503",
  measurementId: "G-KVQCW6HZYE"
};
// ---------------------------------------------------

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);