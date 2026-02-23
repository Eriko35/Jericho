import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrBpjTkPlOM7fDKHx97QYZGzGET-XWpEs",
    authDomain: "kamuseo-651a2.firebaseapp.com",
    projectId: "kamuseo-651a2",
    storageBucket: "kamuseo-651a2.firebasestorage.app",
    messagingSenderId: "281398036298",
    appId: "1:281398036298:web:ecc0aca0d0d48b473f23b3",
    measurementId: "G-QGJB7ERWYW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const userId = localStorage.getItem('loggedInUserId');

if(!userId) {
    window.location.href = "index.html";
}

let menuVisible = false;
let themeSwitch = localStorage.getItem('homeTheme');
let bb = document.getElementById('themes');
bb.value = themeSwitch;
var fullAucBox = document.getElementById('fullAucBox');
var fullAuc = document.getElementById('artImg');
function showMenu() {
    menuVisible = !menuVisible;
    if (menuVisible) {
        document.getElementById("sideBar").style.display = "none";
        img.src = "assets/icons/menuoff.png";
    } else {
        document.getElementById("sideBar").style.display = "flex";
        img.src = "assets/icons/menuon.png";
    }
}
function removeTheme() {
    document.body.classList.remove('light-theme');
    document.body.classList.remove('pink-theme');
    document.body.classList.remove('ocean-theme');
}
switch(themeSwitch) {
        case 'light':
            document.body.classList.add('light-theme');
            break;
        case 'pink':
            document.body.classList.add('pink-theme');
            break;
        case 'ocean':
            document.body.classList.add('ocean-theme');
            break;
        default:
            localStorage.setItem('homeTheme', 'dark');
    }
function changeTheme() {
    const th = document.getElementById('themes').value;
    switch(th) {
        case 'light':
            removeTheme();
            document.body.classList.add('light-theme');
            localStorage.setItem('homeTheme', 'light');
            break;
        case 'pink':
            removeTheme();
            document.body.classList.add('pink-theme');
            localStorage.setItem('homeTheme', 'pink');
            break;
        case 'ocean':
            removeTheme();
            document.body.classList.add('ocean-theme');
            localStorage.setItem('homeTheme', 'ocean');
            break;
        default:
            removeTheme();
            localStorage.setItem('homeTheme', 'dark');
    }
}

function navIndex(index) {
    document.querySelectorAll('.homeindex').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.navindex').forEach(el => el.classList.remove("active"));
    switch (index) {
        case 1:
            document.getElementById('homef').style.display = 'block';
            document.getElementById('nav1').classList.add("active");
            break;
        case 2:
            document.getElementById('aboutusf').style.display = 'block';
            document.getElementById('nav2').classList.add("active");
            break;
        case 3:
            document.getElementById('auctionf').style.display = 'block';
            document.getElementById('nav3').classList.add("active");
            break;
        case 4:
            document.getElementById('artistf').style.display = 'block';
            document.getElementById('nav4').classList.add("active");
            break;
        case 5: // Profile
            document.getElementById('profilef').style.display = 'block';
            loadProfile();
            break;
        case 99:
            document.getElementById('fullAucBox').style.display = 'block';
            break;
        case 98:
            document.getElementById('artContestSubmit').style.display = 'block';
            break;
        default:
            document.getElementById('home').style.display = 'block';
            document.getElementById('nav1').classList.add("active");
    }
}
document.querySelectorAll('.aucart').forEach(function(card) {
    card.addEventListener('click', function() {
        const img = this.querySelector('img');
        fullAucBox.style.display = "flex";
        fullAuc.src = img.src;
        navIndex(99);
    });
});

function logOut() {
    localStorage.removeItem('loggedInUserId');
    window.location.href = "index.html";
}

const input = document.getElementById("submContest");
const preview = document.getElementById("uploadPreview");
const dropArea = document.querySelector(".dropFileArea");

// Function to handle file selection
function handleFiles(files) {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
        // Set the file to the input
        input.files = files;
        // Show preview
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }
}

// Listener for file input change
input.addEventListener("change", function () {
    handleFiles(this.files);
});

// Drag and Drop listeners for the drop area
dropArea.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropArea.classList.add("drag-over");
});

dropArea.addEventListener("dragleave", function () {
    dropArea.classList.remove("drag-over");
});

dropArea.addEventListener("drop", function (event) {
    event.preventDefault();
    dropArea.classList.remove("drag-over");
    handleFiles(event.dataTransfer.files);
});

// --- Profile Functions ---

async function loadProfile() {
    if (!userId) return;
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('editUsername').value = data.username || data.firstName + " " + data.lastName || "";
        document.getElementById('editBirthday').value = data.birthday || "";
        document.getElementById('editDescription').value = data.description || "";
    }

    // Load Artworks
    const q = query(collection(db, "contestSubmissions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const gallery = document.getElementById('myArtworksGallery');
    gallery.innerHTML = "";
    
    querySnapshot.forEach((doc) => {
        const art = doc.data();
        const div = document.createElement('div');
        div.className = "art-featured";
        div.innerHTML = `
            <div>
                <div class="artwork">
                    <img class="artwork" src="${art.imageUrl}" alt="${art.title}">
                </div>
                <p>${art.title}</p>
            </div>
        `;
        gallery.appendChild(div);
    });
}

async function saveProfile() {
    const username = document.getElementById('editUsername').value;
    const birthday = document.getElementById('editBirthday').value;
    const description = document.getElementById('editDescription').value;

    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            username: username,
            birthday: birthday,
            description: description
        });
        alert("Profile updated successfully!");
    } catch (e) {
        console.error("Error updating profile: ", e);
        alert("Error updating profile.");
    }
}

// --- Art Contest Submission ---

async function uploadImage() {
    event.preventDefault(); // Prevent form submit refresh
    const file = input.files[0];
    const title = document.getElementById('contestSubmitTitle').value;
    const desc = document.getElementById('contestSubmitDesc').value;

    if (!file || !title) {
        alert("Please select an image and enter a title.");
        return;
    }

    try {
        // 1. Upload Image to Storage
        const storageRef = ref(storage, 'contest/' + userId + '_' + Date.now() + '_' + file.name);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 2. Save Metadata to Firestore
        await addDoc(collection(db, "contestSubmissions"), {
            userId: userId,
            title: title,
            description: desc,
            imageUrl: downloadURL,
            timestamp: new Date()
        });

        alert("Artwork submitted successfully!");
        navIndex(1); // Go back home
    } catch (error) {
        console.error("Error uploading: ", error);
        alert("Upload failed: " + error.message);
    }
}

// Expose functions to window for HTML onclick access
window.showMenu = showMenu;
window.changeTheme = changeTheme;
window.navIndex = navIndex;
window.logOut = logOut;
window.saveProfile = saveProfile;
window.uploadImage = uploadImage;
window.loadProfile = loadProfile;