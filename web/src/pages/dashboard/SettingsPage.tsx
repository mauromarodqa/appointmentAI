import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function SettingsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    description: '',
    phone: '',
    address: '',
    timezone: 'America/Argentina/Buenos_Aires',
    logo_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        slug: profile.slug || '',
        description: profile.description || '',
        phone: profile.phone || '',
        address: profile.address || '',
        timezone: profile.timezone || 'America/Argentina/Buenos_Aires',
        logo_url: profile.logo_url || '',
      });
    }
  }, [profile]);

  const validateSlug = async (slug: string) => {
    setSlugError('');
    setSlugAvailable(null);

    if (!slug) {
      setSlugError('El slug es requerido');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Solo letras minúsculas, números y guiones permitidos');
      return;
    }

    if (slug.length < 3 || slug.length > 30) {
      setSlugError('El slug debe tener entre 3 y 30 caracteres');
      return;
    }

    if (profile?.slug === slug) {
      setSlugAvailable(true);
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slug)
        .single();

      if (data) {
        setSlugAvailable(false);
        setSlugError('Este slug ya está en uso');
      } else {
        setSlugAvailable(true);
        setSlugError('');
      }
    } catch {
      setSlugAvailable(true);
      setSlugError('');
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, slug: value });
    validateSlug(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.business_name.trim()) {
      setError('El nombre del negocio es requerido');
      setLoading(false);
      return;
    }

    if (!slugAvailable) {
      setError('El slug no está disponible');
      setLoading(false);
      return;
    }

    try {
      if (!profile) {
        // Create new profile if it doesn't exist
        if (!session?.user) {
          setError('No hay sesión activa');
          setLoading(false);
          return;
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            user_id: session.user.id,
            business_name: formData.business_name,
            slug: formData.slug,
            description: formData.description,
            phone: formData.phone,
            address: formData.address,
            timezone: formData.timezone,
            logo_url: formData.logo_url,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setSuccess('Perfil creado correctamente');
        // Refresh page to load profile
        setTimeout(() => window.location.reload(), 1500);
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            business_name: formData.business_name,
            slug: formData.slug,
            description: formData.description,
            phone: formData.phone,
            address: formData.address,
            timezone: formData.timezone,
            logo_url: formData.logo_url,
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
        setSuccess('Perfil actualizado correctamente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Perfil</h1>
        <p className="text-gray-600 mt-2">Completa la información de tu negocio</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Nombre del Negocio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Negocio *
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="Ej: Peluquería Juan"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Pública *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">turnoya.com/</span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="mi-negocio"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              {slugAvailable === true && (
                <span className="text-green-600 text-sm font-medium">✓ Disponible</span>
              )}
              {slugAvailable === false && (
                <span className="text-red-600 text-sm font-medium">✗ No disponible</span>
              )}
            </div>
            {slugError && <p className="text-red-600 text-sm mt-1">{slugError}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe tu negocio brevemente..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ej: +54 11 1234-5678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej: Av. Principal 123, CABA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Zona Horaria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona Horaria
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="America/Argentina/Buenos_Aires">Buenos Aires (ART)</option>
              <option value="America/New_York">Nueva York (EST)</option>
              <option value="America/Los_Angeles">Los Angeles (PST)</option>
              <option value="Europe/Madrid">Madrid (CET)</option>
              <option value="Europe/London">Londres (GMT)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>

          {/* URL del Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Logo
            </label>
            <input
              type="url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {formData.logo_url && (
              <img src={formData.logo_url} alt="Logo" className="mt-2 h-16 rounded" />
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={loading || !slugAvailable}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Public Link */}
        {formData.slug && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Tu link público:</strong> <br />
              <code className="bg-white px-2 py-1 rounded">turnoya.com/{formData.slug}</code>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
