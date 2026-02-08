 // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
  import {getFirestore, setDoc, doc} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDQ_poDvhiZFPmFpPFeEnOku1cGcNxKRRM",
    authDomain: "kamuseo-dadf9.firebaseapp.com",
    projectId: "kamuseo-dadf9",
    storageBucket: "kamuseo-dadf9.firebasestorage.app",
    messagingSenderId: "604608096712",
    appId: "1:604608096712:web:21ecc54df78b2844b0f8fd",
    measurementId: "G-ELWE92RRGY"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

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
        const errorCode=error.code;
        if(errorCode=='auth/email-already-in-use') {
            showMessage('Email Address Already Exist', 'signUpMessage')
        } else {
            showMessage('unable to create user', 'signUpMessage');
        }
    })
  })
     const signIn=document.getElementById('submitSignIn');
     signIn.addEventListener('click', (event)=>{
        event.preventDefault();
        const email=document.getElementById('email').value;
        const password=document.getElementById('password').value;
        const auth=getAuth(); 


         signInWithEmailAndPassword(auth, email,password)
         .then((userCredential)=>{
            showMessage('login is successful', 'signInMessage');
            const user=userCredential.user;
            localStorage.setItem('loggedInUserId', user.uid);
            window.location.href='homepage.html';
         })
         .catch((error)=>{  
            const errorCode=error.code;
            if(errorCode==='auth/invalid-credential'){
                showMessage('Incorrect Email or Password', 'signInMessage');
            }
             else{
                showMessage('Account does not Exist', 'signInMessage');
             }
         })        
           
     })