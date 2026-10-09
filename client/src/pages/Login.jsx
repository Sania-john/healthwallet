import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const go = m => { setMode(m); setError(''); setInfo(''); };

  const submit = async e => {
    e.preventDefault();
    setError(''); setInfo('');
    try {
      if (mode === 'forgot') {
        const { data } = await api.post('/auth/forgot', { email: form.email });
        setInfo(data.message + ' (Demo: check the server terminal for the link.)');
        return;
      }
      if (mode === 'register') await api.post('/auth/register', form);
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server');
    }
  };

  const title = { login: 'Sign in to your account', register: 'Create your account', forgot: 'Reset your password' }[mode];

  return (
    <div className="card">
      <h1>HealthWallet</h1>
      <p className="muted">{title}</p>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
        {mode !== 'forgot' && (
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={change} required />
        )}
        {error && <p className="error">{error}</p>}
        {info && <p className="muted">{info}</p>}
        <button type="submit">{{ login: 'Login', register: 'Register', forgot: 'Get reset link' }[mode]}</button>
      </form>
      <p className="muted">
        {mode === 'login' && (<>
          New here? <a href="#" onClick={e => { e.preventDefault(); go('register'); }}>Create an account</a>
          {' · '}
          <a href="#" onClick={e => { e.preventDefault(); go('forgot'); }}>Forgot password?</a>
        </>)}
        {mode !== 'login' && <a href="#" onClick={e => { e.preventDefault(); go('login'); }}>Back to login</a>}
      </p>
    </div>
  );
}