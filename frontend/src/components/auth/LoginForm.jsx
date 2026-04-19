import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { container, backBtn, card, title, btn } from '../../styles/authStyles';
import { Input } from "./Input";
import { useNavigate } from 'react-router-dom';

export default function LoginForm({ onBack, onLogin }) {
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
    }))
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

    if (!form.email) {
      newErrors.email = 'Email wajib diisi';
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
      const res = await onLogin(form);
      
      // Store both token and user_id
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('userId', res.user_id);

      toast.success('Login berhasil');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div onClick={onBack} style={backBtn}>←</div>

      <div style={card}>
        <h2 style={title}>LOGIN</h2>

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
          {loading ? 'Loading...' : 'masuk'}
        </button>
      </div>
    </div>
  );
}