const TG_LIMIT = 4096;

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clean(v, max = 1200) {
  return String(v ?? '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

function line(label, val) {
  return `   └ ${escapeHtml(label)}: ${escapeHtml(clean(val || 'Не указано', 400))}\n`;
}

function chunkText(text, max = 4000) {
  if (text.length <= max) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < Math.floor(max * 0.5)) cut = max;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n+/, '');
  }
  if (rest) parts.push(rest);
  return parts;
}

function formatResults(payload) {
  const data = payload.answers || {};
  const result = payload.result || {};
  const type = payload.test_type || data.test_type;
  const maxScore = result.maxScore || (type === 'menopause' ? 35 : 140);
  const typeLabel = type === 'regular' ? 'Обычный' : 'Менопауза';

  let message = '📊 НОВЫЙ РЕЗУЛЬТАТ ТЕСТА 📊\n\n';
  message += `🔍 Тип теста: ${escapeHtml(typeLabel)}\n`;
  message += `📈 Уровень: ${escapeHtml(clean(result.level, 160))}\n`;
  message += `⭐ Суммарный балл: <b>${escapeHtml(String(result.score ?? '—'))} из ${escapeHtml(String(maxScore))}</b>\n`;
  if (result.desc) {
    message += `📝 ${escapeHtml(clean(result.desc, 600))}\n`;
  }
  if (result.advice) {
    message += `💡 ${escapeHtml(clean(result.advice, 500))}\n`;
  }
  message += '\n';

  if (type === 'regular') {
    message += '📅 Ответы по периодам:\n';
    const periods = [
      { name: 'От конца месячных до овуляции', prefix: 'period1' },
      { name: 'В период овуляции', prefix: 'period2' },
      { name: 'От конца овуляции до начала месячных', prefix: 'period3' },
      { name: 'В период месячных', prefix: 'period4' },
    ];
    for (const p of periods) {
      message += `\n${escapeHtml(p.name)}:\n`;
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

  message += `\n🍂 Сезонная зависимость: ${escapeHtml(clean(data.season_dependency || 'Не указано', 40))}\n`;
  if (data.season_description) {
    message += `   └ Описание: ${escapeHtml(clean(data.season_description, 1000))}\n`;
  }

  const consent = payload.consent || {};
  const contact = payload.contact || {};
  message += `\n📋 Согласие 152-ФЗ: ${consent.personal_data ? 'да' : 'нет'}\n`;
  if (consent.contact_allowed || contact.name || contact.phone || contact.email) {
    message += `📞 Контакт (по желанию):\n`;
    message += line('Связь разрешена', consent.contact_allowed ? 'да' : 'нет');
    if (contact.name) message += line('Имя', contact.name);
    if (contact.phone) message += line('Телефон', contact.phone);
    if (contact.email) message += line('Почта', contact.email);
  }

  message += `\n⏰ Дата заполнения: ${escapeHtml(new Date(payload.date || Date.now()).toLocaleString('ru-RU'))}`;
  return chunkText(message, TG_LIMIT - 80);
}

async function sendTelegramText(token, chatId, text) {
  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  const tgData = await tgRes.json();
  return { ok: tgRes.ok && tgData.ok, description: tgData.description, tgData };
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

  const parts = formatResults(payload);

  try {
    for (const text of parts) {
      let sent = await sendTelegramText(token, chatId, text);
      if (!sent.ok && sent.description && /parse/i.test(sent.description)) {
        const plain = text.replace(/<\/?b>/g, '');
        sent = await sendTelegramTextPlain(token, chatId, plain);
      }
      if (!sent.ok) {
        return res.status(502).json({ ok: false, error: sent.description || 'Telegram API error' });
      }
    }
    return res.status(200).json({ ok: true, parts: parts.length });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
};

async function sendTelegramTextPlain(token, chatId, text) {
  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  const tgData = await tgRes.json();
  return { ok: tgRes.ok && tgData.ok, description: tgData.description };
}
