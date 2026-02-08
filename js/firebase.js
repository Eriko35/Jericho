import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ_poDvhiZFPmFpPFeEnOku1cGcNxKRRM",
  authDomain: "kamuseo-dadf9.firebaseapp.com",
  projectId: "kamuseo-dadf9",
  storageBucket: "kamuseo-dadf9.firebasestorage.app",
  messagingSenderId: "604608096712",
  appId: "1:604608096712:web:21ecc54df78b2844b0f8fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showMessage(msg, id) {
  const div = document.getElementById(id);
  div.innerText = msg;
  div.style.display = "block";
}

/* SIGN UP */
const signUpBtn = document.getElementById("submitSignUp");
if (signUpBtn) {
  signUpBtn.addEventListener("click", () => {
    const email = email-sp.value;
    const password = password-sp.value;
    const fName = fName-sp.value;
    const lName = lName-sp.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        return setDoc(doc(db, "users", cred.user.uid), {
          email,
          firstName: fName,
          lastName: lName
        });
      })
      .then(() => {
        window.location.href = "home.html";
      })
      .catch(() => {
        showMessage("Sign up failed", "signUpMessage");
      });
  });
}

/* SIGN IN */
const signInBtn = document.getElementById("submitSignIn");
if (signInBtn) {
  signInBtn.addEventListener("click", () => {
    const email = email-user.value;
    const password = password-user.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        localStorage.setItem("loggedInUserId", cred.user.uid);
        window.location.href = "home.html";
      })
      .catch(() => {
        showMessage("Invalid email or password", "signInMessage");
      });
  });
}
