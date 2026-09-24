export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_IDS = process.env.TELEGRAM_CHAT_IDS;
  if (!BOT_TOKEN || !CHAT_IDS) return res.status(500).json({ error: 'Not configured' });

  const { name, phone } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Missing name or phone' });

  const escapeHtml = (str) =>
    String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const text = [
    '📩 <b>Нова заявка · УКРМЕХІНВЕСТ</b>',
    '',
    `👤 Ім'я: ${escapeHtml(name)}`,
    `📞 Телефон: ${escapeHtml(phone)}`,
  ].join('\n');

  const chatIds = CHAT_IDS.split(',').map((id) => id.trim()).filter(Boolean);

  const results = await Promise.all(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      })
        .then((r) => r.json())
        .catch(() => ({ ok: false }))
    )
  );

  const allOk = results.every((r) => r.ok);
  return res.status(allOk ? 200 : 502).json({ ok: allOk });
}
