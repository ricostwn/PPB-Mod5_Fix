// src/pages/EditRecipePage.jsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Plus, Image as ImageIcon, Loader } from 'lucide-react';
import recipeService from '../services/recipeService';
import uploadService from '../services/uploadService';

export default function EditRecipePage({ recipeId, onBack, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: 'makanan',
    description: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: 'mudah',
    is_featured: false,
  });

  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState(['']);
  
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Load recipe data
  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const result = await recipeService.getRecipeById(recipeId);
        
        if (result.success) {
          const recipe = result.data;
          setFormData({
            name: recipe.name || '',
            category: recipe.category || 'makanan',
            description: recipe.description || '',
            prep_time: recipe.prep_time || '',
            cook_time: recipe.cook_time || '',
            servings: recipe.servings || '',
            difficulty: recipe.difficulty || 'mudah',
            is_featured: recipe.is_featured || false,
          });
          
          setCurrentImageUrl(recipe.image_url || '');
          setIngredients(recipe.ingredients && recipe.ingredients.length > 0 
            ? recipe.ingredients 
            : [{ name: '', quantity: '' }]
          );
          
          // Convert steps to array of strings if they're objects
          let stepsArray = [''];
          if (recipe.steps && recipe.steps.length > 0) {
            stepsArray = recipe.steps.map(step => {
              // If step is an object with a 'step' property, extract it
              if (typeof step === 'object' && step.step) {
                return step.step;
              }
              // If step is already a string, use it
              return typeof step === 'string' ? step : '';
            });
          }
          setSteps(stepsArray);
        } else {
          throw new Error('Gagal memuat data resep');
        }
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan saat memuat resep');
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      loadRecipe();
    }
  }, [recipeId]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file harus .jpg, .jpeg, .png, atau .webp');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  // Remove new image (revert to original)
  const handleRemoveNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  // Remove original image
  const handleRemoveOriginalImage = () => {
    setCurrentImageUrl('');
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle ingredient changes
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  // Handle step changes
  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nama resep wajib diisi');
      return false;
    }

    if (formData.name.trim().length < 3) {
      setError('Nama resep minimal 3 karakter');
      return false;
    }

    if (!formData.prep_time || formData.prep_time <= 0) {
      setError('Waktu persiapan harus lebih dari 0');
      return false;
    }

    if (!formData.cook_time || formData.cook_time <= 0) {
      setError('Waktu memasak harus lebih dari 0');
      return false;
    }

    if (!formData.servings || formData.servings <= 0) {
      setError('Jumlah porsi harus lebih dari 0');
      return false;
    }

    // Validate ingredients
    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
    if (validIngredients.length === 0) {
      setError('Minimal harus ada 1 bahan');
      return false;
    }

    // Validate steps
    const validSteps = steps.filter(step => {
      // Ensure step is a string before calling trim
      if (typeof step === 'string') {
        return step.trim();
      }
      // If step is an object, check if it has a 'step' property
      if (typeof step === 'object' && step.step) {
        return step.step.trim();
      }
      return false;
    });
    if (validSteps.length === 0) {
      setError('Minimal harus ada 1 langkah');
      return false;
    }

    return true;
  };

  // Submit form (PATCH - partial update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);

      // Prepare update data
      const updateData = {};

      // Step 1: Upload new image if selected
      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadService.uploadImage(imageFile);
        if (uploadResult.success) {
          updateData.image_url = uploadResult.data.url;
        } else {
          throw new Error('Gagal upload gambar');
        }
        setUploading(false);
      } else if (!currentImageUrl && !imageFile) {
        // If original image was removed and no new image
        updateData.image_url = '';
      }

      // Step 2: Add other fields
      const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
      const validSteps = steps.filter(step => {
        if (typeof step === 'string') {
          return step.trim();
        }
        if (typeof step === 'object' && step.step) {
          return step.step.trim();
        }
        return false;
      }).map(step => {
        // Convert to string if it's an object
        if (typeof step === 'object' && step.step) {
          return step.step;
        }
        return step;
      });

      updateData.name = formData.name.trim();
      updateData.category = formData.category;
      updateData.description = formData.description.trim();
      updateData.prep_time = parseInt(formData.prep_time);
      updateData.cook_time = parseInt(formData.cook_time);
      updateData.servings = parseInt(formData.servings);
      updateData.difficulty = formData.difficulty;
      updateData.is_featured = formData.is_featured;
      updateData.ingredients = validIngredients;
      updateData.steps = validSteps;

      // Step 3: Update recipe using PUT
      const result = await recipeService.updateRecipe(recipeId, updateData);

      if (result.success) {
        alert('Resep berhasil diperbarui!');
        if (onSuccess) {
          onSuccess(result.data);
        } else if (onBack) {
          onBack();
        }
      } else {
        throw new Error(result.message || 'Gagal memperbarui resep');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui resep');
    } finally {
      setUpdating(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Memuat data resep...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/40">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Edit Resep</h1>
          <p className="text-slate-600 mb-8">Perbarui informasi resepmu</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Foto Resep
              </label>
              
              {/* Show new image preview if selected */}
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveNewImage}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                    Gambar Baru
                  </div>
                </div>
              ) : currentImageUrl && currentImageUrl.trim() !== '' ? (
                /* Show current image */
                <div className="relative">
                  <img
                    src={currentImageUrl}
                    alt="Current"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveOriginalImage}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-4">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-change"
                    />
                    <label
                      htmlFor="image-change"
                      className="px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full hover:bg-white transition-colors cursor-pointer text-sm font-medium shadow-lg inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Ganti Gambar
                    </label>
                  </div>
                </div>
              ) : (
                /* No image - show upload area */
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-medium">Klik untuk upload foto</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Maksimal 5MB (.jpg, .jpeg, .png, .webp)
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Resep <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nasi Goreng Spesial"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="makanan">Makanan</option>
                  <option value="minuman">Minuman</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ceritakan tentang resep ini..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Time & Servings */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Waktu Persiapan (menit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="prep_time"
                  value={formData.prep_time}
                  onChange={handleChange}
                  placeholder="15"
                  min="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Waktu Memasak (menit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="cook_time"
                  value={formData.cook_time}
                  onChange={handleChange}
                  placeholder="20"
                  min="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Porsi (orang) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleChange}
                  placeholder="4"
                  min="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tingkat Kesulitan <span className="text-red-500">*</span>
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Bahan-bahan <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      placeholder="Nama bahan"
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      placeholder="Jumlah"
                      className="w-32 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Bahan
                </button>
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Langkah-langkah <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <textarea
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder="Tulis langkah..."
                      rows={2}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={steps.length === 1}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Langkah
                </button>
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_featured" className="text-sm text-slate-700 cursor-pointer">
                Tandai sebagai resep unggulan
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={onBack}
                disabled={updating || uploading}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updating || uploading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading gambar...
                  </>
                ) : updating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Memperbarui resep...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}