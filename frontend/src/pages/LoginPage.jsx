import LoginForm from "../components/auth/LoginForm.jsx";
import { login } from "../services/authService.js";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const handleLogin = async (data) => {
    return await login(data);
  };
  return <LoginForm onLogin={handleLogin} onBack={() => navigate('/')}/>;
}