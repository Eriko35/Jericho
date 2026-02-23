// Auth Guard - Uses Supabase for authentication state checking
import { onAuthStateChanged } from './supabase.js';

onAuthStateChanged((user) => {
  if (!user) {
    // Not logged in → redirect to login page
    window.location.href = "index.html";
  } else {
    // Logged in → stay on home
    console.log("Logged in as:", user.email);
  }
});
