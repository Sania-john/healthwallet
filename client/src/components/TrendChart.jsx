import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceArea, ResponsiveContainer
} from 'recharts';

export default function TrendChart({ measurements }) {
  const tests = useMemo(() => [...new Set(measurements.map(m => m.testName))], [measurements]);
  const [selected, setSelected] = useState('');
  const current = tests.includes(selected) ? selected : tests[0];

  if (!current) return <p className="muted">Upload a report to see trends.</p>;

  const points = measurements
    .filter(m => m.testName === current)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => ({
      date: new Date(m.date).toLocaleDateString(),
      value: m.value,
      unit: m.unit,
      refLow: m.refLow,
      refHigh: m.refHigh
    }));

  const last = points[points.length - 1];

  return (
    <div>
      <select value={current} onChange={e => setSelected(e.target.value)} style={{ maxWidth: 260 }}>
        {tests.map(t => <option key={t}>{t}</option>)}
      </select>
      <p className="muted">
        Normal range: {last.refLow} - {last.refHigh} {last.unit} (green band)
      </p>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={points} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[
              dataMin => Math.min(dataMin, last.refLow),
              dataMax => Math.max(dataMax, last.refHigh)
            ]} />
            <Tooltip />
            <ReferenceArea y1={last.refLow} y2={last.refHigh} fill="#1e7b45" fillOpacity={0.12} />
            <Line type="monotone" dataKey="value" stroke="#0b5cab" strokeWidth={2} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}