import React from 'react';

interface CustomerFormProps {
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  loading: boolean;
  error?: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

function validate(data: { first_name: string; last_name: string; email: string; phone: string }): FormErrors {
  const errors: FormErrors = {};
  if (!data.first_name.trim()) errors.first_name = 'El nombre es requerido';
  if (!data.last_name.trim()) errors.last_name = 'El apellido es requerido';
  if (!data.email.trim()) {
    errors.email = 'El email es requerido';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'El email no es válido';
  }
  if (!data.phone.trim()) errors.phone = 'El teléfono es requerido';
  return errors;
}

export default function CustomerForm({ onSubmit, loading, error }: CustomerFormProps) {
  const [formData, setFormData] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(formData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { first_name: true, last_name: true, email: true, phone: true };
    setTouched(allTouched);
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    }
  };

  const field = (
    label: string,
    name: keyof typeof formData,
    type: string,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} *
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {field('Nombre', 'first_name', 'text', 'Juan')}
        {field('Apellido', 'last_name', 'text', 'Pérez')}
      </div>
      {field('Email', 'email', 'email', 'tu@email.com')}
      {field('Teléfono', 'phone', 'tel', '+54 11 1234-5678')}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Confirmando...' : 'Confirmar Reserva'}
      </button>
    </form>
  );
}
