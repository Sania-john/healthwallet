const RANGE_RE = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/;
const NUM_LINE = /^\d+(?:\.\d+)?$/;
const INLINE_NUM = /(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/;

// low/high are fallbacks, used only when the report prints no range
const TESTS = [
  { name: 'Hemoglobin', unit: 'g/dL', low: 12, high: 17.5,
    patterns: ['(?<!corpuscular )(?<!glycosylated )(?<!glycated )\\bh(?:a)?emoglobin(?!\\s*a1c)', '^hb(?!a1c)'] },
  { name: 'RBC Count', unit: 'million/cmm', low: 4.2, high: 5.9,
    patterns: ['^(?:total )?rbc count'] },
  { name: 'Hematocrit', unit: '%', low: 36, high: 50,
    patterns: ['^h(?:a)?ematocrit', '^pcv'] },
  { name: 'MCV', unit: 'fL', low: 80, high: 100, patterns: ['^mcv'] },
  { name: 'MCH', unit: 'pg', low: 27, high: 33, patterns: ['^mch(?!c)'] },
  { name: 'MCHC', unit: 'g/dL', low: 32, high: 36, patterns: ['^mchc'] },
  { name: 'RDW', unit: '%', low: 11.5, high: 14.5, patterns: ['^rdw'] },
  { name: 'WBC Count', unit: '/cmm', low: 4000, high: 11000,
    patterns: ['^(?:total )?wbc count', '^total leu[ck]ocyte count', '^tlc'] },
  { name: 'Neutrophils', unit: '%', low: 40, high: 80, patterns: ['^neutrophils'] },
  { name: 'Lymphocytes', unit: '%', low: 20, high: 40, patterns: ['^lymphocytes'] },
  { name: 'Eosinophils', unit: '%', low: 1, high: 6, patterns: ['^eosinophils'] },
  { name: 'Monocytes', unit: '%', low: 2, high: 10, patterns: ['^monocytes'] },
  { name: 'Basophils', unit: '%', low: 0, high: 2, patterns: ['^basophils'] },
  { name: 'Platelet Count', unit: '/cmm', low: 150000, high: 410000,
    patterns: ['^platelet count'] },
  { name: 'MPV', unit: 'fL', low: 7.5, high: 10.3, patterns: ['^mpv'] },
  { name: 'ESR', unit: 'mm/1hr', low: 0, high: 14, patterns: ['^esr'] },
  { name: 'HbA1c', unit: '%', low: 4, high: 5.6,
    patterns: ['hba1c', 'glyc(?:o|a)sylated h(?:a)?emoglobin', 'glycated h(?:a)?emoglobin'] },
  { name: 'Fasting Blood Sugar', unit: 'mg/dL', low: 70, high: 100,
    patterns: ['fasting (?:blood )?(?:sugar|glucose|plasma glucose)', 'glucose,? ?\\(?fasting', '^fbs'] },
  { name: 'Total Cholesterol', unit: 'mg/dL', low: 0, high: 200,
    patterns: ['total cholesterol'] },
  { name: 'LDL Cholesterol', unit: 'mg/dL', low: 0, high: 100, patterns: ['\\bldl'] },
  { name: 'HDL Cholesterol', unit: 'mg/dL', low: 40, high: 100,
    patterns: ['(?<!non[- ])\\bhdl'] },
  { name: 'Triglycerides', unit: 'mg/dL', low: 0, high: 150, patterns: ['\\btriglycerides?'] },
  { name: 'Creatinine', unit: 'mg/dL', low: 0.6, high: 1.3, patterns: ['\\bcreatinine'] },
  { name: 'TSH', unit: 'mIU/L', low: 0.4, high: 4.0,
    patterns: ['^tsh', 'thyroid stimulating hormone'] }
];

function computeStatus(value, low, high) {
  if (low != null && value < low) return 'low';
  if (high != null && value > high) return 'high';
  return 'normal';
}

// Finds the value (and the report's own range) for a test name found on line i
function readValue(lines, i, matchEnd) {
  const first = lines[i].slice(matchEnd);
  const last = lines.length - 1;

  // look for the printed range on this line or the next 3
  for (let j = i; j <= Math.min(i + 3, last); j++) {
    const text = j === i ? first : lines[j];
    const rm = text.match(RANGE_RE);
    if (!rm) continue;
    const ref = { refLow: parseFloat(rm[1]), refHigh: parseFloat(rm[2]) };

    // layout A: value sits before the range on the same line
    if (j === i) {
      const inline = text.slice(0, rm.index).match(INLINE_NUM);
      if (inline) return { value: parseFloat(inline[1]), ...ref };
    }
    // layout B: value on its own line after the range (and method line)
    for (let k = j + 1; k <= Math.min(j + 4, last); k++) {
      if (NUM_LINE.test(lines[k])) return { value: parseFloat(lines[k]), ...ref };
    }
    // layout C: value after the range on the same line
    const tail = text.slice(rm.index + rm[0].length).match(INLINE_NUM);
    if (tail) return { value: parseFloat(tail[1]), ...ref };
    return null;
  }

  // no range printed: first standalone number after the name
  const m = first.match(INLINE_NUM);
  return m ? { value: parseFloat(m[1]) } : null;
}

function parseMeasurements(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];

  for (const t of TESTS) {
    const regexes = t.patterns.map(p => new RegExp(p, 'i'));
    let found = null;

    for (let i = 0; i < lines.length && !found; i++) {
      for (const re of regexes) {
        const m = lines[i].match(re);
        if (!m) continue;
        const r = readValue(lines, i, m.index + m[0].length);
        if (r) { found = r; break; }
      }
    }

    if (found) {
      const refLow = found.refLow ?? t.low;
      const refHigh = found.refHigh ?? t.high;
      results.push({
        testName: t.name,
        value: found.value,
        unit: t.unit,
        refLow,
        refHigh,
        status: computeStatus(found.value, refLow, refHigh)
      });
    }
  }
  return results;
}

module.exports = { parseMeasurements, computeStatus };