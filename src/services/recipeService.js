import { apiClient } from '../config/api';

const JSON_CACHE_KEY = 'recipes_json_cache_v2';
const DEFAULT_LIST_TTL = 1000 * 60 * 5; // 5 minutes
const DEFAULT_RECIPE_TTL = 1000 * 60 * 60; // 1 hour

class RecipeService {
  async getRecipes(params = {}) {
    const cacheKey = `${JSON_CACHE_KEY}:list:${JSON.stringify(params || {})}`;
    const debug = !!window?.__RECIPE_CACHE_DEBUG;
    try {
      // try fresh cache first
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const ttl = params.ttl || DEFAULT_LIST_TTL;
          if (parsed?.ts && Date.now() - parsed.ts < ttl) {
            if (debug) console.debug('[recipeService] returning cached list', cacheKey);
            if (Array.isArray(parsed.data)) this._preloadImages(parsed.data);
            return { success: true, data: parsed.data, pagination: parsed.pagination || null };
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      const response = await apiClient.get('/api/v1/recipes', { params });

      // store cache (best-effort)
      try {
        const payload = { ts: Date.now(), data: response.data || response || [], pagination: response.pagination || null };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
        if (debug) console.debug('[recipeService] cached list', cacheKey);
        if (Array.isArray(payload.data)) setTimeout(() => this._preloadImages(payload.data), 0);
      } catch (e) {
        // ignore storage quota errors
      }

      return response;
    } catch (error) {
      // network failed -> return stale cache if available
      const raw2 = localStorage.getItem(cacheKey);
      if (raw2) {
        try {
          const parsed = JSON.parse(raw2);
          if (debug) console.debug('[recipeService] returning stale cached list after network error', cacheKey);
          return { success: true, data: parsed.data || [], pagination: parsed.pagination || null };
        } catch (e) {}
      }
      throw error;
    }
  }

  async getRecipeById(id) {
    if (!id) return { success: false, message: 'No id provided' };
    const cacheKey = `${JSON_CACHE_KEY}:recipe:${id}`;
    const debug = !!window?.__RECIPE_CACHE_DEBUG;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && Date.now() - parsed.ts < DEFAULT_RECIPE_TTL) {
            if (debug) console.debug('[recipeService] returning cached recipe', id);
            if (parsed.data) this._preloadImages([parsed.data]);
            return { success: true, data: parsed.data };
          }
        } catch (e) {}
      }

      const response = await apiClient.get(`/api/v1/recipes/${id}`);
      try {
        const payload = { ts: Date.now(), data: response.data || response };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
        if (debug) console.debug('[recipeService] cached recipe', id);
        if (payload.data) setTimeout(() => this._preloadImages([payload.data]), 0);
      } catch (e) {}

      return response;
    } catch (error) {
      const raw2 = localStorage.getItem(cacheKey);
      if (raw2) {
        try {
          const parsed = JSON.parse(raw2);
          if (debug) console.debug('[recipeService] returning stale cached recipe after network error', id);
          return { success: true, data: parsed.data };
        } catch (e) {}
      }
      throw error;
    }
  }

  async createRecipe(recipeData) {
    try {
      const response = await apiClient.post('/api/v1/recipes', recipeData);
      // clear list caches (best-effort)
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:list:${JSON.stringify({})}`); } catch (e) {}
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateRecipe(id, recipeData) {
    try {
      const response = await apiClient.put(`/api/v1/recipes/${id}`, recipeData);
      // invalidate caches
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:recipe:${id}`); } catch (e) {}
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:list:${JSON.stringify({})}`); } catch (e) {}
      return response;
    } catch (error) {
      throw error;
    }
  }

  async patchRecipe(id, partialData) {
    try {
      const response = await apiClient.patch(`/api/v1/recipes/${id}`, partialData);
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:recipe:${id}`); } catch (e) {}
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:list:${JSON.stringify({})}`); } catch (e) {}
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteRecipe(id) {
    try {
      const response = await apiClient.delete(`/api/v1/recipes/${id}`);
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:recipe:${id}`); } catch (e) {}
      try { localStorage.removeItem(`${JSON_CACHE_KEY}:list:${JSON.stringify({})}`); } catch (e) {}
      return response;
    } catch (error) {
      throw error;
    }
  }
}

RecipeService.prototype._preloadImages = function (items = []) {
  const debug = !!window?.__RECIPE_CACHE_DEBUG;
  if (!items || !items.length) return;
  if (debug) console.debug('[recipeService] preloadImages count=', items.length);
  for (const it of items) {
    const url = it?.image_url;
    if (!url) continue;
    try {
      const img = new Image();
      img.onload = () => { if (debug) console.debug('[recipeService] image onload', url); };
      img.onerror = () => { if (debug) console.debug('[recipeService] image onerror', url); };
      img.src = url;
      setTimeout(() => { if (debug) console.debug('[recipeService] preload timeout for', url); }, 3000);
    } catch (e) {
      if (debug) console.debug('[recipeService] preload failed for', url, e && e.message);
    }
  }
};

export default new RecipeService();