import { apiClient } from '../config/api';

class ReviewService {
  /**
   * Get all reviews for a recipe
   * @param {string} recipeId - Recipe ID
   * @returns {Promise}
   */
  async getReviews(recipeId) {
    try {
      const response = await apiClient.get(`/api/v1/recipes/${recipeId}/reviews`);
      return response;
    } catch (error) {
      throw error;
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
    try {
      const response = await apiClient.post(`/api/v1/recipes/${recipeId}/reviews`, reviewData);
      return response;
    } catch (error) {
      throw error;
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
    try {
      const response = await apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete review
   * @param {string} reviewId - Review ID
   * @returns {Promise}
   */
  async deleteReview(reviewId) {
    try {
      const response = await apiClient.delete(`/api/v1/reviews/${reviewId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new ReviewService();