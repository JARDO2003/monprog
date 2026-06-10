const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
const PROJECT_ID = 'database-5583e';
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// In-memory subscriber store: { token, label, subscribedAt }
let subscribers = [];

// Get OAuth2 access token from service account
async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// Save subscriber token
app.post('/subscribe', (req, res) => {
  const { token, label } = req.body;
  if (!token) return res.status(400).json({ error: 'Token manquant' });

  const existing = subscribers.find(s => s.token === token);
  if (!existing) {
    subscribers.push({ token, label: label || 'Abonné', subscribedAt: new Date().toISOString() });
  } else {
    existing.label = label || existing.label;
  }
  res.json({ success: true, count: subscribers.length });
});

// Remove subscriber
app.post('/unsubscribe', (req, res) => {
  const { token } = req.body;
  subscribers = subscribers.filter(s => s.token !== token);
  res.json({ success: true, count: subscribers.length });
});

// List subscribers (for provider UI)
app.get('/subscribers', (req, res) => {
  res.json(subscribers.map(({ token: t, label, subscribedAt }) => ({
    token: t.substring(0, 20) + '…',
    fullToken: t,
    label,
    subscribedAt,
  })));
});

// Send notification to ALL subscribers
app.post('/send-all', async (req, res) => {
  const { title, body, icon } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Titre et corps requis' });
  if (subscribers.length === 0) return res.status(400).json({ error: 'Aucun abonné' });

  try {
    const accessToken = await getAccessToken();
    const results = await Promise.allSettled(
      subscribers.map(sub => sendFCM(accessToken, sub.token, title, body, icon))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    res.json({ success: true, sent: success, failed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send notification to ONE subscriber
app.post('/send-one', async (req, res) => {
  const { token, title, body, icon } = req.body;
  if (!token || !title || !body) return res.status(400).json({ error: 'Token, titre et corps requis' });

  try {
    const accessToken = await getAccessToken();
    await sendFCM(accessToken, token, title, body, icon);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function sendFCM(accessToken, token, title, body, icon) {
  const response = await fetch(FCM_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        webpush: {
          notification: {
            title,
            body,
            icon: icon || '/icon.png',
            badge: '/icon.png',
            requireInteraction: true,
          },
          fcm_options: { link: '/' }
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'FCM error');
  }
  return response.json();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`   → Page Client   : http://localhost:${PORT}/index.html`);
  console.log(`   → Page Fournisseur: http://localhost:${PORT}/provider.html`);
});