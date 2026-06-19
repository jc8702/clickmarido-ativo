import { useAuth } from '../hooks/useAuth';

export default function Navbar({ onMenuClick }) {
  const { logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 flex justify-between items-center h-16">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="md:hidden mr-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        {/* Espaço para logo mobile se quiser */}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">Admin CRM</span>
        <button 
          onClick={logout}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
