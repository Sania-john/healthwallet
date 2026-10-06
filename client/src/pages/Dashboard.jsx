import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('self');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const load = async () => {
    try {
      const { data } = await api.get('/profiles');
      setProfiles(data);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => { load(); }, []);

  const addProfile = async e => {
    e.preventDefault();
    await api.post('/profiles', { name, relation });
    setName('');
    load();
  };

  return (
    <div className="card wide">
      <div className="row">
        <h1>Hello, {localStorage.getItem('userName')}</h1>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>

      <h2>Family profiles</h2>
      <ul>
        {profiles.map(p => (
          <li key={p._id}>{p.name} <span className="muted">({p.relation})</span></li>
        ))}
        {profiles.length === 0 && <li className="muted">No profiles yet</li>}
      </ul>

      <form onSubmit={addProfile} className="row">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <select value={relation} onChange={e => setRelation(e.target.value)}>
          <option>self</option><option>mother</option><option>father</option>
          <option>spouse</option><option>child</option><option>other</option>
        </select>
        <button type="submit">Add</button>
      </form>
    </div>
  );
}