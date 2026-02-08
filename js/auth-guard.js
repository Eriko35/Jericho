import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ_poDvhiZFPmFpPFeEnOku1cGcNxKRRM",
  authDomain: "kamuseo-dadf9.firebaseapp.com",
  projectId: "kamuseo-dadf9",
  storageBucket: "kamuseo-dadf9.firebasestorage.app",
  messagingSenderId: "604608096712",
  appId: "1:604608096712:web:21ecc54df78b2844b0f8fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // ❌ Not logged in → back to login page
    window.location.href = "index.html";
  } else {
    // ✅ Logged in → stay on home
    console.log("Logged in as:", user.email);
  }
});
