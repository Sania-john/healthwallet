const NAMES = {
  ta: {
    'Hemoglobin': 'ஹீமோகுளோபின்', 'RBC Count': 'சிவப்பணு எண்ணிக்கை',
    'Hematocrit': 'ஹீமாடோகிரிட்', 'WBC Count': 'வெள்ளையணு எண்ணிக்கை',
    'Neutrophils': 'நியூட்ரோபில்கள்', 'Lymphocytes': 'லிம்போசைட்டுகள்',
    'Eosinophils': 'ஈசினோபில்கள்', 'Monocytes': 'மோனோசைட்டுகள்',
    'Basophils': 'பேசோபில்கள்', 'Platelet Count': 'தட்டணு எண்ணிக்கை',
    'Fasting Blood Sugar': 'உண்ணாவிரத இரத்த சர்க்கரை',
    'Total Cholesterol': 'மொத்த கொலஸ்ட்ரால்',
    'LDL Cholesterol': 'எல்டிஎல் கொலஸ்ட்ரால்', 'HDL Cholesterol': 'எச்டிஎல் கொலஸ்ட்ரால்',
    'Triglycerides': 'ட்ரைகிளிசரைடுகள்', 'Creatinine': 'கிரியேட்டினின்'
  },
  hi: {
    'Hemoglobin': 'हीमोग्लोबिन', 'RBC Count': 'लाल रक्त कोशिका (RBC) गिनती',
    'Hematocrit': 'हेमेटोक्रिट', 'WBC Count': 'श्वेत रक्त कोशिका (WBC) गिनती',
    'Neutrophils': 'न्यूट्रोफिल', 'Lymphocytes': 'लिम्फोसाइट',
    'Eosinophils': 'ईओसिनोफिल', 'Monocytes': 'मोनोसाइट',
    'Basophils': 'बेसोफिल', 'Platelet Count': 'प्लेटलेट गिनती',
    'Fasting Blood Sugar': 'खाली पेट ब्लड शुगर',
    'Total Cholesterol': 'कुल कोलेस्ट्रॉल',
    'LDL Cholesterol': 'एलडीएल कोलेस्ट्रॉल', 'HDL Cholesterol': 'एचडीएल कोलेस्ट्रॉल',
    'Triglycerides': 'ट्राइग्लिसराइड', 'Creatinine': 'क्रिएटिनिन'
  }
};

const TEXT = {
  en: {
    normal: (t, v, u, lo, hi) => `${t}: ${v} ${u}. This is within the normal range (${lo} - ${hi}).`,
    high:   (t, v, u, lo, hi) => `${t}: ${v} ${u}. This is higher than the normal range (${lo} - ${hi}).`,
    low:    (t, v, u, lo, hi) => `${t}: ${v} ${u}. This is lower than the normal range (${lo} - ${hi}).`,
    allGood: 'All values are within the normal range.',
    some: (n, total) => `${n} of ${total} values are outside the normal range.`,
    advice: 'Please discuss the highlighted values with your doctor.',
    empty: 'No values yet. Upload a lab report to see a summary.',
    disclaimer: 'This is general information, not a diagnosis. Always consult a doctor.'
  },
  ta: {
    normal: (t, v, u, lo, hi) => `${t}: ${v} ${u}. இது இயல்பான வரம்பிற்குள் உள்ளது (${lo} - ${hi}).`,
    high:   (t, v, u, lo, hi) => `${t}: ${v} ${u}. இது இயல்பான வரம்பை விட அதிகமாக உள்ளது (${lo} - ${hi}).`,
    low:    (t, v, u, lo, hi) => `${t}: ${v} ${u}. இது இயல்பான வரம்பை விட குறைவாக உள்ளது (${lo} - ${hi}).`,
    allGood: 'அனைத்து மதிப்புகளும் இயல்பான வரம்பிற்குள் உள்ளன.',
    some: (n, total) => `${total} மதிப்புகளில் ${n} இயல்பான வரம்பிற்கு வெளியே உள்ளன.`,
    advice: 'குறிக்கப்பட்ட மதிப்புகள் குறித்து உங்கள் மருத்துவரிடம் ஆலோசிக்கவும்.',
    empty: 'இன்னும் மதிப்புகள் இல்லை. சுருக்கத்தைப் பார்க்க ஆய்வக அறிக்கையைப் பதிவேற்றவும்.',
    disclaimer: 'இது பொதுவான தகவல் மட்டுமே, நோய் கண்டறிதல் அல்ல. எப்போதும் மருத்துவரை அணுகவும்.'
  },
  hi: {
    normal: (t, v, u, lo, hi) => `${t}: ${v} ${u}। यह सामान्य सीमा के भीतर है (${lo} - ${hi})।`,
    high:   (t, v, u, lo, hi) => `${t}: ${v} ${u}। यह सामान्य सीमा से अधिक है (${lo} - ${hi})।`,
    low:    (t, v, u, lo, hi) => `${t}: ${v} ${u}। यह सामान्य सीमा से कम है (${lo} - ${hi})।`,
    allGood: 'सभी मान सामान्य सीमा के भीतर हैं।',
    some: (n, total) => `${total} में से ${n} मान सामान्य सीमा से बाहर हैं।`,
    advice: 'कृपया चिह्नित मानों के बारे में अपने डॉक्टर से सलाह लें।',
    empty: 'अभी कोई मान नहीं है। सारांश देखने के लिए लैब रिपोर्ट अपलोड करें।',
    disclaimer: 'यह सामान्य जानकारी है, निदान नहीं। हमेशा डॉक्टर से परामर्श करें।'
  }
};

function buildSummary(measurements, lang) {
  const L = TEXT[lang] ? lang : 'en';
  const T = TEXT[L];

  // keep only the latest value per test
  const latest = new Map();
  [...measurements]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(m => latest.set(m.testName, m));
  const items = [...latest.values()];

  if (items.length === 0) {
    return { lang: L, overall: T.empty, items: [], advice: '', disclaimer: T.disclaimer };
  }

  const lines = items.map(m => ({
    testName: m.testName,
    status: m.status,
    text: T[m.status](NAMES[L]?.[m.testName] || m.testName, m.value, m.unit, m.refLow, m.refHigh)
  }));

  const abnormal = lines.filter(l => l.status !== 'normal').length;
  return {
    lang: L,
    overall: abnormal === 0 ? T.allGood : T.some(abnormal, lines.length),
    items: lines,
    advice: abnormal === 0 ? '' : T.advice,
    disclaimer: T.disclaimer
  };
}

module.exports = { buildSummary };