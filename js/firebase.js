// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
  import {getFirestore, setDoc, doc, getDoc, collection, addDoc, query, where, getDocs, orderBy} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
  // Firebase Storage import for image uploads
  import {getStorage, ref, uploadBytes, getDownloadURL, deleteObject} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

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
  
  // Initialize Firebase Storage
  const storage = getStorage(app);
  
  // Initialize Firestore
  const db = getFirestore(app);
  
  // Initialize Auth
  const auth = getAuth(app);
  //const analytics = getAnalytics(app);

  // ============================================
  // STORAGE CONFIGURATION
  // ============================================
  
  // Allowed file types for image uploads
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  // Maximum file size (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // Storage bucket reference
  const artworkStorageRef = ref(storage, 'artworks/');
  
  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  
  /**
   * Validate image file type and size
   * @param {File} file - The file to validate
   * @returns {Object} - Validation result with isValid and error message
   */
  function validateImageFile(file) {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: `Invalid file type. Allowed: JPEG, PNG, GIF, WebP` 
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File too large. Maximum size: 10MB` 
      };
    }
    
    return { isValid: true, error: null };
  }
  
  /**
   * Generate unique file path for artwork
   * @param {string} userId - Artist's user ID
   * @param {string} fileName - Original file name
   * @returns {string} - Unique file path
   */
  function generateArtworkPath(userId, fileName) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    return `artworks/${userId}/${timestamp}-${randomSuffix}.${extension}`;
  }
  
  // ============================================
  // ARTWORK UPLOAD FUNCTIONS
  // ============================================
  
  /**
   * Upload artwork image to Firebase Storage
   * @param {File} file - The image file to upload
   * @param {string} userId - The artist's user ID
   * @returns {Promise<Object>} - Result with download URL or error
   */
  async function uploadArtworkImage(file, userId) {
    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Generate unique file path
      const filePath = generateArtworkPath(userId, file.name);
      const storageRef = ref(storage, filePath);
      
      // Upload file with metadata
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public, max-age=3600'
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        path: filePath,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      };
      
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }
  
  /**
   * Delete artwork image from Firebase Storage
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<Object>} - Result with success or error
   */
  async function deleteArtworkImage(filePath) {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================
  // ARTWORK DATABASE FUNCTIONS
  // ============================================
  
  /**
   * Save artwork to Firestore
   * @param {string} artistId - The artist's user ID
   * @param {Object} artworkData - Artwork data including title, description, image URL
   * @returns {Promise<Object>} - Result with saved artwork or error
   */
  async function saveArtworkToFirestore(artistId, artworkData) {
    try {
      const artworkRef = collection(db, 'artworks');
      const artworkRecord = {
        title: artworkData.title,
        description: artworkData.description || '',
        imageUrl: artworkData.imageUrl,
        imagePath: artworkData.imagePath || '',
        artistId: artistId,
        tags: artworkData.tags || [],
        createdAt: new Date().toISOString(),
        isPublic: artworkData.isPublic !== false
      };
      
      const docRef = await addDoc(artworkRef, artworkRecord);
      
      return {
        success: true,
        id: docRef.id,
        data: artworkRecord
      };
    } catch (error) {
      console.error('Save artwork error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all artworks by artist
   * @param {string} artistId - The artist's user ID
   * @returns {Promise<Array>} - Array of artwork documents
   */
  async function getArtworksByArtist(artistId) {
    try {
      const artworksRef = collection(db, 'artworks');
      const q = query(
        artworksRef,
        where('artistId', '==', artistId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const artworks = [];
      
      querySnapshot.forEach((doc) => {
        artworks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, artworks };
    } catch (error) {
      console.error('Get artworks error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all public artworks (for guests)
   * @returns {Promise<Array>} - Array of public artwork documents
   */
  async function getPublicArtworks() {
    try {
      const artworksRef = collection(db, 'artworks');
      const q = query(
        artworksRef,
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const artworks = [];
      
      querySnapshot.forEach((doc) => {
        artworks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, artworks };
    } catch (error) {
      console.error('Get public artworks error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if user is an artist
   * @param {string} userId - The user's ID
   * @returns {Promise<boolean>} - True if user is an artist
   */
  async function checkIsArtist(userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === 'artist';
      }
      return false;
    } catch (error) {
      console.error('Check artist error:', error);
      return false;
    }
  }
  
  /**
   * Complete artwork upload flow (upload + save to database)
   * @param {File} file - The image file
   * @param {string} userId - The artist's user ID
   * @param {Object} metadata - Artwork metadata (title, description, tags)
   * @returns {Promise<Object>} - Complete result
   */
  async function uploadAndSaveArtwork(file, userId, metadata) {
    try {
      // Step 1: Upload image to Firebase Storage
      const uploadResult = await uploadArtworkImage(file, userId);
      
      if (!uploadResult.success) {
        return uploadResult;
      }
      
      // Step 2: Save artwork metadata to Firestore
      const saveResult = await saveArtworkToFirestore(userId, {
        title: metadata.title,
        description: metadata.description || '',
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        tags: metadata.tags || [],
        isPublic: metadata.isPublic !== false
      });
      
      if (!saveResult.success) {
        // If database save fails, delete the uploaded image
        await deleteArtworkImage(uploadResult.path);
        return saveResult;
      }
      
      return {
        success: true,
        id: saveResult.id,
        imageUrl: uploadResult.url,
        path: uploadResult.path,
        ...saveResult.data
      };
      
    } catch (error) {
      console.error('Complete upload error:', error);
      return { success: false, error: error.message };
    }
  }

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
    const username=document.getElementById('username-sp').value;
    const role=document.getElementById('role-sp').value;
    const password=document.getElementById('password-sp').value;

    const auth=getAuth();
    const db=getFirestore();

    createUserWithEmailAndPassword(auth, email, password).then((userCredential)=> {
        const user=userCredential.user;
        const userData={
            email: email,
            username: username,
            firstName: fName,
            lastName: lName,
            role: role,
            createdAt: new Date().toISOString()
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
        showMessage('login is successful', 'signInMessage');
        const user=userCredential.user;
        localStorage.setItem('loggedInUserId', user.uid);
        window.location.href='home2.html';
    }).catch((error) => {
        const errorCode=error.code;
        if(errorCode==='auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
            showMessage('Account Does Not Exist', 'signInMessage');
        }
    })
  })

  // ============================================
  // ARTWORK UPLOAD HANDLER
  // ============================================
  
  /**
   * Setup artwork upload functionality
   * This connects the file input to the upload functions
   */
  function setupArtworkUpload() {
    const fileInput = document.getElementById('submContest');
    const userId = localStorage.getItem('loggedInUserId');
    
    if (!fileInput) {
      console.log('Artwork upload input not found on this page');
      return;
    }
    
    if (!userId) {
      console.log('User not logged in');
      return;
    }
    
    // Add event listener for file selection
    fileInput.addEventListener('change', async function(event) {
      const file = event.target.files[0];
      
      if (!file) {
        return;
      }
      
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      
      // Get artwork metadata from form or prompt user
      let title = '';
      let description = '';
      
      // Try to get from form inputs if they exist
      const titleInput = document.getElementById('artworkTitle');
      const descInput = document.getElementById('artworkDescription');
      
      if (titleInput && titleInput.value) {
        title = titleInput.value;
      } else {
        // Prompt user for title if not available
        title = prompt('Enter artwork title:');
        if (!title || title.trim() === '') {
          alert('Title is required');
          return;
        }
      }
      
      if (descInput && descInput.value) {
        description = descInput.value;
      } else {
        // Prompt user for description
        description = prompt('Enter artwork description (optional):') || '';
      }
      
      try {
        // Show loading indicator
        const originalText = fileInput.parentElement.innerText;
        fileInput.parentElement.innerText = 'Uploading...';
        fileInput.disabled = true;
        
        // Check if user is an artist
        const isArtistUser = await checkIsArtist(userId);
        if (!isArtistUser) {
          alert('Only artists can upload artwork. Please contact admin to upgrade your account.');
          fileInput.parentElement.innerText = originalText;
          fileInput.disabled = false;
          return;
        }
        
        // Upload artwork
        const result = await uploadAndSaveArtwork(file, userId, {
          title: title.trim(),
          description: description.trim(),
          tags: [],
          isPublic: true
        });
        
        if (result.success) {
          alert('Artwork uploaded successfully!');
          // Reset form
          fileInput.value = '';
          // Clear preview if exists
          const preview = document.getElementById('uploadPreview');
          if (preview) {
            preview.style.display = 'none';
            preview.src = '';
          }
          // Clear title/description inputs if they exist
          if (titleInput) titleInput.value = '';
          if (descInput) descInput.value = '';
        } else {
          alert('Upload failed: ' + result.error);
        }
        
        // Restore button
        fileInput.parentElement.innerText = originalText;
        fileInput.disabled = false;
        
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
        // Restore button
        fileInput.parentElement.innerText = 'Upload Photo Here.';
        fileInput.disabled = false;
      }
    });
  }
  
  // Initialize artwork upload when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupArtworkUpload);
  } else {
    setupArtworkUpload();
  }
  
  // Export functions for global access
  window.uploadArtworkImage = uploadArtworkImage;
  window.saveArtworkToFirestore = saveArtworkToFirestore;
  window.getArtworksByArtist = getArtworksByArtist;
  window.getPublicArtworks = getPublicArtworks;
  window.uploadAndSaveArtwork = uploadAndSaveArtwork;
  window.checkIsArtist = checkIsArtist;
  window.validateImageFile = validateImageFile;
