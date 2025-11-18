// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import userService from '../services/userService';
import uploadService from '../services/uploadService';
import LazyImage from '../components/common/LazyImage';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';

export default function ProfilePage({ onRecipeClick }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile());
  const [editingName, setEditingName] = useState(profile.username || 'Pengguna');
  const [savingName, setSavingName] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { favorites, loading: favLoading, refetch } = useFavorites();
  const { toggleFavorite } = useToggleFavorite();
  const [favFilter, setFavFilter] = useState('all');

  useEffect(() => {
    setProfile(userService.getUserProfile());
    setEditingName(userService.getUserProfile().username || 'Pengguna');
  }, []);

  const handleNameSave = () => {
    const newName = (editingName || 'Pengguna').trim();
    setSavingName(true);
    const res = userService.updateUsername(newName);
    if (res && res.success) {
      setProfile(res.data);
    } else {
      alert(res.message || 'Gagal menyimpan username');
    }
    setSavingName(false);
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setAvatarUploading(true);

      // Optionally upload to server; but store base64 locally so profile avatar shows immediately
      const base64 = await fileToBase64(file);

      // If backend upload is desired uncomment below (requires endpoint), else we persist base64 locally
      // await uploadService.uploadImage(file);

      const res = userService.updateAvatar(base64);
      if (res && res.success) {
        setProfile(res.data);
      } else {
        alert(res.message || 'Gagal mengunggah avatar');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat mengunggah avatar');
    } finally {
      setAvatarUploading(false);
      // reset input value to allow selecting same file again
      e.target.value = null;
    }
  };

  const handleRemoveFavorite = async (recipeId) => {
    // toggleFavorite will remove since recipe is favorited
    const result = await toggleFavorite(recipeId);
    if (result) {
      await refetch();
    } else {
      alert('Gagal menghapus favorit');
    }
  };

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Profile Pengguna
        </h1>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {profile.avatar ? (
                  <LazyImage src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400">No Avatar</div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0013.586 5H4z" />
                </svg>
              </label>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{profile.username}</div>
              <div className="text-sm text-gray-500">ID: {profile.userId}</div>
            </div>
          </div>

          {/* Edit username */}
          <div className="ml-auto w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="flex gap-2 mt-2">
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleNameSave}
                disabled={savingName}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                {savingName ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Ubah username dan unggah foto profil Anda di sini.</p>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Favorit</h2>
            <p className="text-sm text-gray-500">{favLoading ? 'Memuat...' : `${favorites.length} resep`}</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-3 mb-6">
            {/* counts */}
            {(() => {
              const total = favorites.length;
              const makananCount = favorites.filter(r => (r.category || '').toLowerCase().includes('makan')).length;
              const minumanCount = favorites.filter(r => (r.category || '').toLowerCase().includes('minum')).length;
              return (
                <>
                  <button
                    onClick={() => setFavFilter('all')}
                    className={`px-3 py-1 rounded-full ${favFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Semua ({total})
                  </button>
                  <button
                    onClick={() => setFavFilter('makanan')}
                    className={`px-3 py-1 rounded-full ${favFilter === 'makanan' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Makanan ({makananCount})
                  </button>
                  <button
                    onClick={() => setFavFilter('minuman')}
                    className={`px-3 py-1 rounded-full ${favFilter === 'minuman' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Minuman ({minumanCount})
                  </button>
                </>
              );
            })()}
          </div>

          {favLoading ? (
            <p className="text-gray-500">Memuat favorit...</p>
          ) : favorites.length === 0 ? (
            <p className="text-gray-500">Belum ada resep favorit.</p>
          ) : (
            (() => {
              const filtered = favorites.filter(r => {
                if (favFilter === 'all') return true;
                const cat = (r.category || '').toLowerCase();
                if (favFilter === 'makanan') return cat.includes('makan');
                if (favFilter === 'minuman') return cat.includes('minum');
                return true;
              });

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((recipe) => (
                    <div key={recipe.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                      <div
                        onClick={() => onRecipeClick && onRecipeClick(recipe.id, recipe.category)}
                        className="cursor-pointer"
                      >
                        <div className="h-40 w-full overflow-hidden">
                          <LazyImage src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                          <div className="text-xs font-semibold text-blue-700 bg-blue-100/90 px-2 py-1 rounded-full inline-block mb-2">{recipe.category}</div>
                          <h3 className="font-bold text-lg text-slate-800 line-clamp-2">{recipe.name}</h3>
                        </div>
                      </div>
                      <div className="p-3 border-t flex items-center justify-between">
                        <button
                          onClick={() => handleRemoveFavorite(recipe.id)}
                          className="px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                        <button
                          onClick={() => onRecipeClick && onRecipeClick(recipe.id, recipe.category)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Buka
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}