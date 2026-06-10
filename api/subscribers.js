const { db } = require('./_firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const snap = await db.collection('subscribers').orderBy('subscribedAt', 'desc').get();
    const list = snap.docs.map(doc => {
      const d = doc.data();
      return { fullToken: d.token, token: d.token.substring(0, 20) + '…', label: d.label, subscribedAt: d.subscribedAt };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
