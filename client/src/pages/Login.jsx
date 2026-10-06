import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await api.post('/auth/register', form);
      }
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server');
    }
  };

  return (
    <div className="card">
      <h1>HealthWallet</h1>
      <p className="muted">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={change} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>
      <p className="muted">
        {mode === 'login' ? 'New here? ' : 'Already registered? '}
        <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>
          {mode === 'login' ? 'Create an account' : 'Login'}
        </a>
      </p>
    </div>
  );
}