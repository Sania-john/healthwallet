import { useEffect, useState } from 'react';
import api from '../api';

export default function DoctorNotes({ profileId }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api.get('/share/notes', { params: { profileId } })
      .then(r => setNotes(r.data))
      .catch(console.error);
  }, [profileId]);

  if (notes.length === 0) return <p className="muted">No doctor notes yet.</p>;

  return (
    <div>
      {notes.map(n => (
        <div key={n._id} className="sum">
          <strong>{n.doctorName}</strong> · {new Date(n.createdAt).toLocaleDateString()}<br />
          {n.note}
          {n.followUpDate && <><br /><em>Follow-up: {new Date(n.followUpDate).toLocaleDateString()}</em></>}
        </div>
      ))}
    </div>
  );
}