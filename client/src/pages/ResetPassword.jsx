import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/reset', { token, password });
      setMsg(data.message);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server');
    }
  };

  return (
    <div className="card">
      <h1>HealthWallet</h1>
      <p className="muted">Choose a new password</p>
      {!done ? (
        <form onSubmit={submit}>
          <input type="password" placeholder="New password (min 6 characters)"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button type="submit">Update password</button>
        </form>
      ) : (
        <p>{msg} <Link to="/login">Go to login</Link></p>
      )}
    </div>
  );
}