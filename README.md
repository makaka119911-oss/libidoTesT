# Анкета женского либидо

Мобильная анкета как на бумажном бланке Татьяны Солнечной: галочки напротив ответов, два типа (регулярный цикл / менопауза), PDF и Telegram.

## Деплой (Vercel)

1. Репо: `makaka119911-oss/libidoTesT`
2. Vercel → Import → Root: этот каталог
3. Environment Variables:
   - `TELEGRAM_BOT_TOKEN` — от @BotFather
   - `TELEGRAM_CHAT_ID` — chat id группы/канала
4. Deploy

Локально UI: `npx serve .`  
Telegram API: `npx vercel dev` (нужны переменные в `.env.local`).

## Поток

1. Выбор анкеты: **обычный цикл** или **менопауза**
2. Галочки как на листке
3. Сезонная зависимость
4. Результат → Telegram + PDF

## Файлы

- `assets/js/data.js` — вопросы и подсчёт баллов
- `assets/js/app.js` — интерфейс
- `api/send-telegram.js` — регистрация и результаты в Telegram
