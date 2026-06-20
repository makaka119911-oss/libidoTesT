function sanitize(v, max = 500) {
  return String(v ?? '')
    .trim()
    .slice(0, max)
    .replace(/[*_[\]`]/g, '');
}

function formatRegistration(payload) {
  const r = payload.registration || {};
  const lines = [
    '🌟 НОВАЯ РЕГИСТРАЦИЯ 🌟',
    '',
    '👤 Контактная информация:',
    `   └ Фамилия: ${sanitize(r.lastName, 80)}`,
    `   └ Имя: ${sanitize(r.firstName, 80)}`,
    `   └ Возраст: ${sanitize(r.age, 10)}`,
    `   └ Телефон: ${sanitize(r.phone, 30)}`,
    `   └ Telegram: ${sanitize(r.telegram, 80)}`,
    `   └ Фото: ${r.photo ? 'Да' : 'Нет'}`,
    '',
    `⏰ Дата регистрации: ${new Date(payload.date || Date.now()).toLocaleString('ru-RU')}`,
  ];
  return lines.join('\n');
}

function formatResults(payload) {
  const r = payload.registration || {};
  const data = payload.answers || {};
  const result = payload.result || {};
  const type = payload.test_type || data.test_type;

  let message = '📊 НОВЫЙ РЕЗУЛЬТАТ ТЕСТА 📊\n\n';
  message += `👤 Пользователь: ${sanitize(r.firstName, 40)} ${sanitize(r.lastName, 40)}\n`;
  message += `📱 Telegram: ${sanitize(r.telegram, 80)}\n`;
  message += `📞 Телефон: ${sanitize(r.phone, 30)}\n\n`;
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

async function sendPhoto(token, chatId, photoDataUrl) {
  if (!photoDataUrl || !photoDataUrl.startsWith('data:image')) return;
  const base64 = photoDataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('photo', new Blob([buffer]), 'photo.jpg');
  form.append('caption', 'Фото клиента');

  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: form,
  });
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

  const isReg = payload.type === 'registration';
  const text = isReg ? formatRegistration(payload) : formatResults(payload);

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

    if (isReg && payload.registration?.photo) {
      try {
        await sendPhoto(token, chatId, payload.registration.photo);
      } catch {
        /* фото необязательно */
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
};
