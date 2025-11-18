import { apiClient } from '../config/api';

class ReviewService {
  /**
   * Get all reviews for a recipe
   * @param {string} recipeId - Recipe ID
   * @returns {Promise}
   */
  async getReviews(recipeId) {
    const LS_KEY = 'local_reviews';
    try {
      const response = await apiClient.get(`/api/v1/recipes/${recipeId}/reviews`);
      return response;
    } catch (error) {
      // Fallback to localStorage when API unavailable
      try {
        const raw = localStorage.getItem(LS_KEY) || '{}';
        const store = JSON.parse(raw);
        const data = store[recipeId] || [];
        return { success: true, data };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to load reviews' };
      }
    }
  }

  /**
   * Create review for a recipe
   * @param {string} recipeId - Recipe ID
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.user_identifier - User identifier
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment (optional)
   * @returns {Promise}
   */
  async createReview(recipeId, reviewData) {
    const LS_KEY = 'local_reviews';
    try {
      const response = await apiClient.post(`/api/v1/recipes/${recipeId}/reviews`, reviewData);
      return response;
    } catch (error) {
      // fallback: persist review in localStorage
      try {
        const raw = localStorage.getItem(LS_KEY) || '{}';
        const store = JSON.parse(raw);
        const list = store[recipeId] || [];
        const newReview = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          recipe_id: recipeId,
          user_identifier: reviewData.user_identifier || 'anonymous',
          rating: reviewData.rating || 0,
          comment: reviewData.comment || '',
          created_at: new Date().toISOString(),
        };
        list.unshift(newReview);
        store[recipeId] = list;
        localStorage.setItem(LS_KEY, JSON.stringify(store));
        return { success: true, data: newReview };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to save review locally' };
      }
    }
  }

  /**
   * Update existing review
   * @param {string} reviewId - Review ID
   * @param {Object} reviewData - Updated review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment (optional)
   * @returns {Promise}
   */
  async updateReview(reviewId, reviewData) {
    const LS_KEY = 'local_reviews';
    try {
      const response = await apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData);
      return response;
    } catch (error) {
      // fallback: try to update localStorage review
      try {
        const raw = localStorage.getItem(LS_KEY) || '{}';
        const store = JSON.parse(raw);
        let updated = null;
        Object.keys(store).forEach((recipeId) => {
          store[recipeId] = store[recipeId].map((r) => {
            if (r.id === reviewId) {
              updated = { ...r, ...reviewData, updated_at: new Date().toISOString() };
              return updated;
            }
            return r;
          });
        });
        localStorage.setItem(LS_KEY, JSON.stringify(store));
        if (updated) return { success: true, data: updated };
        return { success: false, message: 'Review not found locally' };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to update local review' };
      }
    }
  }

  /**
   * Delete review
   * @param {string} reviewId - Review ID
   * @returns {Promise}
   */
  async deleteReview(reviewId) {
    const LS_KEY = 'local_reviews';
    try {
      const response = await apiClient.delete(`/api/v1/reviews/${reviewId}`);
      return response;
    } catch (error) {
      // fallback: remove from localStorage
      try {
        const raw = localStorage.getItem(LS_KEY) || '{}';
        const store = JSON.parse(raw);
        let removed = false;
        Object.keys(store).forEach((recipeId) => {
          const before = store[recipeId] || [];
          const after = before.filter(r => r.id !== reviewId);
          if (after.length !== before.length) removed = true;
          store[recipeId] = after;
        });
        localStorage.setItem(LS_KEY, JSON.stringify(store));
        if (removed) return { success: true };
        return { success: false, message: 'Review not found locally' };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to delete local review' };
      }
    }
  }
}

export default new ReviewService();