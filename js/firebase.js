// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
  import {getFirestore, setDoc, doc, getDoc} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

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
  //const analytics = getAnalytics(app);

  function showMessage(message, divId){
    var messsageDiv=document.getElementById(divId);
    messsageDiv.style.display='block';
    messsageDiv.innerHTML=message;
    messsageDiv.style.opacity=1;
    setTimeout(function(){
        messsageDiv.style.opacity=0;
    },5000)

  }
  const signUp = document.getElementById('submitSignUp');
  signUp.addEventListener('click', (event)=> {
    event.preventDefault();
    const email=document.getElementById('email-sp').value;
    const fName=document.getElementById('fName-sp').value;
    const lName=document.getElementById('lName-sp').value;
    const password=document.getElementById('password-sp').value;

    const auth=getAuth();
    const db=getFirestore();

    createUserWithEmailAndPassword(auth, email, password).then((userCredential)=> {
        const user=userCredential.user;
        const userData={
            email: email,
            firstName: fName,
            lastName: lName,
        };
        showMessage('Account Created Successfully', 'signUpMessage');
        const docRef=doc(db, "users", user.uid);
        setDoc(docRef, userData).then(()=>{
            window.location.href='index.html';
        }).catch((error)=>{
            console.error("error writing document", error);
        });
    }).catch((error)=> {
    console.error(error.code, error.message);

    if (error.code === 'auth/email-already-in-use') {
        showMessage('Email Address Already Exists', 'signUpMessage');
    } else if (error.code === 'auth/weak-password') {
        showMessage('Password should be at least 6 characters', 'signUpMessage');
    } else if (error.code === 'auth/invalid-email') {
        showMessage('Invalid email address', 'signUpMessage');
    } else {
        showMessage(error.message, 'signUpMessage');
    }
    })
  });

  const signIn=document.getElementById('submitSignIn');

  signIn.addEventListener('click', (event)=>{
    event.preventDefault();
    const email=document.getElementById('usr-email').value;
    const password=document.getElementById('usr-password').value;
    const auth=getAuth();

    signInWithEmailAndPassword(auth, email,password).then((userCredential) => {
        const user=userCredential.user;
        const db=getFirestore();
        const docRef=doc(db, "users", user.uid);
        getDoc(docRef).then((docSnap)=>{
            if (docSnap.exists()) {
                if(docSnap.data().isBanned) {
                    showMessage('This account has been banned.', 'signInMessage');
                } else {
                    showMessage('login is successful', 'signInMessage');
                    localStorage.setItem('loggedInUserId', user.uid);
                    window.location.href='home2.html';
                }
            } else {
                // Safeguard against missing Firestore document for an authenticated user
                showMessage('User data not found. Please contact support.', 'signInMessage');
            }
        })
    }).catch((error) => {
        const errorCode = error.code;
        if(errorCode==='auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
            showMessage('An error occurred during login. Please try again.', 'signInMessage');
        }
    })
  })
