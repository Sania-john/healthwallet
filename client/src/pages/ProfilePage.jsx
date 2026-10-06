import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import TrendChart from '../components/TrendChart.jsx';

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
    const [p, r, m] = await Promise.all([
      api.get('/profiles'),
      api.get('/records', { params: { profileId: id } }),
      api.get('/measurements', { params: { profileId: id } })
    ]);
    setProfile(p.data.find(x => x._id === id));
    setRecords(r.data);
    setMeasurements(m.data);
  };

  useEffect(() => { load().catch(console.error); }, [id]);

  const upload = async e => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!file) return setMsg('Please choose a file first');

    setBusy(true);
    setMsg('Uploading and reading your report... (images can take a few seconds)');
    try {
      const fd = new FormData();
      fd.append('profileId', id);
      fd.append('type', form.type);
      fd.append('title', form.title);
      fd.append('doctor', form.doctor);
      if (form.date) fd.append('date', form.date);
      fd.append('file', file);

      const { data } = await api.post('/records', fd);
      const res = await api.post(`/records/${data._id}/extract`);

      setMsg(`Done: ${res.data.measurements.length} values found. Please check them below.`);
      setFile(null);
      setForm(emptyForm);
      formEl.reset();
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const openFile = async rec => {
    const { data } = await api.get(`/records/${rec._id}/file`, { responseType: 'blob' });
    window.open(URL.createObjectURL(data), '_blank');
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

      <h2>Trends</h2>
      <TrendChart measurements={measurements} />

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