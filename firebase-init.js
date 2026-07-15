/* ===== Extracted <script> block 7 ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBrsGRLVMcKcplOFq8hdz5DKklNycu1sOw",
  authDomain: "stayconfidentpghomes-e3344.firebaseapp.com",
  projectId: "stayconfidentpghomes-e3344",
  storageBucket: "stayconfidentpghomes-e3344.firebasestorage.app",
  messagingSenderId: "860324868887",
  appId: "1:860324868887:web:3ce1e5855f1688b1673d52",
  measurementId: "G-MDVYTJ15W9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.db = db;

console.log("✅ Firebase Connected Successfully");

