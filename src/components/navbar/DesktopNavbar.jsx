// src/components/DesktopNavbar.jsx
import { Plus } from 'lucide-react';
import logoUrl from '../../assets/LOGORN.png';

export default function DesktopNavbar({ currentPage, onNavigate, onCreateRecipe }) {
  const navItems = [
    { id: 'home', label: 'Beranda' },
    { id: 'makanan', label: 'Makanan' },
    { id: 'minuman', label: 'Minuman' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <nav className="hidden md:block shadow-lg border-b border-blue-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img
                src={logoUrl}
                alt="Resep Nusantara Logo"
                className="w-12 h-12 object-contain filter drop-shadow-md transform transition-transform duration-300 group-hover:scale-110"
              />
              {/* Decorative particles */}
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-60" />
              <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-50" style={{ animationDelay: '300ms' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                Resep
              </h1>
              <h2 className="text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent -mt-1">
                Nusantara
              </h2>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-3 text-base font-medium transition-all duration-200 border-b-2 ${
                  currentPage === item.id
                    ? 'text-blue-600 border-blue-500'
                    : 'text-slate-600 border-transparent hover:text-blue-500 hover:border-blue-300'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Buat Resep Button */}
            <button
              onClick={onCreateRecipe}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Resep</span>
            </button>
          </div>
         
        </div>
      </div>
    </nav>
  );
}