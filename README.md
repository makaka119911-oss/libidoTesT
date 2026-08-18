# Анкета женского либидо

Мобильная анкета как на бумажном бланке Татьяны Солнечной: галочки напротив ответов, два типа (регулярный цикл / менопауза), PDF и Telegram.

Стиль — бренд «Женский мир»: bordeaux `#5c4a63`, gold `#a0896e`, rose `#e8e1e9`, фон `#f2efea`; шрифты Cormorant Garamond + Manrope.

## Деплой (Vercel)

1. Репо: `makaka119911-oss/libidoTesT`
2. Vercel → Import → Root: этот каталог
3. Environment Variables:
   - `TELEGRAM_BOT_TOKEN` — от @BotFather
   - `TELEGRAM_CHAT_ID` — chat id группы/канала
4. Deploy

Локально UI: `npx serve .`  
Telegram API: `node scripts/dev.mjs` или `npx vercel dev` (нужны переменные в `.env.local`).

## Поток

1. Подтверждение 18+
2. Выбор анкеты: **обычный цикл** или **менопауза**
3. Галочки как на листке (не менять)
4. Сезонная зависимость
5. Результат → Telegram + PDF + ссылка на платформу «Женский мир»

## Файлы

- `assets/js/data.js` — вопросы и подсчёт баллов (SCORE не менять)
- `assets/js/app.js` — интерфейс
- `api/send-telegram.js` — результаты в Telegram
