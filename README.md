# Анкета женского либидо

Мобильная анкета как на бумажном бланке Татьяны Солнечной: галочки напротив ответов, два типа (регулярный цикл / менопауза), PDF и Telegram.

Стиль — бренд «Женский мир» + тетрадь в клетку: bordeaux `#6b4d57`, gold `#b8936a`, rose `#d8b4a8`, фон `#f2efea`; шрифты Cormorant Garamond + Manrope.

## Прод (VDS «Женский мир»)

Основной URL: https://zhenskiy-mir.139-100-237-242.sslip.io/anketa/

Статика и API на платформе `zhenskiy-mir` (`web/public/anketa` + `POST /api/anketa/submit`). Результаты → Postgres `form_responses` + Telegram. Кабинет инвестора: блок «Анкета либидо».

## Деплой (legacy Vercel — не основной)

1. Репо: `makaka119911-oss/libidoTesT`
2. Vercel → Import → Root: этот каталог
3. Environment Variables: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
4. Deploy

Локально UI: `npx serve .`  
Telegram API: `node scripts/dev.mjs` или `npx vercel dev` (нужны переменные в `.env.local`).

## Поток

1. Шаг **age** — подтверждение 18+
2. Выбор анкеты: **обычный цикл** или **менопауза**
3. Галочки как на листке (не менять)
4. Сезонная зависимость
5. Результат + согласие 152-ФЗ (+ контакт по желанию) → «Отправить» / PDF
6. Политика: `privacy.html`

## Файлы

- `assets/js/data.js` — вопросы и подсчёт баллов (SCORE не менять)
- `assets/js/app.js` — интерфейс (`POST /api/anketa/submit` на проде ЖМ)
- `api/send-telegram.js` — legacy Vercel handler
