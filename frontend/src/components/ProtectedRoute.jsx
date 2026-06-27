import { Navigate } from 'react-router-dom';
import { isMockMode } from '../mocks/mockData';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token && !isMockMode()) {
    return <Navigate to="/login" replace />;
  }

  if (!token && isMockMode()) {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('userId', 'mock-user-001');
  }

  return children;
}
