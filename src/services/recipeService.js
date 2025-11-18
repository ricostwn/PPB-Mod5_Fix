import { apiClient } from '../config/api';

// Caching configuration
const JSON_CACHE_KEY = 'recipes_json_cache_v1';
const IMAGE_CACHE_NAME = 'recipes-images-v1';
const IMAGE_INDEX_KEY = 'recipes_image_index_v1';
const DEFAULT_TTL_MS = 1000 * 60 * 10; // 10 minutes for list queries
const RECIPE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours for single recipe
const MAX_CACHED_IMAGES = 50; // keep up to 50 images in cache

class RecipeService {
  /**
   * Get all recipes with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.category - Filter by category: 'makanan' | 'minuman'
   * @param {string} params.difficulty - Filter by difficulty: 'mudah' | 'sedang' | 'sulit'
   * @param {string} params.search - Search in name/description
   * @param {string} params.sort_by - Sort by field (default: 'created_at')
   * @param {string} params.order - Sort order: 'asc' | 'desc' (default: 'desc')
   * @returns {Promise}
   */
  async getRecipes(params = {}) {
    const cacheKey = `${JSON_CACHE_KEY}:list:${JSON.stringify(params || {})}`;
    try {
      // Try to return cached JSON if fresh
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && Date.now() - parsed.ts < (params.ttl || DEFAULT_TTL_MS)) {
            // Return cached data
            // Also asynchronously ensure images are cached
            if (parsed.data && Array.isArray(parsed.data)) {
              this._cacheImages(parsed.data);
            }
            return { success: true, data: parsed.data, pagination: parsed.pagination || null };
          }
        } catch (err) {
          // fallthrough to network
        }
      }

      const response = await apiClient.get('/api/v1/recipes', { params });

      // Persist to localStorage with timestamp
      try {
        const payload = {
          ts: Date.now(),
          data: response.data || response || [],
          pagination: response.pagination || null,
        };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
        // async image caching
        if (payload.data && Array.isArray(payload.data)) this._cacheImages(payload.data);
      } catch (err) {
        // ignore storage errors
      }

      return response;
    } catch (error) {
      // If network fails, try to return stale cache if available
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return { success: true, data: parsed.data || [], pagination: parsed.pagination || null };
        } catch (err) {
          // ignore
        }
      }
      throw error;
    }
  }

  /**
   * Get recipe by ID
   * @param {string} id - Recipe ID
   * @returns {Promise}
   */
  async getRecipeById(id) {
    if (!id) return { success: false, message: 'No id provided' };
    const cacheKey = `${JSON_CACHE_KEY}:recipe:${id}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && Date.now() - parsed.ts < RECIPE_TTL_MS) {
            // ensure image cached
            if (parsed.data && parsed.data.image_url) this._cacheImages([parsed.data]);
            return { success: true, data: parsed.data };
          }
        } catch (err) {
          // continue to network
        }
      }

      const response = await apiClient.get(`/api/v1/recipes/${id}`);

      try {
        const payload = { ts: Date.now(), data: response.data || response };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
        if (payload.data) this._cacheImages([payload.data]);
      } catch (err) {
        // ignore
      }

      return response;
    } catch (error) {
      // fallback to cache
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return { success: true, data: parsed.data };
        } catch (err) {
          // ignore
        }
      }
      throw error;
    }
  }

  /**
   * Create new recipe
   * @param {Object} recipeData - Recipe data
   * @returns {Promise}
   */
  async createRecipe(recipeData) {
    try {
      const response = await apiClient.post('/api/v1/recipes', recipeData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update existing recipe (full replacement)
   * @param {string} id - Recipe ID
   * @param {Object} recipeData - Complete recipe data (all fields required)
   * @returns {Promise}
   */
  async updateRecipe(id, recipeData) {
    try {
      const response = await apiClient.put(`/api/v1/recipes/${id}`, recipeData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Partially update recipe (only send fields to update)
   * @param {string} id - Recipe ID
   * @param {Object} partialData - Partial recipe data (only fields to update)
   * @returns {Promise}
   */
  async patchRecipe(id, partialData) {
    try {
      const response = await apiClient.patch(`/api/v1/recipes/${id}`, partialData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete recipe
   * @param {string} id - Recipe ID
   * @returns {Promise}
   */
  async deleteRecipe(id) {
    try {
      const response = await apiClient.delete(`/api/v1/recipes/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Helper methods attached to prototype for image caching
RecipeService.prototype._cacheImages = async function (items = []) {
  if (!window || !window.caches) return; // Cache API not available
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    // load index
    const rawIndex = localStorage.getItem(IMAGE_INDEX_KEY) || '{}';
    const index = JSON.parse(rawIndex);

    for (const it of items) {
      const url = it?.image_url;
      if (!url) continue;
      // if already cached skip
      const last = index[url];
      if (last && Date.now() - last < RECIPE_TTL_MS) continue;

      try {
        const resp = await fetch(url, { mode: 'no-cors' });
        // If fetch succeeded, put into cache
        if (resp && resp.ok) {
          await cache.put(url, resp.clone());
        } else {
          // Some CDN or CORS might block. Still try to put a cached response if possible by fetching with default mode
          try {
            const r2 = await fetch(url);
            if (r2 && r2.ok) await cache.put(url, r2.clone());
          } catch (e) {}
        }
        index[url] = Date.now();
      } catch (err) {
        // ignore individual image errors
      }
    }

    // persist index and trim
    try {
      localStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
      await this._trimImageCache(index);
    } catch (err) {}
  } catch (err) {
    // ignore cache API errors
  }
};

RecipeService.prototype._trimImageCache = async function (index) {
  if (!window || !window.caches) return;
  try {
    const keys = Object.keys(index);
    if (keys.length <= MAX_CACHED_IMAGES) return;
    // Sort by timestamp ascending (oldest first)
    const sorted = keys.sort((a, b) => index[a] - index[b]);
    const toRemove = sorted.slice(0, keys.length - MAX_CACHED_IMAGES);
    const cache = await caches.open(IMAGE_CACHE_NAME);
    for (const url of toRemove) {
      try {
        await cache.delete(url);
        delete index[url];
      } catch (err) {}
    }
    localStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    // ignore
  }
};

export default new RecipeService();