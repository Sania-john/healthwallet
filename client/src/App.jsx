import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SharedView from './pages/SharedView.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function Protected({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset/:token" element={<ResetPassword />} />
      <Route path="/share/:token" element={<SharedView />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/profile/:id" element={<Protected><ProfilePage /></Protected>} />
    </Routes>
  );
}