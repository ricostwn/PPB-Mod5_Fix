// src/utils/draftStorage.js

const DRAFT_KEY_PREFIX = 'recipe_draft_';
const DRAFT_TIMESTAMP_KEY = 'recipe_draft_timestamp';

/**
 * Save recipe draft to localStorage
 * @param {Object} draftData - Recipe draft data
 * @param {string} draftId - Unique identifier for the draft (e.g., 'create' or recipeId for edit)
 */
export const saveDraft = (draftData, draftId = 'create') => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    const timestamp = new Date().toISOString();
    
    const draft = {
      ...draftData,
      savedAt: timestamp,
    };
    
    localStorage.setItem(key, JSON.stringify(draft));
    localStorage.setItem(`${key}_${DRAFT_TIMESTAMP_KEY}`, timestamp);
    
    console.log(`Draft saved: ${draftId} at ${timestamp}`);
    return true;
  } catch (error) {
    console.error('Error saving draft:', error);
    return false;
  }
};

/**
 * Load recipe draft from localStorage
 * @param {string} draftId - Unique identifier for the draft
 * @returns {Object|null} Draft data or null if not found
 */
export const loadDraft = (draftId = 'create') => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    const draftJson = localStorage.getItem(key);
    
    if (!draftJson) {
      return null;
    }
    
    const draft = JSON.parse(draftJson);
    console.log(`Draft loaded: ${draftId}`);
    return draft;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
};

/**
 * Delete recipe draft from localStorage
 * @param {string} draftId - Unique identifier for the draft
 */
export const deleteDraft = (draftId = 'create') => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_${DRAFT_TIMESTAMP_KEY}`);
    
    console.log(`Draft deleted: ${draftId}`);
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
};

/**
 * Check if a draft exists
 * @param {string} draftId - Unique identifier for the draft
 * @returns {boolean} True if draft exists
 */
export const hasDraft = (draftId = 'create') => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Error checking draft:', error);
    return false;
  }
};

/**
 * Get draft timestamp
 * @param {string} draftId - Unique identifier for the draft
 * @returns {string|null} ISO timestamp or null
 */
export const getDraftTimestamp = (draftId = 'create') => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    return localStorage.getItem(`${key}_${DRAFT_TIMESTAMP_KEY}`);
  } catch (error) {
    console.error('Error getting draft timestamp:', error);
    return null;
  }
};

/**
 * Get all draft IDs
 * @returns {string[]} Array of draft IDs
 */
export const getAllDraftIds = () => {
  try {
    const keys = Object.keys(localStorage);
    const draftKeys = keys.filter(key => key.startsWith(DRAFT_KEY_PREFIX) && !key.includes(DRAFT_TIMESTAMP_KEY));
    return draftKeys.map(key => key.replace(DRAFT_KEY_PREFIX, ''));
  } catch (error) {
    console.error('Error getting all draft IDs:', error);
    return [];
  }
};

/**
 * Clear all recipe drafts
 */
export const clearAllDrafts = () => {
  try {
    const draftIds = getAllDraftIds();
    draftIds.forEach(id => deleteDraft(id));
    console.log(`Cleared ${draftIds.length} drafts`);
    return true;
  } catch (error) {
    console.error('Error clearing all drafts:', error);
    return false;
  }
};

/**
 * Format draft timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time ago
 */
export const formatDraftTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = new Date();
  const savedTime = new Date(timestamp);
  const diffMs = now - savedTime;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return savedTime.toLocaleDateString('id-ID');
};