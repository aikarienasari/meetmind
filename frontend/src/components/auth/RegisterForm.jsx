import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { authFormStyles } from './authFormStyles.js';

const registerStyles = {
  ...authFormStyles,
  card: {
    ...authFormStyles.card,
    minHeight: 500,
    padding: '44px 48px 38px',
  },
  title: {
    ...authFormStyles.title,
    margin: '0 0 40px',
    textTransform: 'none',
  },
  field: {
    ...authFormStyles.field,
    marginBottom: 18,
  },
  actions: {
    ...authFormStyles.actions,
    marginTop: 32,
  },
};

export default function RegisterForm({ onBack, onRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.includes('@')) return 'Email tidak valid';
        break;
      case 'password':
        if (value.length < 6) return 'Minimal 6 karakter';
        break;
      case 'confirm_password':
        if (value !== form.password) return 'Password tidak cocok';
        break;
    }
    return '';
  };

  const validate = () => {
    const newErrors = {};

    if (!form.email.includes('@')) {
      newErrors.email = 'Email tidak valid';
    }

    if (form.password.length < 6) {
      newErrors.password = 'Minimal 6 karakter';
    }

    if (form.confirm_password !== form.password) {
      newErrors.confirm_password = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onRegister(form);
      toast.success('Register berhasil');
      navigate('/login');
    } catch {
      toast.error('Register gagal');
      setLoading(false);
    }
  };

  return (
    <div style={registerStyles.container}>
      <button type="button" onClick={onBack} style={registerStyles.backBtn} aria-label="Kembali">
        ←
      </button>

      <form style={registerStyles.card} onSubmit={handleSubmit}>
        <h2 style={registerStyles.title}>Register</h2>

        <div style={registerStyles.field}>
          <label style={registerStyles.label} htmlFor="register-email">email:</label>
          <input
            id="register-email"
            name="email"
            value={form.email}
            onChange={handleChange}
            style={registerStyles.input}
          />
          {errors.email && <div style={registerStyles.error}>{errors.email}</div>}
        </div>

        <div style={registerStyles.field}>
          <label style={registerStyles.label} htmlFor="register-password">password:</label>
          <input
            id="register-password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            style={registerStyles.input}
          />
          {errors.password && <div style={registerStyles.error}>{errors.password}</div>}
        </div>

        <div style={registerStyles.field}>
          <label style={registerStyles.label} htmlFor="register-confirm-password">konfirmasi password:</label>
          <input
            id="register-confirm-password"
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            style={registerStyles.input}
          />
          {errors.confirm_password && <div style={registerStyles.error}>{errors.confirm_password}</div>}
        </div>

        <div style={registerStyles.actions}>
          <button type="submit" disabled={loading} style={registerStyles.button}>
            {loading ? 'loading' : 'daftar'}
          </button>
        </div>

      </form>
    </div>
  );
}
