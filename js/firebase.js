import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 YOUR FIREBASE CONFIG */
const firebaseConfig = {
    apiKey: "AIzaSyDQ_poDvhiZFPmFpPFeEnOku1cGcNxKRRM",
    authDomain: "kamuseo-dadf9.firebaseapp.com",
    projectId: "kamuseo-dadf9",
    storageBucket: "kamuseo-dadf9.firebasestorage.app",
    messagingSenderId: "604608096712",
    appId: "1:604608096712:web:21ecc54df78b2844b0f8fd",
    measurementId: "G-ELWE92RRGY"
  };

/* INIT */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* WAIT FOR DOM */
window.addEventListener("DOMContentLoaded", () => {

  /* ---------- LOGIN ---------- */
  const loginBtn = document.getElementById("submitSignIn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {

      // ✅ DECLARE FIRST (this fixes your error)
      const emailInput = document.getElementById("email-user");
      const passwordInput = document.getElementById("password-user");

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert("Please fill in all fields");
        return;
      }

      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // Ensure user exists in Firestore
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            email: email,
            createdAt: new Date()
          });
        }

        window.location.href = "home.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }

  /* ---------- SIGN UP ---------- */
  const signupBtn = document.getElementById("submitSignUp");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {

      // ✅ DECLARE FIRST
      const email = document.getElementById("email-sp").value.trim();
      const password = document.getElementById("password-sp").value.trim();
      const fName = document.getElementById("fName-sp").value.trim();
      const lName = document.getElementById("lName-sp").value.trim();

      if (!email || !password || !fName || !lName) {
        alert("Please complete all fields");
        return;
      }

      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        await setDoc(doc(db, "users", uid), {
          email,
          firstName: fName,
          lastName: lName,
          role: "user",
          createdAt: new Date()
        });

        window.location.href = "home.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }

});
