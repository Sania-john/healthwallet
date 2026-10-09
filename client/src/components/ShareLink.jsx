import { useEffect, useState } from 'react';
import api from '../api';

export default function ShareLink({ profileId }) {
  const [hours, setHours] = useState(24);
  const [links, setLinks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadLinks = () =>
    api.get('/share', { params: { profileId } })
      .then(r => setLinks(r.data))
      .catch(err => console.error('share list failed:', err));

  useEffect(() => { loadLinks(); }, [profileId]);

  const urlFor = token => `${window.location.origin}/share/${token}`;

  const create = async () => {
    setError('');
    try {
      const { data } = await api.post('/share', { profileId, hours });
      setCurrent(data);
      setCopied(false);
      loadLinks();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const revoke = async id => {
    await api.delete(`/share/${id}`);
    setCurrent(null);
    loadLinks();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(urlFor(current.token));
      setCopied(true);
    } catch {
      window.prompt('Copy this link:', urlFor(current.token));
    }
  };

  return (
    <div>
      <p className="muted">
        Create a read-only link for your doctor. They can see values and trends but not your files, and the link stops working after it expires.
      </p>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <select value={hours} onChange={e => setHours(Number(e.target.value))} style={{ maxWidth: 180, flex: 'none' }}>
          <option value={1}>Expires in 1 hour</option>
          <option value={24}>Expires in 24 hours</option>
          <option value={168}>Expires in 7 days</option>
        </select>
        <button onClick={create}>Create share link</button>
      </div>
      {error && <p className="error">{error}</p>}

      {current && (
        <div className="sharebox">
          <div style={{ width: '100%' }}>
            <input readOnly value={urlFor(current.token)} onFocus={e => e.target.select()} />
            <button className="secondary" onClick={copy} style={{ marginTop: 8 }}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <p className="muted">Expires: {new Date(current.expiresAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      {links.length > 0 && (
        <>
          <p className="muted" style={{ marginTop: 16 }}>Active links</p>
          <ul>
            {links.map(l => (
              <li key={l._id} className="record">
                <span className="muted">Expires {new Date(l.expiresAt).toLocaleString()}</span>
                <button className="secondary" onClick={() => revoke(l._id)}>Revoke</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}