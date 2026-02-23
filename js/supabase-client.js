/**
 * Supabase Client Functions
 * ========================
 * This file provides client-side functions for interacting with Supabase
 * Storage and Database for the Jericho Museum application.
 * 
 * Features:
 * - Supabase client initialization with environment variables
 * - File upload with validation (type, size)
 * - Unique file path generation based on user ID and timestamp
 * - Artwork metadata management
 * - Data fetching functions for artists and guests
 * - Comprehensive error handling
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anonymous (public) key
 * 
 * Storage Buckets:
 * - artwork-images: For artist artwork uploads
 * - profile-pictures: For user profile images
 */

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

// Get environment variables (these should be set in your .env file or HTML)
// In production, use import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 'your-anon-key';

/**
 * Initialize and export Supabase client
 * The client is configured with:
 * - Global headers for authorization
 * - Auto-refresh of tokens
 * - Persistent sessions
 */
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'jericho-museum-app'
    }
  }
});

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

/**
 * Storage bucket names
 */
const STORAGE_BUCKETS = {
  ARTWORK: 'artwork-images',
  PROFILE: 'profile-pictures'
};

/**
 * Allowed file types for image uploads
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Maximum file size limits (in bytes)
 */
const FILE_SIZE_LIMITS = {
  ARTWORK: 10 * 1024 * 1024,  // 10MB for artwork
  PROFILE: 2 * 1024 * 1024     // 2MB for profile pictures
};

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

/**
 * Custom error class for Supabase operations
 * Provides structured error information with user-friendly messages
 */
class SupabaseError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'SupabaseError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle Supabase errors and return structured response
 * @param {Error} error - The error from Supabase
 * @param {string} operation - The operation that failed
 * @returns {Object} Structured error response
 */
function handleSupabaseError(error, operation = 'operation') {
  console.error(`Supabase error during ${operation}:`, error);
  
  // Determine error type and provide user-friendly message
  let userMessage = 'An error occurred. Please try again.';
  let errorCode = 'UNKNOWN_ERROR';
  
  if (error.message) {
    if (error.message.includes('storage')) {
      errorCode = 'STORAGE_ERROR';
      userMessage = 'File upload failed. Please check the file and try again.';
    } else if (error.message.includes('fetch')) {
      errorCode = 'NETWORK_ERROR';
      userMessage = 'Network error. Please check your connection.';
    } else if (error.message.includes('permission') || error.message.includes('row-level security')) {
      errorCode = 'PERMISSION_DENIED';
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.message.includes('JWT')) {
      errorCode = 'AUTH_ERROR';
      userMessage = 'Session expired. Please log in again.';
    }
  }
  
  return {
    success: false,
    error: {
      message: userMessage,
      code: errorCode,
      originalError: error.message,
      operation,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create a success response object
 * @param {any} data - The data to return
 * @param {string} message - Optional success message
 * @returns {Object} Structured success response
 */
function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

// ============================================
// FILE VALIDATION FUNCTIONS
// ============================================

/**
 * Validate image file type
 * @param {File} file - The file to validate
 * @param {string} context - The upload context ('artwork' or 'profile')
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateImageFile(file, context = 'artwork') {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }
  
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }
  
  // Check file size based on context
  const maxSize = context === 'artwork' ? FILE_SIZE_LIMITS.ARTWORK : FILE_SIZE_LIMITS.PROFILE;
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
}

/**
 * Generate unique file path based on user ID and timestamp
 * @param {string} userId - The user's ID
 * @param {string} fileName - Original file name
 * @param {string} type - Type of upload ('artwork' or 'profile')
 * @returns {string} Unique file path
 */
function generateFilePath(userId, fileName, type = 'artwork') {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExtension = fileName.split('.').pop();
  
  // Create path structure: type/userId/timestamp-randomSuffix.extension
  return `${type}/${userId}/${timestamp}-${randomSuffix}.${fileExtension}`;
}

// ============================================
// STORAGE UPLOAD FUNCTIONS
// ============================================

/**
 * Upload artwork image to Supabase Storage
 * Artists can upload their artwork with metadata including title, description, creation date, and tags.
 * 
 * @param {File} file - The image file to upload
 * @param {string} userId - The artist's user ID
 * @param {Object} metadata - Artwork metadata
 * @returns {Promise<Object>} Result with public URL or error
 */
async function uploadArtwork(file, userId, metadata) {
  try {
    // Validate file
    const validation = validateImageFile(file, 'artwork');
    if (!validation.isValid) {
      return handleSupabaseError(new Error(validation.error), 'file validation');
    }
    
    // Validate required metadata
    if (!metadata || !metadata.title) {
      return handleSupabaseError(new Error('Title is required'), 'metadata validation');
    }
    
    // Generate unique file path
    const filePath = generateFilePath(userId, file.name, 'artwork');
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.ARTWORK)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      return handleSupabaseError(error, 'artwork upload');
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.ARTWORK)
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      return handleSupabaseError(new Error('Failed to get public URL'), 'URL generation');
    }
    
    // Return success with public URL and file path
    return createSuccessResponse({
      publicUrl: urlData.publicUrl,
      filePath: filePath,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString()
      }
    }, 'Artwork uploaded successfully');
    
  } catch (error) {
    console.error('Upload artwork error:', error);
    return handleSupabaseError(error, 'artwork upload');
  }
}

/**
 * Upload profile picture to Supabase Storage
 * Both artists and guests can upload profile pictures.
 * 
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Result with public URL or error
 */
async function uploadProfilePicture(file, userId) {
  try {
    // Validate file
    const validation = validateImageFile(file, 'profile');
    if (!validation.isValid) {
      return handleSupabaseError(new Error(validation.error), 'file validation');
    }
    
    // Generate unique file path
    const filePath = generateFilePath(userId, file.name, 'profile');
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    
    if (error) {
      return handleSupabaseError(error, 'profile picture upload');
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.PROFILE)
      .getPublicUrl(filePath);
    
    return createSuccessResponse({
      publicUrl: urlData.publicUrl,
      filePath: filePath
    }, 'Profile picture uploaded successfully');
    
  } catch (error) {
    console.error('Upload profile picture error:', error);
    return handleSupabaseError(error, 'profile picture upload');
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - The path of the file to delete
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<Object>} Result with success or error
 */
async function deleteFile(filePath, bucket = STORAGE_BUCKETS.ARTWORK) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      return handleSupabaseError(error, 'file deletion');
    }
    
    return createSuccessResponse({ deleted: true }, 'File deleted successfully');
    
  } catch (error) {
    console.error('Delete file error:', error);
    return handleSupabaseError(error, 'file deletion');
  }
}

// ============================================
// DATABASE OPERATIONS (ARTWORK)
// ============================================

/**
 * Save artwork metadata to database
 * @param {string} artistId - The artist's user ID
 * @param {Object} artworkData - Artwork data to save
 * @returns {Promise<Object>} Result with saved artwork or error
 */
async function saveArtwork(artistId, artworkData) {
  try {
    if (!artworkData.title || !artworkData.imageUrl) {
      return handleSupabaseError(new Error('Title and image URL are required'), 'validation');
    }
    
    const artworkRecord = {
      title: artworkData.title,
      description: artworkData.description || '',
      imageUrl: artworkData.imageUrl,
      imagePath: artworkData.filePath || '',
      artistId: artistId,
      tags: artworkData.tags || [],
      createdAt: artworkData.creationDate || new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
      isPublic: artworkData.isPublic !== false
    };
    
    const { data, error } = await supabase
      .from('artworks')
      .insert([artworkRecord])
      .select()
      .single();
    
    if (error) {
      return handleSupabaseError(error, 'save artwork');
    }
    
    return createSuccessResponse(data, 'Artwork saved successfully');
    
  } catch (error) {
    console.error('Save artwork error:', error);
    return handleSupabaseError(error, 'save artwork');
  }
}

/**
 * Fetch artwork by artist ID
 * @param {string} artistId - The artist's user ID
 * @returns {Promise<Object>} Result with artworks array or error
 */
async function fetchArtworkByArtist(artistId) {
  try {
    if (!artistId) {
      return handleSupabaseError(new Error('Artist ID is required'), 'validation');
    }
    
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('artistId', artistId)
      .order('createdAt', { ascending: false });
    
    if (error) {
      return handleSupabaseError(error, 'fetch artwork by artist');
    }
    
    return createSuccessResponse(data || [], 'Artworks fetched successfully');
    
  } catch (error) {
    console.error('Fetch artwork by artist error:', error);
    return handleSupabaseError(error, 'fetch artwork by artist');
  }
}

/**
 * Fetch all public artwork for guests
 * @param {number} limit - Maximum number of artworks
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Result with artworks array or error
 */
async function fetchPublicArtwork(limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('isPublic', true)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return handleSupabaseError(error, 'fetch public artwork');
    }
    
    return createSuccessResponse(data || [], 'Public artwork fetched successfully');
    
  } catch (error) {
    console.error('Fetch public artwork error:', error);
    return handleSupabaseError(error, 'fetch public artwork');
  }
}

/**
 * Fetch single artwork by ID
 * @param {string} artworkId - The artwork ID
 * @returns {Promise<Object>} Result with artwork or error
 */
async function fetchArtworkById(artworkId) {
  try {
    if (!artworkId) {
      return handleSupabaseError(new Error('Artwork ID is required'), 'validation');
    }
    
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();
    
    if (error) {
      return handleSupabaseError(error, 'fetch artwork by ID');
    }
    
    return createSuccessResponse(data, 'Artwork fetched successfully');
    
  } catch (error) {
    console.error('Fetch artwork by ID error:', error);
    return handleSupabaseError(error, 'fetch artwork by ID');
  }
}

/**
 * Update artwork metadata
 * @param {string} artworkId - The artwork ID
 * @param {string} artistId - The artist's user ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result with updated artwork or error
 */
async function updateArtwork(artworkId, artistId, updates) {
  try {
    if (!artworkId || !artistId) {
      return handleSupabaseError(new Error('Artwork ID and Artist ID are required'), 'validation');
    }
    
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('artworks')
      .update(updatedData)
      .eq('id', artworkId)
      .eq('artistId', artistId)
      .select()
      .single();
    
    if (error) {
      return handleSupabaseError(error, 'update artwork');
    }
    
    return createSuccessResponse(data, 'Artwork updated successfully');
    
  } catch (error) {
    console.error('Update artwork error:', error);
    return handleSupabaseError(error, 'update artwork');
  }
}

/**
 * Delete artwork
 * @param {string} artworkId - The artwork ID
 * @param {string} artistId - The artist's user ID
 * @returns {Promise<Object>} Result with success or error
 */
async function deleteArtwork(artworkId, artistId) {
  try {
    if (!artworkId || !artistId) {
      return handleSupabaseError(new Error('Artwork ID and Artist ID are required'), 'validation');
    }
    
    // Get artwork to find image path
    const { data: artwork, error: fetchError } = await supabase
      .from('artworks')
      .select('imagePath')
      .eq('id', artworkId)
      .single();
    
    if (fetchError) {
      return handleSupabaseError(fetchError, 'fetch artwork for deletion');
    }
    
    // Delete artwork record
    const { error: deleteError } = await supabase
      .from('artworks')
      .delete()
      .eq('id', artworkId)
      .eq('artistId', artistId);
    
    if (deleteError) {
      return handleSupabaseError(deleteError, 'delete artwork');
    }
    
    // Delete associated image
    if (artwork && artwork.imagePath) {
      await deleteFile(artwork.imagePath, STORAGE_BUCKETS.ARTWORK);
    }
    
    return createSuccessResponse({ deleted: true }, 'Artwork deleted successfully');
    
  } catch (error) {
    console.error('Delete artwork error:', error);
    return handleSupabaseError(error, 'delete artwork');
  }
}

// ============================================
// FAVORITES OPERATIONS
// ============================================

/**
 * Add artwork to favorites
 * @param {string} userId - The user's ID
 * @param {string} artworkId - The artwork ID
 * @returns {Promise<Object>} Result with favorite record or error
 */
async function addFavorite(userId, artworkId) {
  try {
    if (!userId || !artworkId) {
      return handleSupabaseError(new Error('User ID and Artwork ID are required'), 'validation');
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([{
        userId: userId,
        artworkId: artworkId,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      return handleSupabaseError(error, 'add favorite');
    }
    
    return createSuccessResponse(data, 'Added to favorites');
    
  } catch (error) {
    console.error('Add favorite error:', error);
    return handleSupabaseError(error, 'add favorite');
  }
}

/**
 * Remove artwork from favorites
 * @param {string} userId - The user's ID
 * @param {string} artworkId - The artwork ID
 * @returns {Promise<Object>} Result with success or error
 */
async function removeFavorite(userId, artworkId) {
  try {
    if (!userId || !artworkId) {
      return handleSupabaseError(new Error('User ID and Artwork ID are required'), 'validation');
    }
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('userId', userId)
      .eq('artworkId', artworkId);
    
    if (error) {
      return handleSupabaseError(error, 'remove favorite');
    }
    
    return createSuccessResponse({ removed: true }, 'Removed from favorites');
    
  } catch (error) {
    console.error('Remove favorite error:', error);
    return handleSupabaseError(error, 'remove favorite');
  }
}

/**
 * Get user's favorites
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Result with favorites array or error
 */
async function getUserFavorites(userId) {
  try {
    if (!userId) {
      return handleSupabaseError(new Error('User ID is required'), 'validation');
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .select('*, artworks(*)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    
    if (error) {
      return handleSupabaseError(error, 'get favorites');
    }
    
    return createSuccessResponse(data || [], 'Favorites fetched successfully');
    
  } catch (error) {
    console.error('Get favorites error:', error);
    return handleSupabaseError(error, 'get favorites');
  }
}

// ============================================
// ARTWORK REQUEST OPERATIONS
// ============================================

/**
 * Submit artwork request (Guest feature)
 * @param {string} requesterId - The guest's user ID
 * @param {Object} requestData - Request details
 * @returns {Promise<Object>} Result with request record or error
 */
async function submitArtworkRequest(requesterId, requestData) {
  try {
    if (!requesterId || !requestData || !requestData.title || !requestData.description) {
      return handleSupabaseError(new Error('Requester ID, title, and description are required'), 'validation');
    }
    
    const { data, error } = await supabase
      .from('artworkRequests')
      .insert([{
        requesterId: requesterId,
        title: requestData.title,
        description: requestData.description,
        status: 'pending',
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      return handleSupabaseError(error, 'submit artwork request');
    }
    
    return createSuccessResponse(data, 'Artwork request submitted successfully');
    
  } catch (error) {
    console.error('Submit artwork request error:', error);
    return handleSupabaseError(error, 'submit artwork request');
  }
}

/**
 * Get user's artwork requests
 * @param {string} requesterId - The guest's user ID
 * @returns {Promise<Object>} Result with requests array or error
 */
async function getUserRequests(requesterId) {
  try {
    if (!requesterId) {
      return handleSupabaseError(new Error('Requester ID is required'), 'validation');
    }
    
    const { data, error } = await supabase
      .from('artworkRequests')
      .select('*')
      .eq('requesterId', requesterId)
      .order('createdAt', { ascending: false });
    
    if (error) {
      return handleSupabaseError(error, 'get user requests');
    }
    
    return createSuccessResponse(data || [], 'Requests fetched successfully');
    
  } catch (error) {
    console.error('Get user requests error:', error);
    return handleSupabaseError(error, 'get user requests');
  }
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Get current authenticated user
 * @returns {Promise<Object>} User object or null
 */
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Get current user error:', error);
      return null;
    }
    
    return user;
    
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} Result with user or error
 */
async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return handleSupabaseError(error, 'sign in');
    }
    
    return createSuccessResponse(data, 'Signed in successfully');
    
  } catch (error) {
    console.error('Sign in error:', error);
    return handleSupabaseError(error, 'sign in');
  }
}

/**
 * Sign out current user
 * @returns {Promise<Object>} Result with success or error
 */
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return handleSupabaseError(error, 'sign out');
    }
    
    return createSuccessResponse({ signedOut: true }, 'Signed out successfully');
    
  } catch (error) {
    console.error('Sign out error:', error);
    return handleSupabaseError(error, 'sign out');
  }
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Function to call on auth state change
 * @returns {Function} Unsubscribe function
 */
function subscribeToAuthState(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
}

// ============================================
// COMPLETE UPLOAD FLOW
// ============================================

/**
 * Complete artwork upload flow (upload + save to database)
 * @param {File} file - The artwork image file
 * @param {string} artistId - The artist's user ID
 * @param {Object} metadata - Artwork metadata
 * @returns {Promise<Object>} Complete result
 */
async function uploadCompleteArtwork(file, artistId, metadata) {
  try {
    // Step 1: Upload the image file
    const uploadResult = await uploadArtwork(file, artistId, metadata);
    
    if (!uploadResult.success) {
      return uploadResult;
    }
    
    // Step 2: Save artwork metadata to database
    const saveResult = await saveArtwork(artistId, {
      title: metadata.title,
      description: metadata.description || '',
      imageUrl: uploadResult.data.publicUrl,
      filePath: uploadResult.data.filePath,
      creationDate: metadata.creationDate,
      tags: metadata.tags || [],
      isPublic: metadata.isPublic !== false
    });
    
    if (!saveResult.success) {
      // If database save fails, clean up the uploaded file
      await deleteFile(uploadResult.data.filePath, STORAGE_BUCKETS.ARTWORK);
      return saveResult;
    }
    
    // Return combined result
    return createSuccessResponse({
      artwork: saveResult.data,
      imageUrl: uploadResult.data.publicUrl,
      filePath: uploadResult.data.filePath
    }, 'Artwork uploaded and saved successfully');
    
  } catch (error) {
    console.error('Complete artwork upload error:', error);
    return handleSupabaseError(error, 'complete artwork upload');
  }
}

// ============================================
// EXPORT TO WINDOW OBJECT
// ============================================

// Attach all functions to window for global access
if (typeof window !== 'undefined') {
  window.SupabaseClient = {
    supabase,
    uploadArtwork,
    uploadProfilePicture,
    uploadCompleteArtwork,
    deleteFile,
    saveArtwork,
    fetchArtworkByArtist,
    fetchPublicArtwork,
    fetchArtworkById,
    updateArtwork,
    deleteArtwork,
    addFavorite,
    removeFavorite,
    getUserFavorites,
    submitArtworkRequest,
    getUserRequests,
    getCurrentUser,
    signIn,
    signOut,
    subscribeToAuthState,
    validateImageFile,
    generateFilePath,
    handleSupabaseError,
    createSuccessResponse,
    STORAGE_BUCKETS,
    ALLOWED_IMAGE_TYPES,
    FILE_SIZE_LIMITS
  };
}
