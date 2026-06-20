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

1. Регистрация (фамилия, имя, возраст, телефон, telegram, фото)
2. Тип: регулярный цикл (4 периода) или менопауза
3. Галочки как на листке — все вопросы блоком на экране
4. Сезонная зависимость
5. Результат → автоотправка в Telegram + PDF

## Файлы

- `assets/js/data.js` — вопросы и подсчёт баллов
- `assets/js/app.js` — интерфейс
- `api/send-telegram.js` — регистрация и результаты в Telegram
