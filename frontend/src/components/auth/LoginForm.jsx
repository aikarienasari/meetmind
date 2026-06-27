import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { authFormStyles as loginStyles } from "./authFormStyles.js";

export default function LoginForm({ onBack, onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.includes("@")) return "Email tidak valid";
        break;
      case "password":
        if (value.length < 6) return "Minimal 6 karakter";
        break;
    }
    return "";
  };

  const validate = () => {
    const newErrors = {};

    if (!form.email) {
      newErrors.email = "Email wajib diisi";
    }

    if (form.password.length < 6) {
      newErrors.password = "Minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await onLogin(form);

      // Store both token and user_id
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("userId", res.user_id);

      toast.success("Login berhasil");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={loginStyles.container}>
      <button
        type="button"
        onClick={onBack}
        style={loginStyles.backBtn}
        aria-label="Kembali"
      >
        ←
      </button>

      <form style={loginStyles.card} onSubmit={handleSubmit}>
        <h2 style={loginStyles.title}>LOGIN</h2>

        <div style={loginStyles.field}>
          <label style={loginStyles.label} htmlFor="login-email">
            email:
          </label>
          <input
            id="login-email"
            name="email"
            value={form.email}
            onChange={handleChange}
            style={loginStyles.input}
          />
          {errors.email && <div style={loginStyles.error}>{errors.email}</div>}
        </div>

        <div style={loginStyles.field}>
          <label style={loginStyles.label} htmlFor="login-password">
            password:
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            style={loginStyles.input}
          />
          {errors.password && (
            <div style={loginStyles.error}>{errors.password}</div>
          )}
        </div>

        <div style={loginStyles.actions}>
          <button type="submit" disabled={loading} style={loginStyles.button}>
            {loading ? "loading" : "masuk"}
          </button>
        </div>
      </form>
    </div>
  );
}
