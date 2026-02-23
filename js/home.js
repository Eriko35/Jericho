import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {getFirestore, getDoc, doc} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBrBpjTkPlOM7fDKHx97QYZGzGET-XWpEs",
    authDomain: "kamuseo-651a2.firebaseapp.com",
    projectId: "kamuseo-651a2",
    storageBucket: "kamuseo-651a2.firebasestorage.app",
    messagingSenderId: "281398036298",
    appId: "1:281398036298:web:ecc0aca0d0d48b473f23b3",
    measurementId: "G-QGJB7ERWYW"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth();
  const db=getFirestore();

  onAuthStateChanged(auth, (user)=>{
    const loggedInUserId=localStorage.getItem('loggedInUserId');
    if(loggedInUserId){
        const docRef = doc(db, "users", loggedInUserId);
        getAuth(docRef).then((docSnap)=>{
            if(docSnap.exists()){
                const userData=docSnap.data();
            }
        })
    }
  });