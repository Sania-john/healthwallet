import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import TrendChart from '../components/TrendChart.jsx';

const LANGS = [['en', 'English'], ['ta', 'தமிழ்'], ['hi', 'हिन्दी']];

export default function SharedView() {
  const { token } = useParams();
  const [lang, setLang] = useState('en');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:5000/api/share/public/${token}`, { params: { lang } })
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load this link'));
  }, [token, lang]);

  if (error) return <div className="card"><h1>HealthWallet</h1><p className="error">{error}</p></div>;
  if (!data) return <div className="card"><p className="muted">Loading...</p></div>;

  const fmt = d => new Date(d).toLocaleDateString();

  return (
    <div className="card wide">
      <h1>{data.profile.name}</h1>
      <p className="muted">
        {data.profile.relation} · Read-only view · Link expires {new Date(data.expiresAt).toLocaleString()}
      </p>

      <div className="row" style={{ justifyContent: 'flex-start' }}>
        {LANGS.map(([code, label]) => (
          <button key={code} className={code === lang ? '' : 'secondary'} onClick={() => setLang(code)}>{label}</button>
        ))}
      </div>
      <div className="summary">
        <p><strong>{data.summary.overall}</strong></p>
        <ul>
          {data.summary.items.map(i => (
            <li key={i.testName} className={`sum ${i.status}`}>{i.text}</li>
          ))}
        </ul>
        <p className="muted">{data.summary.disclaimer}</p>
      </div>

      <h2>Trends</h2>
      <TrendChart measurements={data.measurements} />

      <h2>Values</h2>
      <div className="scroll">
        <table>
          <thead><tr><th>Date</th><th>Test</th><th>Value</th><th>Range</th><th>Status</th></tr></thead>
          <tbody>
            {data.measurements.map(m => (
              <tr key={m._id}>
                <td>{fmt(m.date)}</td>
                <td>{m.testName}</td>
                <td>{m.value} <span className="muted">{m.unit}</span></td>
                <td>{m.refLow} - {m.refHigh}</td>
                <td><span className={`badge ${m.status}`}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}