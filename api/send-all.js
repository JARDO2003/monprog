const { db } = require('./_firebase');
const { sendFCM } = require('./_fcm');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Titre et corps requis' });
    const snap = await db.collection('subscribers').get();
    if (snap.empty) return res.status(400).json({ error: 'Aucun abonné' });
    const results = await Promise.allSettled(snap.docs.map(doc => sendFCM(doc.data().token, title, body)));
    res.json({ success: true, sent: results.filter(r => r.status === 'fulfilled').length, failed: results.filter(r => r.status === 'rejected').length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
