// Home page JavaScript - Uses Supabase for authentication
import { onAuthStateChanged, getCurrentUser } from './supabase.js';

onAuthStateChanged(async (user) => {
  const loggedInUserId = localStorage.getItem('loggedInUserId');
  if (loggedInUserId) {
    // Get user profile from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('User logged in:', user.email);
    }
  }
});
