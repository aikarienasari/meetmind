import RegisterForm from "../components/auth/RegisterForm.jsx";
import { register } from "../services/authService";

export default function RegisterPage(){
    const handleRegister = async (data) => {
        return await register(data);
    }
    return <RegisterForm onRegister={handleRegister} onBack={() => window.history.back()}/>;
}