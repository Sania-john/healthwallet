import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import Summary from '../components/Summary.jsx';
import TrendChart from '../components/TrendChart.jsx';
import ShareLink from '../components/ShareLink.jsx';

const emptyForm = { type: 'lab_report', title: '', doctor: '', date: '' };

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
  const [p, r, m] = await Promise.allSettled([
    api.get('/profiles'),
    api.get('/records', { params: { profileId: id } }),
    api.get('/measurements', { params: { profileId: id } })
  ]);
  if (p.status === 'fulfilled') setProfile(p.value.data.find(x => x._id === id));
  else console.error('profiles failed:', p.reason);
  if (r.status === 'fulfilled') setRecords(r.value.data);
  else console.error('records failed:', r.reason);
  if (m.status === 'fulfilled') setMeasurements(m.value.data);
  else console.error('measurements failed:', m.reason);
};

  useEffect(() => { load().catch(console.error); }, [id]);

  const reason = err =>
    err.response?.data?.message || err.message || 'Unknown error';

  const upload = async e => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!file) return setMsg('Please choose a file first');

    setBusy(true);
    setMsg('Uploading your report...');

    // Step 1: upload the file
    let record;
    try {
      const fd = new FormData();
      fd.append('profileId', id);
      fd.append('type', form.type);
      fd.append('title', form.title);
      fd.append('doctor', form.doctor);
      if (form.date) fd.append('date', form.date);
      fd.append('file', file);

      const { data } = await api.post('/records', fd);
      record = data;
    } catch (err) {
      console.error('Upload step failed:', err);
      setMsg(`Upload failed: ${reason(err)}`);
      setBusy(false);
      return;
    }

    // Step 2: read the values from the file
    try {
      setMsg('File uploaded. Reading values (images can take a few seconds)...');
      const res = await api.post(`/records/${record._id}/extract`);
      setMsg(`Done: ${res.data.measurements.length} values found. Please check them below.`);
    } catch (err) {
      console.error('Extract step failed:', err);
      setMsg(`File uploaded, but reading values failed: ${reason(err)}`);
    }

    setFile(null);
    setForm(emptyForm);
    formEl.reset();
    await load().catch(console.error);
    setBusy(false);
  };

  const openFile = async rec => {
    try {
      const { data } = await api.get(`/records/${rec._id}/file`, { responseType: 'blob' });
      window.open(URL.createObjectURL(data), '_blank');
    } catch (err) {
      setMsg(`Could not open file: ${reason(err)}`);
    }
  };

  const removeRecord = async rec => {
    if (!window.confirm('Delete this report and its values?')) return;
    await api.delete(`/records/${rec._id}`);
    load();
  };

  const editValue = async m => {
    const v = window.prompt(`Correct value for ${m.testName}`, m.value);
    if (v === null || v.trim() === '' || isNaN(Number(v))) return;
    await api.put(`/measurements/${m._id}`, { value: Number(v) });
    load();
  };

  const removeMeasurement = async m => {
    await api.delete(`/measurements/${m._id}`);
    load();
  };

  const fmtDate = d => new Date(d).toLocaleDateString();

  return (
    <div className="card wide">
      <Link to="/">&larr; Back</Link>
      <h1>{profile ? profile.name : 'Profile'}</h1>
      {profile && <p className="muted">{profile.relation}</p>}

      <h2>Upload a report</h2>
      <form onSubmit={upload}>
        <div className="row">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="lab_report">Lab report</option>
            <option value="prescription">Prescription</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Title (e.g. Blood test)" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Doctor" value={form.doctor}
            onChange={e => setForm({ ...form, doctor: e.target.value })} />
          <input type="date" value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
        <button type="submit" disabled={busy}>{busy ? 'Working...' : 'Upload and read'}</button>
        {msg && <p className="muted">{msg}</p>}
      </form>

      <h2>Reports</h2>
      <ul>
        {records.map(r => (
          <li key={r._id} className="record">
            <span>
              <strong>{r.title || r.originalName}</strong>{' '}
              <span className="muted">{fmtDate(r.date)}{r.doctor ? ` · ${r.doctor}` : ''}</span>
            </span>
            <span>
              <button className="secondary" onClick={() => openFile(r)}>View</button>{' '}
              <button className="secondary" onClick={() => removeRecord(r)}>Delete</button>
            </span>
          </li>
        ))}
        {records.length === 0 && <li className="muted">No reports yet</li>}
      </ul>

      <h2>Summary</h2>
      <Summary profileId={id} refreshKey={measurements} />

      <h2>Trends</h2>
      <TrendChart measurements={measurements} />

      <h2>Share with your doctor</h2>
      <ShareLink profileId={id} />

      <h2>Extracted values</h2>
      <p className="muted">Check these against your report. Click Edit to fix a wrong value.</p>
      <div className="scroll">
        <table>
          <thead>
            <tr><th>Date</th><th>Test</th><th>Value</th><th>Range</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {measurements.map(m => (
              <tr key={m._id}>
                <td>{fmtDate(m.date)}</td>
                <td>{m.testName}</td>
                <td>{m.value} <span className="muted">{m.unit}</span></td>
                <td>{m.refLow} - {m.refHigh}</td>
                <td><span className={`badge ${m.status}`}>{m.status}</span></td>
                <td>
                  <button className="secondary" onClick={() => editValue(m)}>Edit</button>{' '}
                  <button className="secondary" onClick={() => removeMeasurement(m)}>x</button>
                </td>
              </tr>
            ))}
            {measurements.length === 0 && (
              <tr><td colSpan="6" className="muted">No values yet. Upload a lab report above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}