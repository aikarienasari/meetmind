import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { container, backBtn, card, title, btn } from '../../styles/authStyles';
import { Input } from './Input';
import { useNavigate } from 'react-router-dom';

export default function RegisterForm({ onBack, onRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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
    <div style={container}>
      <div onClick={onBack} style={backBtn}>←</div>

      <div style={card}>
        <h2 style={title}>Register</h2>

        <Input
          label="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <button disabled={loading} style={btn} onClick={handleSubmit}>
          {loading ? 'Loading...' : 'Daftar'}
        </button>

      </div>
    </div>
  );
}