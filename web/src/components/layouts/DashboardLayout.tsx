import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-indigo-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-indigo-800">
          <h1 className={`font-bold ${sidebarOpen ? 'text-xl' : 'text-sm'}`}>
            {sidebarOpen ? 'TurnoYa' : 'T'}
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="p-3 rounded hover:bg-indigo-800 block"
            title="Dashboard"
          >
            <span className={sidebarOpen ? 'block' : 'hidden'}>📊 Dashboard</span>
            <span className={sidebarOpen ? 'hidden' : 'block text-xl'}>📊</span>
          </Link>
          <Link
            to="/dashboard/horarios"
            className="p-3 rounded hover:bg-indigo-800 block"
            title="Horarios"
          >
            <span className={sidebarOpen ? 'block' : 'hidden'}>⏰ Horarios</span>
            <span className={sidebarOpen ? 'hidden' : 'block text-xl'}>⏰</span>
          </Link>
          <Link
            to="/dashboard/servicios"
            className="p-3 rounded hover:bg-indigo-800 block"
            title="Servicios"
          >
            <span className={sidebarOpen ? 'block' : 'hidden'}>⚙️ Servicios</span>
            <span className={sidebarOpen ? 'hidden' : 'block text-xl'}>⚙️</span>
          </Link>
          <Link
            to="/dashboard/configuracion"
            className="p-3 rounded hover:bg-indigo-800 block"
            title="Configuración"
          >
            <span className={sidebarOpen ? 'block' : 'hidden'}>🔧 Configuración</span>
            <span className={sidebarOpen ? 'hidden' : 'block text-xl'}>🔧</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 rounded hover:bg-indigo-800"
            title={sidebarOpen ? 'Contraer' : 'Expandir'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {profile?.business_name || 'Mi Negocio'}
          </h2>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
