const { sendFCM } = require('./_fcm');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token, title, body } = req.body;
    if (!token || !title || !body) return res.status(400).json({ error: 'Token, titre et corps requis' });
    await sendFCM(token, title, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
