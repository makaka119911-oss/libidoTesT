function sanitize(v, max = 500) {
  return String(v ?? '')
    .trim()
    .slice(0, max)
    .replace(/[*_[\]`]/g, '');
}

function formatResults(payload) {
  const data = payload.answers || {};
  const result = payload.result || {};
  const type = payload.test_type || data.test_type;

  let message = '📊 НОВЫЙ РЕЗУЛЬТАТ ТЕСТА 📊\n\n';
  message += `🔍 Тип теста: ${type === 'regular' ? 'Обычный' : 'Менопауза'}\n`;
  message += `📈 Результат: ${sanitize(result.level, 120)}\n`;
  message += `⭐ Баллы: ${result.score ?? '—'}\n\n`;

  const line = (label, val) => `   └ ${label}: ${sanitize(val || 'Не указано', 200)}\n`;

  if (type === 'regular') {
    message += '📅 Ответы по периодам:\n';
    const periods = [
      { name: 'От конца месячных до овуляции', prefix: 'period1' },
      { name: 'В период овуляции', prefix: 'period2' },
      { name: 'От конца овуляции до начала месячных', prefix: 'period3' },
      { name: 'В период месячных', prefix: 'period4' },
    ];
    for (const p of periods) {
      message += `\n${p.name}:\n`;
      message += line('Частота', data[`${p.prefix}_frequency`]);
      message += line('Сила желания', data[`${p.prefix}_strength`]);
      message += line('Эрегир. (да)', data[`${p.prefix}_erected_want`]);
      message += line('Эрегир. (нет)', data[`${p.prefix}_erected_not_want`]);
      message += line('Не эрегир. (да)', data[`${p.prefix}_non_erected_want`]);
      message += line('Не эрегир. (нет)', data[`${p.prefix}_non_erected_not_want`]);
      message += line('Фантазии', data[`${p.prefix}_fantasy`]);
      message += line('Минет', data[`${p.prefix}_oral`]);
    }
  } else {
    message += '🔸 Ответы для менопаузы:\n';
    message += line('Частота', data.menopause_frequency);
    message += line('Сила желания', data.menopause_strength);
    message += line('Эрегир. (да)', data.menopause_erected_want);
    message += line('Эрегир. (нет)', data.menopause_erected_not_want);
    message += line('Не эрегир. (да)', data.menopause_non_erected_want);
    message += line('Не эрегир. (нет)', data.menopause_non_erected_not_want);
    message += line('Фантазии', data.menopause_fantasy);
    message += line('Минет', data.menopause_oral);
  }

  message += `\n🍂 Сезонная зависимость: ${sanitize(data.season_dependency || 'Не указано', 20)}\n`;
  if (data.season_description) {
    message += `   └ Описание: ${sanitize(data.season_description, 500)}\n`;
  }

  message += `\n⏰ Дата заполнения: ${new Date(payload.date || Date.now()).toLocaleString('ru-RU')}`;
  return message.slice(0, 4000);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не настроены' });
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const text = formatResults(payload);

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      return res.status(502).json({ ok: false, error: tgData.description || 'Telegram API error' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
};
