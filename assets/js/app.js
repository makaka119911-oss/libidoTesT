import {
  PERIODS,
  OPT,
  periodQuestions,
  menopauseQuestions,
  calculateResult,
} from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  step: 'welcome',
  registration: {
    firstName: '',
    lastName: '',
    age: '',
    phone: '',
    telegram: '',
    photo: null,
    photoName: '',
  },
  test_type: null,
  answers: {},
  periodIndex: 0,
  result: null,
  telegramSent: false,
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stepsForType(type) {
  if (type === 'regular') return ['welcome', 'register', 'test_type', 'period', 'season', 'result'];
  return ['welcome', 'register', 'test_type', 'menopause', 'season', 'result'];
}

function progressPct() {
  const steps = stepsForType(state.test_type || 'regular');
  const idx = Math.max(0, steps.indexOf(state.step === 'period' ? 'period' : state.step));
  const periodExtra = state.test_type === 'regular' && state.step === 'period' ? state.periodIndex / 4 : 0;
  const base = idx / (steps.length - 1);
  const periodPart = state.step === 'period' ? periodExtra * (1 / (steps.length - 1)) : 0;
  return Math.min(100, Math.round((base + periodPart) * 100));
}

function renderCheckList(question) {
  const selected = state.answers[question.key];
  return question.options
    .map(
      (opt, i) => `
    <label class="check-row ${selected === opt ? 'check-row--on' : ''}" data-key="${question.key}" data-index="${i}">
      <input type="radio" name="${question.key}" value="${esc(opt)}" ${selected === opt ? 'checked' : ''} hidden>
      <span class="check-box" aria-hidden="true">${selected === opt ? '✓' : ''}</span>
      <span class="check-text">${esc(opt)}</span>
    </label>`
    )
    .join('');
}

function renderQuestionBlock(q) {
  return `
    <div class="question-block" data-qkey="${q.key}">
      <p class="question-label">${esc(q.label)}</p>
      <div class="check-list">${renderCheckList(q)}</div>
    </div>`;
}

function renderProgress() {
  return `<div class="progress" aria-hidden="true"><div class="progress__bar" style="width:${progressPct()}%"></div></div>`;
}

function renderWelcome() {
  return `
    <section class="screen">
      <p class="eyebrow">Татьяна Солнечная</p>
      <h1>Анкета женского либидо</h1>
      <p class="lead">Заполните как на бумажном бланке — ставьте галочки напротив ответов. Удобно с телефона.</p>
      <button type="button" class="btn btn--primary btn--wide" data-action="start">Начать</button>
      <p class="disclaimer">Конфиденциально. Результат отправляется специалисту в Telegram.</p>
    </section>`;
}

function renderRegister() {
  const r = state.registration;
  const photoPreview = r.photo
    ? `<div class="photo-preview"><img src="${r.photo}" alt="Фото"><button type="button" class="photo-remove" data-action="remove-photo">✕</button></div>`
    : '';

  return `
    <section class="screen">
      ${renderProgress()}
      <button type="button" class="back" data-action="back-welcome">← Назад</button>
      <h2>Регистрация</h2>
      <p class="lead">Как на оригинальной анкете — укажите контакты.</p>
      <form class="form" id="regForm">
        <label class="field"><span>Фамилия *</span>
          <input name="lastName" required maxlength="80" value="${esc(r.lastName)}" placeholder="Фамилия"></label>
        <label class="field"><span>Имя *</span>
          <input name="firstName" required maxlength="80" value="${esc(r.firstName)}" placeholder="Имя"></label>
        <label class="field"><span>Возраст *</span>
          <input name="age" type="number" min="18" max="99" required value="${esc(r.age)}" placeholder="Возраст"></label>
        <label class="field"><span>Телефон *</span>
          <input name="phone" type="tel" required maxlength="30" value="${esc(r.phone)}" placeholder="+7..."></label>
        <label class="field"><span>Telegram *</span>
          <input name="telegram" required maxlength="80" value="${esc(r.telegram)}" placeholder="@username"></label>
        <div class="field">
          <span>Фото (рекомендуется)</span>
          <label class="photo-upload">
            <input type="file" id="photoInput" accept="image/*" hidden>
            <span class="photo-upload__btn">📷 Выбрать фото</span>
          </label>
          ${photoPreview}
        </div>
        <button type="submit" class="btn btn--primary btn--wide">Далее — выбор теста</button>
      </form>
    </section>`;
}

function renderTestType() {
  return `
    <section class="screen">
      ${renderProgress()}
      <button type="button" class="back" data-action="back-register">← Назад</button>
      <h2>Тип анкеты</h2>
      <p class="lead">Выберите вариант как на бумажном бланке.</p>
      <div class="grid">
        <button type="button" class="card card--mode" data-test-type="regular">
          <span class="card__title">Регулярный цикл</span>
          <span class="card__sub">4 периода — от месячных до овуляции и обратно</span>
        </button>
        <button type="button" class="card card--mode" data-test-type="menopause">
          <span class="card__title">Менопауза</span>
          <span class="card__sub">Один блок вопросов без привязки к циклу</span>
        </button>
      </div>
    </section>`;
}

function renderPeriod() {
  const period = PERIODS[state.periodIndex];
  const questions = periodQuestions(period.id);
  const blocks = questions.map(renderQuestionBlock).join('');
  const allAnswered = questions.every((q) => state.answers[q.key]);

  return `
    <section class="screen screen--sheet">
      ${renderProgress()}
      <p class="eyebrow">${period.short} · ${state.periodIndex + 1} из 4</p>
      <h2>${esc(period.name)}</h2>
      <p class="lead sheet-hint">Поставьте галочку напротив одного ответа в каждом блоке.</p>
      <div class="sheet">${blocks}</div>
      <div class="quiz-nav">
        <button type="button" class="btn btn--ghost" data-action="prev-period" ${state.periodIndex === 0 ? 'disabled' : ''}>Назад</button>
        <button type="button" class="btn btn--primary" data-action="next-period" ${allAnswered ? '' : 'disabled'} id="nextPeriodBtn">Далее</button>
      </div>
    </section>`;
}

function renderMenopause() {
  const questions = menopauseQuestions();
  const blocks = questions.map(renderQuestionBlock).join('');
  const allAnswered = questions.every((q) => state.answers[q.key]);

  return `
    <section class="screen screen--sheet">
      ${renderProgress()}
      <p class="eyebrow">Менопауза</p>
      <h2>Анкета для менопаузы</h2>
      <p class="lead sheet-hint">Поставьте галочку напротив одного ответа в каждом блоке.</p>
      <div class="sheet">${blocks}</div>
      <div class="quiz-nav">
        <button type="button" class="btn btn--ghost" data-action="back-type">Назад</button>
        <button type="button" class="btn btn--primary" data-action="next-menopause" ${allAnswered ? '' : 'disabled'}>Далее</button>
      </div>
    </section>`;
}

function renderSeason() {
  const dep = state.answers.season_dependency;
  const showDesc = dep === 'Да';

  return `
    <section class="screen">
      ${renderProgress()}
      <button type="button" class="back" data-action="back-from-season">← Назад</button>
      <h2>Зависимость от сезона</h2>
      <div class="question-block">
        <p class="question-label">Есть ли у Вас зависимость либидо от сезона года?</p>
        <div class="check-list">
          ${OPT.season
            .map(
              (opt) => `
            <label class="check-row ${dep === opt ? 'check-row--on' : ''}" data-key="season_dependency" data-index="${OPT.season.indexOf(opt)}">
              <input type="radio" name="season_dependency" value="${opt}" ${dep === opt ? 'checked' : ''} hidden>
              <span class="check-box">${dep === opt ? '✓' : ''}</span>
              <span class="check-text">${opt}</span>
            </label>`
            )
            .join('')}
        </div>
      </div>
      ${
        showDesc
          ? `<label class="field field--top">
          <span>Опишите, как меняется либидо по сезонам</span>
          <textarea id="seasonDesc" rows="4" maxlength="1000" placeholder="Например: весной и летом выше...">${esc(state.answers.season_description || '')}</textarea>
        </label>`
          : ''
      }
      <button type="button" class="btn btn--primary btn--wide" data-action="finish" ${dep ? '' : 'disabled'}>Завершить анкету</button>
    </section>`;
}

function answerRowsForPdf() {
  const rows = [];
  const pushQ = (label, key) => {
    rows.push({ label, value: state.answers[key] || '—' });
  };

  if (state.test_type === 'regular') {
    for (const p of PERIODS) {
      rows.push({ label: p.name, value: '', isHeader: true });
      const qs = periodQuestions(p.id);
      for (const q of qs) rows.push({ label: q.label, value: state.answers[q.key] || '—' });
    }
  } else {
    for (const q of menopauseQuestions()) {
      rows.push({ label: q.label, value: state.answers[q.key] || '—' });
    }
  }

  rows.push({ label: 'Зависимость от сезона', value: state.answers.season_dependency || '—' });
  if (state.answers.season_description) {
    rows.push({ label: 'Описание сезона', value: state.answers.season_description });
  }
  return rows;
}

function renderResult() {
  const r = state.registration;
  const res = state.result;
  const rows = answerRowsForPdf()
    .map((row) => {
      if (row.isHeader) return `<h4 class="pdf-period">${esc(row.label)}</h4>`;
      return `<div class="pdf-row"><span class="pdf-q">${esc(row.label)}</span><span class="pdf-a">${esc(row.value)}</span></div>`;
    })
    .join('');

  return `
    <section class="screen">
      <h2>Анкета заполнена</h2>
      <div id="pdfRoot" class="pdf-root">
        <p class="eyebrow">Анкета женского либидо · ${new Date().toLocaleString('ru-RU')}</p>
        <p><strong>${esc(r.lastName)} ${esc(r.firstName)}</strong>, ${esc(r.age)} лет</p>
        <p>📱 ${esc(r.phone)} · ${esc(r.telegram)}</p>
        <p class="score">Баллы: <strong>${res.score}</strong></p>
        <p class="level">${esc(res.level)}</p>
        <p class="hint">${esc(res.desc)}</p>
        <hr class="pdf-hr">
        ${rows}
      </div>
      <div class="actions">
        <button type="button" class="btn btn--primary" id="btnPdf">Сохранить PDF</button>
        <button type="button" class="btn btn--secondary" id="btnTelegram">${state.telegramSent ? 'Отправить снова' : 'Отправить в Telegram'}</button>
        <button type="button" class="btn btn--ghost" data-action="restart">Новая анкета</button>
      </div>
      <p id="status" class="status" role="status">${state.telegramSent ? '✓ Отправлено в Telegram' : ''}</p>
    </section>`;
}

function render() {
  const app = $('#app');
  switch (state.step) {
    case 'welcome':
      app.innerHTML = renderWelcome();
      break;
    case 'register':
      app.innerHTML = renderRegister();
      break;
    case 'test_type':
      app.innerHTML = renderTestType();
      break;
    case 'period':
      app.innerHTML = renderPeriod();
      break;
    case 'menopause':
      app.innerHTML = renderMenopause();
      break;
    case 'season':
      app.innerHTML = renderSeason();
      break;
    case 'result':
      app.innerHTML = renderResult();
      break;
    default:
      app.innerHTML = renderWelcome();
  }
  bindEvents();
  if (state.step === 'result' && !state.telegramSent) {
    sendTelegram(true);
  }
}

function setAnswer(key, value) {
  state.answers[key] = value;
}

function periodAllAnswered() {
  return periodQuestions(PERIODS[state.periodIndex].id).every((q) => state.answers[q.key]);
}

function bindEvents() {
  $('[data-action="start"]')?.addEventListener('click', () => {
    state.step = 'register';
    render();
  });

  $('[data-action="back-welcome"]')?.addEventListener('click', () => {
    state.step = 'welcome';
    render();
  });

  $('[data-action="back-register"]')?.addEventListener('click', () => {
    state.step = 'register';
    render();
  });

  $('[data-action="back-type"]')?.addEventListener('click', () => {
    state.step = 'test_type';
    render();
  });

  $('[data-action="back-from-season"]')?.addEventListener('click', () => {
    state.step = state.test_type === 'regular' ? 'period' : 'menopause';
    if (state.test_type === 'regular') state.periodIndex = 3;
    render();
  });

  $('[data-action="restart"]')?.addEventListener('click', () => {
    Object.assign(state, {
      step: 'welcome',
      registration: { firstName: '', lastName: '', age: '', phone: '', telegram: '', photo: null, photoName: '' },
      test_type: null,
      answers: {},
      periodIndex: 0,
      result: null,
      telegramSent: false,
    });
    render();
  });

  const regForm = $('#regForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(regForm);
      Object.assign(state.registration, {
        lastName: String(fd.get('lastName') || '').trim(),
        firstName: String(fd.get('firstName') || '').trim(),
        age: String(fd.get('age') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        telegram: String(fd.get('telegram') || '').trim(),
      });
      state.step = 'test_type';
      render();
      sendRegistration();
    });
  }

  $('#photoInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.registration.photo = reader.result;
      state.registration.photoName = file.name;
      render();
    };
    reader.readAsDataURL(file);
  });

  $('[data-action="remove-photo"]')?.addEventListener('click', () => {
    state.registration.photo = null;
    state.registration.photoName = '';
    render();
  });

  $$('[data-test-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.test_type = btn.dataset.testType;
      state.answers = { test_type: state.test_type };
      state.periodIndex = 0;
      state.step = state.test_type === 'regular' ? 'period' : 'menopause';
      render();
    });
  });

  $$('.check-row').forEach((row) => {
    row.addEventListener('click', () => {
      const key = row.dataset.key;
      const idx = Number(row.dataset.index);
      let options = OPT.season;
      if (key.startsWith('period')) {
        const periodId = Number(key.match(/period(\d)/)?.[1]);
        const q = periodQuestions(periodId).find((x) => x.key === key);
        options = q?.options || options;
      } else if (key.startsWith('menopause')) {
        const q = menopauseQuestions().find((x) => x.key === key);
        options = q?.options || options;
      }
      const value = options[idx];
      if (!value) return;
      setAnswer(key, value);
      if (key === 'season_dependency' && value === 'Нет') {
        delete state.answers.season_description;
      }
      render();
    });
  });

  $('#seasonDesc')?.addEventListener('input', (e) => {
    state.answers.season_description = e.target.value;
  });

  $('[data-action="prev-period"]')?.addEventListener('click', () => {
    if (state.periodIndex > 0) {
      state.periodIndex -= 1;
      render();
    }
  });

  $('[data-action="next-period"]')?.addEventListener('click', () => {
    if (!periodAllAnswered()) return;
    if (state.periodIndex < 3) {
      state.periodIndex += 1;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      state.step = 'season';
      render();
    }
  });

  $('[data-action="next-menopause"]')?.addEventListener('click', () => {
    const ok = menopauseQuestions().every((q) => state.answers[q.key]);
    if (!ok) return;
    state.step = 'season';
    render();
  });

  $('[data-action="finish"]')?.addEventListener('click', () => {
    if (!state.answers.season_dependency) return;
    const data = { ...state.answers, test_type: state.test_type };
    state.result = calculateResult(data);
    state.step = 'result';
    render();
  });

  $('#btnPdf')?.addEventListener('click', downloadPdf);
  $('#btnTelegram')?.addEventListener('click', () => sendTelegram(false));
}

function buildPayload() {
  return {
    type: 'results',
    registration: state.registration,
    test_type: state.test_type,
    answers: { ...state.answers, test_type: state.test_type },
    result: state.result,
    date: new Date().toISOString(),
  };
}

async function sendRegistration() {
  try {
    await fetch('/api/send-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'registration',
        registration: state.registration,
        date: new Date().toISOString(),
      }),
    });
  } catch {
    /* тихо — не блокируем анкету */
  }
}

async function sendTelegram(silent) {
  const status = $('#status');
  if (!silent && status) status.textContent = 'Отправляем…';
  try {
    const res = await fetch('/api/send-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка сервера');
    state.telegramSent = true;
    if (status) status.textContent = '✓ Отправлено в Telegram';
  } catch (e) {
    if (!silent && status) {
      status.textContent = 'Telegram: ' + e.message + ' (настрой TELEGRAM_* на Vercel)';
    }
  }
}

async function downloadPdf() {
  const status = $('#status');
  if (status) status.textContent = 'Готовим PDF…';
  try {
    const el = $('#pdfRoot');
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm'),
      import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm'),
    ]);
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff', logging: false });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxW = pageW - margin * 2;
    let y = margin;
    let imgH = (canvas.height * maxW) / canvas.width;
    if (imgH > pageH - margin * 2) {
      pdf.addImage(img, 'PNG', margin, y, maxW, pageH - margin * 2);
    } else {
      pdf.addImage(img, 'PNG', margin, y, maxW, imgH);
    }
    const name = `${state.registration.lastName || 'anketa'}_${state.registration.firstName || ''}`.replace(/[^\wа-яА-ЯёЁ-]+/gi, '_');
    pdf.save(`libido-${name}-${Date.now()}.pdf`);
    if (status) status.textContent = state.telegramSent ? '✓ PDF сохранён' : 'PDF сохранён';
  } catch (e) {
    if (status) status.textContent = 'Ошибка PDF: ' + e.message;
  }
}

render();
