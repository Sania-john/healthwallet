import { useState } from 'react';
import axios from 'axios';

export default function DoctorNoteForm({ token, onSaved }) {
  const [doctorName, setDoctorName] = useState('');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post(`http://localhost:5000/api/share/public/${token}/notes`,
        { doctorName, note, followUpDate });
      setNote(''); setFollowUpDate('');
      setMsg('Note sent to the patient.');
      onSaved && onSaved();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not save the note');
    }
  };

  return (
    <form onSubmit={submit}>
      <input placeholder="Doctor name" value={doctorName} onChange={e => setDoctorName(e.target.value)} />
      <textarea placeholder="Advice / follow-up note" rows={3} maxLength={1000}
        value={note} onChange={e => setNote(e.target.value)} required
        style={{ padding: 10, border: '1px solid #ccd5e0', borderRadius: 8 }} />
      <label className="muted">Follow-up date (optional)</label>
      <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
      <button type="submit">Send note</button>
      {msg && <p className="muted">{msg}</p>}
    </form>
  );
}