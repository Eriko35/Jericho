import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
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

// Check if user is logged in (Basic check)
if(!localStorage.getItem('loggedInUserId')) {
    window.location.href = "index.html";
}

// --- User Management ---
async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = "Loading...";
    
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        tableBody.innerHTML = "";
        
        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const uid = docSnap.id;
            const row = document.createElement('tr');
            
            const status = user.isBanned ? "Banned" : "Active";
            const btnText = user.isBanned ? "Unban" : "Ban";
            const btnColor = user.isBanned ? "green" : "#ff4d4d";

            row.innerHTML = `
                <td>${uid}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${status}</td>
                <td><button style="background-color:${btnColor}; color:white; border:none; padding:5px;" onclick="toggleBan('${uid}', ${user.isBanned})">${btnText}</button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (e) {
        console.error("Error loading users:", e);
        tableBody.innerHTML = "Error loading users.";
    }
}

async function toggleBan(uid, currentStatus) {
    if(confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            isBanned: !currentStatus
        });
        loadUsers(); // Refresh table
    }
}

// --- Museum Upload ---
async function uploadMuseumArt() {
    const museumType = document.getElementById('museumType').value;
    const title = document.getElementById('artTitle').value;
    const artist = document.getElementById('artistName').value;
    const desc = document.getElementById('artDesc').value;
    const file = document.getElementById('artFile').files[0];

    if(!file || !title) { alert("File and Title are required"); return; }

    try {
        const storageRef = ref(storage, `museum/${museumType}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        await addDoc(collection(db, museumType), {
            title: title,
            artist: artist,
            description: desc,
            imageUrl: url,
            uploadedAt: new Date()
        });
        alert("Uploaded successfully!");
    } catch(e) { console.error(e); alert("Upload failed"); }
}

window.toggleBan = toggleBan;
window.uploadMuseumArt = uploadMuseumArt;

loadUsers();