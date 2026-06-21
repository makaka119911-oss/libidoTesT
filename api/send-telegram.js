function sanitize(v, max = 500) {
  return String(v ?? '')
    .trim()
    .slice(0, max)
    .replace(/[*_[\]`]/g, '');
}

const SEASON_LABEL =
  'Зависит ли Ваше либидо от времени года, если да, то опишите как оно меняется';

function line(label, val) {
  return `   └ ${label}: ${sanitize(val || 'Не указано', 300)}\n`;
}

function formatResults(payload) {
  const data = payload.answers || {};
  const type = payload.test_type || data.test_type;

  let message = '📋 ТЕСТ АНКЕТА НА ЖЕНСКОЕ ЛИБИДО\n\n';
  message += `🔍 Бланк: ${type === 'regular' ? 'Обычный цикл' : 'Менопауза'}\n`;
  if (data.age) message += `🎂 Возраст: ${sanitize(data.age, 10)}\n`;
  message += '\n';

  const periods = [
    { name: 'Период-1: От конца месячных до овуляции', prefix: 'period1' },
    { name: 'Период-2: В период овуляции', prefix: 'period2' },
    { name: 'Период-3: От конца овуляции до начала месячных', prefix: 'period3' },
    { name: 'Период-4: В период месячных', prefix: 'period4' },
  ];

  const block = (prefix) => {
    let s = '';
    s += line('Как часто хочется секса', data[`${prefix}_frequency`]);
    s += line('Сила желания', data[`${prefix}_strength`]);
    s += line('Эрегир. (хочется)', data[`${prefix}_erected_want`]);
    s += line('Эрегир. (не хочется)', data[`${prefix}_erected_not_want`]);
    s += line('Не эрегир. (хочется)', data[`${prefix}_non_erected_want`]);
    s += line('Не эрегир. (не хочется)', data[`${prefix}_non_erected_not_want`]);
    s += line('Фантазии', data[`${prefix}_fantasy`]);
    s += line('Минет', data[`${prefix}_oral`]);
    return s;
  };

  if (type === 'regular') {
    for (const p of periods) {
      message += `\n${p.name}:\n${block(p.prefix)}`;
    }
  } else {
    message += 'Менопауза:\n';
    message += line('Как часто хочется секса', data.menopause_frequency);
    message += line('Сила желания', data.menopause_strength);
    message += line('Эрегир. (хочется)', data.menopause_erected_want);
    message += line('Эрегир. (не хочется)', data.menopause_erected_not_want);
    message += line('Не эрегир. (хочется)', data.menopause_non_erected_want);
    message += line('Не эрегир. (не хочется)', data.menopause_non_erected_not_want);
    message += line('Фантазии', data.menopause_fantasy);
    message += line('Минет', data.menopause_oral);
  }

  message += `\n🍂 ${SEASON_LABEL}\n`;
  message += line('Ответ', data.season_dependency);
  if (data.season_description) message += line('Описание', data.season_description);

  message += `\n⏰ ${new Date(payload.date || Date.now()).toLocaleString('ru-RU')}`;
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
