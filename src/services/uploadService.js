import axios from 'axios';
import { BASE_URL } from '../config/api';

class UploadService {
  /**
   * Upload recipe image to MinIO
   * @param {File} file - Image file to upload
   * @returns {Promise}
   */
  async uploadImage(file) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: .jpg, .jpeg, .png, .webp');
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Upload to server
      const response = await axios.post(`${BASE_URL}/api/v1/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for upload
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new UploadService();