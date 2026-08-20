import {
  PERIODS,
  OPT,
  periodQuestions,
  menopauseQuestions,
  calculateResult,
} from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const PLATFORM_URL = 'https://zhenskiy-mir.139-100-237-242.sslip.io/';
const PRIVACY_URL = './privacy.html';

const state = {
  step: 'age',
  test_type: null,
  answers: {},
  periodIndex: 0,
  result: null,
  telegramSent: false,
  consentPd: false,
  contact: {
    name: '',
    phone: '',
    email: '',
    allowContact: false,
  },
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stepsForType(type) {
  if (type === 'regular') return ['age', 'test_type', 'period', 'season', 'result'];
  if (type === 'menopause') return ['age', 'test_type', 'menopause', 'season', 'result'];
  return ['age', 'test_type'];
}

function progressPct() {
  if (!state.test_type) return 0;
  const steps = stepsForType(state.test_type);
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
      <span class="check-box" aria-hidden="true"></span>
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

function renderAge() {
  return `
    <section class="screen">
      <p class="eyebrow">18+</p>
      <h1>Материал для взрослых</h1>
      <p class="lead">Анкета содержит откровенные вопросы об интимной жизни и предназначена для лиц 18+.</p>
      <div class="age-actions">
        <button type="button" class="btn btn--primary btn--wide" data-action="age-yes">Мне есть 18, продолжить</button>
        <button type="button" class="btn btn--ghost btn--wide" data-action="age-no">Мне нет 18</button>
      </div>
    </section>`;
}

function renderUnderage() {
  return `
    <section class="screen">
      <p class="eyebrow">18+</p>
      <h1>Тест недоступен</h1>
      <p class="lead">Эта анкета только для совершеннолетних. Берегите себя — можно вернуться позже, когда будет можно.</p>
    </section>`;
}

function renderTestType() {
  return `
    <section class="screen">
      <p class="eyebrow">Анкета женского либидо</p>
      <h1>Выберите анкету</h1>
      <p class="lead">Как на бумажном бланке — обычный цикл или менопауза. Ставьте галочки напротив ответов.</p>
      <div class="grid">
        <button type="button" class="card card--mode" data-test-type="regular">
          <span class="card__title">Обычный цикл</span>
          <span class="card__sub">4 периода: от месячных до овуляции и обратно</span>
        </button>
        <button type="button" class="card card--mode" data-test-type="menopause">
          <span class="card__title">Менопауза</span>
          <span class="card__sub">Один блок вопросов</span>
        </button>
      </div>
      <p class="disclaimer">Результат отправляется специалисту в Telegram после вашего согласия.</p>
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
      <button type="button" class="back" data-action="back-type">← К выбору анкеты</button>
      <p class="eyebrow">${period.short} · ${state.periodIndex + 1} из 4</p>
      <h2>${esc(period.name)}</h2>
      <p class="lead sheet-hint">Поставьте галочку напротив одного ответа в каждом блоке.</p>
      <div class="sheet">${blocks}</div>
      <div class="quiz-nav">
        <button type="button" class="btn btn--ghost" data-action="prev-period" ${state.periodIndex === 0 ? 'disabled' : ''}>Назад</button>
        <button type="button" class="btn btn--primary" data-action="next-period" ${allAnswered ? '' : 'disabled'}>Далее</button>
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
      <button type="button" class="back" data-action="back-type">← К выбору анкеты</button>
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
    <section class="screen screen--season">
      ${renderProgress()}
      <button type="button" class="back" data-action="back-from-season">← Назад</button>
      <h2>Зависимость от сезона</h2>
      <div class="question-block question-block--plain">
        <p class="question-label">Есть ли у Вас зависимость либидо от сезона года?</p>
        <div class="check-list">
          ${OPT.season
            .map(
              (opt) => `
            <label class="check-row ${dep === opt ? 'check-row--on' : ''}" data-key="season_dependency" data-index="${OPT.season.indexOf(opt)}">
              <input type="radio" name="season_dependency" value="${opt}" ${dep === opt ? 'checked' : ''} hidden>
              <span class="check-box" aria-hidden="true"></span>
              <span class="check-text">${opt}</span>
            </label>`
            )
            .join('')}
        </div>
      </div>
      ${
        showDesc
          ? `<label class="field field--season-desc">
          <span>Опишите, как меняется либидо по сезонам</span>
          <textarea id="seasonDesc" rows="4" maxlength="1000" placeholder="Например: весной и летом выше...">${esc(state.answers.season_description || '')}</textarea>
        </label>`
          : ''
      }
      <div class="season-footer">
        <button type="button" class="btn btn--primary btn--wide" data-action="finish" ${dep ? '' : 'disabled'}>Завершить анкету</button>
      </div>
    </section>`;
}

function answerRowsForPdf() {
  const rows = [];

  if (state.test_type === 'regular') {
    for (const p of PERIODS) {
      rows.push({ label: p.name, value: '', isHeader: true });
      for (const q of periodQuestions(p.id)) {
        rows.push({ label: q.label, value: state.answers[q.key] || '—' });
      }
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

function canSendTelegram() {
  return Boolean(state.consentPd);
}

function renderConsentPanel() {
  const c = state.contact;
  return `
    <div class="consent-panel">
      <h3 class="consent-panel__title">Перед отправкой</h3>
      <p class="consent-panel__hint">Оставьте контакт (по желанию), если хотите, чтобы исследователь мог связаться с вами по результатам.</p>
      <div class="contact-fields">
        <label class="field">
          <span>Имя (необязательно)</span>
          <input type="text" id="contactName" maxlength="80" autocomplete="name" value="${esc(c.name)}" placeholder="Как к вам обращаться">
        </label>
        <label class="field">
          <span>Телефон (необязательно)</span>
          <input type="tel" id="contactPhone" maxlength="40" autocomplete="tel" value="${esc(c.phone)}" placeholder="+7 …">
        </label>
        <label class="field">
          <span>Почта (необязательно)</span>
          <input type="email" id="contactEmail" maxlength="120" autocomplete="email" value="${esc(c.email)}" placeholder="name@example.com">
        </label>
        <label class="consent-check ${c.allowContact ? 'is-on' : ''}" data-action="toggle-contact-consent">
          <input type="checkbox" id="allowContact" ${c.allowContact ? 'checked' : ''}>
          <span class="check-box" aria-hidden="true"></span>
          <span class="consent-check__text">Согласна, чтобы исследователь связался со мной по указанному контакту (если оставила)</span>
        </label>
      </div>
      <label class="consent-check ${state.consentPd ? 'is-on' : ''}" data-action="toggle-pd-consent" style="margin-top:14px">
        <input type="checkbox" id="consentPd" ${state.consentPd ? 'checked' : ''} required>
        <span class="check-box" aria-hidden="true"></span>
        <span class="consent-check__text">Я согласна на обработку персональных данных и их передачу исследователю для научных целей (в соответствии с 152-ФЗ). <a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">Политика конфиденциальности</a></span>
      </label>
    </div>`;
}

function renderResult() {
  const res = state.result;
  const typeLabel = state.test_type === 'regular' ? 'Обычный цикл' : 'Менопауза';
  const rows = answerRowsForPdf()
    .map((row) => {
      if (row.isHeader) return `<h4 class="pdf-period">${esc(row.label)}</h4>`;
      return `<div class="pdf-row"><span class="pdf-q">${esc(row.label)}</span><span class="pdf-a">${esc(row.value)}</span></div>`;
    })
    .join('');

  const sendDisabled = canSendTelegram() ? '' : 'disabled';

  return `
    <section class="screen">
      <h2>Анкета заполнена</h2>
      <div id="pdfRoot" class="pdf-root">
        <div class="pdf-brand">
          <strong>Анкета женского либидо</strong>
          <span>Женский мир</span>
        </div>
        <p class="eyebrow">Результат · ${new Date().toLocaleString('ru-RU')}</p>
        <p><strong>Тип:</strong> ${typeLabel}</p>
        <p class="score">Баллы: <strong>${res.score}${res.maxScore ? ` из ${res.maxScore}` : ''}</strong></p>
        <p class="level">${esc(res.level)}</p>
        <p class="hint">${esc(res.desc)}</p>
        ${res.advice ? `<p class="advice">${esc(res.advice)}</p>` : ''}
        <hr class="pdf-hr">
        ${rows}
      </div>
      ${renderConsentPanel()}
      <div class="actions">
        <button type="button" class="btn btn--primary" id="btnTelegram" ${sendDisabled}>${state.telegramSent ? 'Отправить снова' : 'Отправить'}</button>
        <button type="button" class="btn btn--secondary" id="btnPdf">Сохранить PDF</button>
        <button type="button" class="btn btn--ghost" data-action="restart">Новая анкета</button>
      </div>
      <p id="status" class="status" role="status">${state.telegramSent ? '✓ Отправлено в Telegram' : ''}</p>
      <aside class="platform-note">
        <p>Исследование продолжается в «Женском мире»</p>
        <a href="${PLATFORM_URL}" target="_blank" rel="noopener noreferrer">Открыть платформу</a>
      </aside>
    </section>`;
}

function render() {
  const app = $('#app');
  switch (state.step) {
    case 'age':
      app.innerHTML = renderAge();
      break;
    case 'underage':
      app.innerHTML = renderUnderage();
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
      app.innerHTML = renderAge();
  }
  bindEvents();
}

function setAnswer(key, value) {
  state.answers[key] = value;
}

function periodAllAnswered() {
  return periodQuestions(PERIODS[state.periodIndex].id).every((q) => state.answers[q.key]);
}

function syncContactFromDom() {
  const name = $('#contactName');
  const phone = $('#contactPhone');
  const email = $('#contactEmail');
  if (name) state.contact.name = name.value.trim();
  if (phone) state.contact.phone = phone.value.trim();
  if (email) state.contact.email = email.value.trim();
}

function bindEvents() {
  $('[data-action="age-yes"]')?.addEventListener('click', () => {
    state.step = 'test_type';
    render();
  });

  $('[data-action="age-no"]')?.addEventListener('click', () => {
    state.step = 'underage';
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
      step: 'age',
      test_type: null,
      answers: {},
      periodIndex: 0,
      result: null,
      telegramSent: false,
      consentPd: false,
      contact: { name: '', phone: '', email: '', allowContact: false },
    });
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

  $('[data-action="toggle-pd-consent"]')?.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    e.preventDefault();
    syncContactFromDom();
    state.consentPd = !state.consentPd;
    render();
  });

  $('[data-action="toggle-contact-consent"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    syncContactFromDom();
    state.contact.allowContact = !state.contact.allowContact;
    render();
  });

  ['contactName', 'contactPhone', 'contactEmail'].forEach((id) => {
    $(`#${id}`)?.addEventListener('input', syncContactFromDom);
  });

  $('#btnPdf')?.addEventListener('click', downloadPdf);
  $('#btnTelegram')?.addEventListener('click', () => {
    syncContactFromDom();
    if (!canSendTelegram()) return;
    sendTelegram(false);
  });
}

function buildPayload() {
  return {
    test_type: state.test_type,
    answers: { ...state.answers, test_type: state.test_type },
    result: state.result,
    date: new Date().toISOString(),
    consent: {
      personal_data: Boolean(state.consentPd),
      contact_allowed: Boolean(state.contact.allowContact),
      law: '152-FZ',
    },
    contact: {
      name: state.contact.name || '',
      phone: state.contact.phone || '',
      email: state.contact.email || '',
    },
  };
}

async function sendTelegram(silent) {
  const status = $('#status');
  if (!state.consentPd) {
    if (status) status.textContent = 'Нужно согласие на обработку персональных данных';
    return;
  }
  if (!silent && status) status.textContent = 'Отправляем…';
  try {
    const res = await fetch('/api/anketa/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка сервера');
    state.telegramSent = true;
    if (status) status.textContent = '✓ Отправлено в Telegram';
    const btn = $('#btnTelegram');
    if (btn) btn.textContent = 'Отправить снова';
  } catch (e) {
    if (!silent && status) {
      status.textContent = 'Telegram: ' + e.message + ' (проверь TELEGRAM_* на сервере)';
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
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const maxW = pageW - margin * 2;
    const imgH = (canvas.height * maxW) / canvas.width;
    const pageDrawH = pageH - margin * 2;
    let heightLeft = imgH;
    let position = margin;

    pdf.addImage(img, 'PNG', margin, position, maxW, imgH);
    heightLeft -= pageDrawH;
    while (heightLeft > 0) {
      position = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(img, 'PNG', margin, position, maxW, imgH);
      heightLeft -= pageDrawH;
    }
    pdf.save(`anketa-zhenskogo-libido-${Date.now()}.pdf`);
    if (status) status.textContent = state.telegramSent ? '✓ PDF сохранён' : 'PDF сохранён';
  } catch (e) {
    if (status) status.textContent = 'Ошибка PDF: ' + e.message;
  }
}

render();
