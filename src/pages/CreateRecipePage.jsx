// src/pages/CreateRecipePage.jsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Plus, Image as ImageIcon, Loader, Save, AlertCircle, CheckCircle } from 'lucide-react';
import recipeService from '../services/recipeService';
import uploadService from '../services/uploadService';
import { saveDraft, loadDraft, deleteDraft, hasDraft, getDraftTimestamp, formatDraftTime } from '../utils/draftStorage';
import ConfirmModal from '../components/modals/ConfirmModal';

export default function CreateRecipePage({ onBack, onSuccess }) {
  // Step state: 'upload' or 'form'
  const [currentStep, setCurrentStep] = useState('upload');
  
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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState(['']);
  
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft('create')) {
      const timestamp = getDraftTimestamp('create');
      setDraftTimestamp(timestamp);
      setShowDraftModal(true);
    }
  }, []);

  // Auto-save draft every 30 seconds (only when in form step)
  useEffect(() => {
    if (!autoSaveEnabled || currentStep !== 'form') return;

    const interval = setInterval(() => {
      handleSaveDraft();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [formData, ingredients, steps, autoSaveEnabled, currentStep]);

  // Load draft
  const handleLoadDraft = () => {
    const draft = loadDraft('create');
    if (draft) {
      setFormData(draft.formData || formData);
      setIngredients(draft.ingredients || ingredients);
      setSteps(draft.steps || steps);
      if (draft.uploadedImageUrl) {
        setUploadedImageUrl(draft.uploadedImageUrl);
        setImagePreview(draft.uploadedImageUrl);
        setCurrentStep('form'); // Go to form if image was uploaded
      }
      setShowDraftModal(false);
      alert('Draft berhasil dimuat!');
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    deleteDraft('create');
    setShowDraftModal(false);
    setDraftTimestamp(null);
  };

  // Save draft manually
  const handleSaveDraft = () => {
    const draftData = {
      formData,
      ingredients,
      steps,
      uploadedImageUrl,
    };
    
    const success = saveDraft(draftData, 'create');
    if (success) {
      const timestamp = getDraftTimestamp('create');
      setDraftTimestamp(timestamp);
    }
  };

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

  // Upload image to server
  const handleUploadImage = async () => {
    if (!imageFile) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const uploadResult = await uploadService.uploadImage(imageFile);
      
      if (uploadResult.success) {
        setUploadedImageUrl(uploadResult.data.url);
        setCurrentStep('form');
        alert('✅ Gambar berhasil diupload! Silakan isi form resep.');
      } else {
        throw new Error(uploadResult.error || 'Gagal upload gambar');
      }
    } catch (err) {
      setError(err.message || 'Gagal mengupload gambar');
    } finally {
      setUploading(false);
    }
  };

  // Change uploaded image
  const handleChangeImage = () => {
    setCurrentStep('upload');
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl('');
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
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
    const validSteps = steps.filter(step => step.trim());
    if (validSteps.length === 0) {
      setError('Minimal harus ada 1 langkah');
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!uploadedImageUrl) {
      setError('Gambar harus diupload terlebih dahulu');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      // Prepare recipe data with uploaded image URL
      const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
      const validSteps = steps.filter(step => step.trim());

      const recipeData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        image_url: uploadedImageUrl, // Use uploaded image URL
        prep_time: parseInt(formData.prep_time),
        cook_time: parseInt(formData.cook_time),
        servings: parseInt(formData.servings),
        difficulty: formData.difficulty,
        is_featured: formData.is_featured,
        ingredients: validIngredients,
        steps: validSteps,
      };

      // Create recipe
      const result = await recipeService.createRecipe(recipeData);

      if (result.success) {
        alert('Resep berhasil dibuat!');
        deleteDraft('create'); // Clear draft after successful creation
        if (onSuccess) {
          onSuccess(result.data);
        } else if (onBack) {
          onBack();
        }
      } else {
        throw new Error(result.message || 'Gagal membuat resep');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat membuat resep');
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 pb-20 md:pb-8">
      {/* Draft Modal */}
      <ConfirmModal
        isOpen={showDraftModal}
        onClose={handleDiscardDraft}
        onConfirm={handleLoadDraft}
        title="Draft Ditemukan"
        message={`Anda memiliki draft yang disimpan ${draftTimestamp ? formatDraftTime(draftTimestamp) : ''}. Apakah Anda ingin melanjutkan draft tersebut?`}
        confirmText="Muat Draft"
        cancelText="Mulai Baru"
        variant="info"
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </button>

          {/* Draft Info & Save Button */}
          <div className="flex items-center gap-3">
            {draftTimestamp && (
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                <Save className="w-4 h-4" />
                <span>Tersimpan {formatDraftTime(draftTimestamp)}</span>
              </div>
            )}
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Simpan draft"
            >
              <Save className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Simpan Draft</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/40">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Buat Resep Baru</h1>
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-600">Bagikan resep favoritmu dengan komunitas</p>
            {autoSaveEnabled && currentStep === 'form' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <AlertCircle className="w-4 h-4" />
                <span>Auto-save aktif</span>
              </div>
            )}
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {currentStep === 'form' ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Upload Gambar</span>
            </div>
            <div className={`h-1 w-16 ${currentStep === 'form' ? 'bg-green-600' : 'bg-slate-300'}`}></div>
            <div className={`flex items-center gap-2 ${currentStep === 'form' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                2
              </div>
              <span className="font-medium">Isi Form</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* STEP 1: Image Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Foto Resep</h2>
                <p className="text-slate-600">Gambar harus diupload terlebih dahulu sebelum mengisi form</p>
              </div>

              {!imagePreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg text-slate-700 font-medium">Klik untuk pilih foto</p>
                      <p className="text-sm text-slate-500 mt-2">
                        Maksimal 5MB (.jpg, .jpeg, .png, .webp)
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-80 object-cover rounded-xl shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={uploading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Mengupload...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload Gambar & Lanjutkan</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Form Fields */}
          {currentStep === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Uploaded Image Preview */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                      <CheckCircle className="w-5 h-5" />
                      <span>Gambar berhasil diupload</span>
                    </div>
                    <p className="text-sm text-slate-600">Silakan isi form di bawah untuk melengkapi resep</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeImage}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    Ganti Gambar
                  </button>
                </div>
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
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
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
                disabled={creating}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Membuat resep...
                  </>
                ) : (
                  'Buat Resep'
                )}
              </button>
            </div>
          </form>
          )}
        </div>
      </main>
    </div>
  );
}