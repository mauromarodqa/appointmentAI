import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container-app py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">TurnoYa</h1>
          <div className="space-x-4">
            {session ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Mi Panel
              </button>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block"
              >
                Comenzar
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container-app py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Gestiona tu agenda de turnos fácilmente
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          TurnoYa es la plataforma que permite a comercios y profesionales independientes
          autogestionar su agenda, reducir ausentismo y eliminar la fricción de reservas manuales.
        </p>

        {!session && (
          <Link
            to="/auth"
            className="inline-block px-8 py-3 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Comienza Gratis
          </Link>
        )}
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="container-app">
          <h3 className="text-3xl font-bold text-center mb-12">¿Por qué elegir TurnoYa?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border rounded-lg">
              <h4 className="text-xl font-semibold mb-4">⚡ Rápido</h4>
              <p className="text-gray-600">
                Tus clientes reservan en menos de 2 minutos sin crear cuentas complejas.
              </p>
            </div>
            <div className="p-8 border rounded-lg">
              <h4 className="text-xl font-semibold mb-4">📅 Inteligente</h4>
              <p className="text-gray-600">
                Cálculo automático de disponibilidad. Adiós dobles reservas y errores.
              </p>
            </div>
            <div className="p-8 border rounded-lg">
              <h4 className="text-xl font-semibold mb-4">🔔 Recordatorios</h4>
              <p className="text-gray-600">
                Notificaciones automáticas reducen ausentismo hasta 50%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app py-16 text-center">
        <h3 className="text-3xl font-bold mb-6">¿Listo para empezar?</h3>
        {!session && (
          <Link
            to="/auth"
            className="inline-block px-8 py-3 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Crear Mi Cuenta
          </Link>
        )}
      </section>
    </div>
  );
}
