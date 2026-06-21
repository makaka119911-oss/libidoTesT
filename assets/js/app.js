import {
  PERIODS,
  OPT,
  SEASON_LABEL,
  periodQuestionsSheet1,
  periodQuestionsSheet2,
  menopauseQuestionsSheet1,
  menopauseQuestionsSheet2,
} from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  step: 'test_type',
  test_type: null,
  sheet: 1,
  periodIndex: 0,
  answers: {},
  telegramSent: false,
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function currentQuestions() {
  if (state.test_type === 'regular') {
    return state.sheet === 1
      ? periodQuestionsSheet1(PERIODS[state.periodIndex].id)
      : periodQuestionsSheet2(PERIODS[state.periodIndex].id);
  }
  return state.sheet === 1 ? menopauseQuestionsSheet1() : menopauseQuestionsSheet2();
}

function progressPct() {
  if (!state.test_type) return 0;
  let total = state.test_type === 'regular' ? 10 : 3; // 4+4 periods + season, or 2 sheets + season
  let done = 0;
  if (state.step === 'sheet') {
    done = state.test_type === 'regular' ? (state.sheet - 1) * 4 + state.periodIndex : state.sheet - 1;
  } else if (state.step === 'season_age') done = total - 1;
  else if (state.step === 'result') done = total;
  return Math.min(100, Math.round((done / total) * 100));
}

function renderCheckList(question) {
  const selected = state.answers[question.key];
  return question.options
    .map(
      (opt, i) => `
    <label class="check-row ${selected === opt ? 'check-row--on' : ''}" data-key="${question.key}" data-index="${i}">
      <input type="radio" name="${question.key}" value="${esc(opt)}" hidden>
      <span class="check-box" aria-hidden="true">${selected === opt ? '✓' : ''}</span>
      <span class="check-text">${esc(opt)}</span>
    </label>`
    )
    .join('');
}

function renderQuestionBlock(q) {
  const sub = q.sub ? `<p class="question-sub">${esc(q.sub)}</p>` : '';
  return `
    <div class="question-block" data-qkey="${q.key}">
      <p class="question-label">${esc(q.label)}</p>
      ${sub}
      <div class="check-list">${renderCheckList(q)}</div>
    </div>`;
}

function renderProgress() {
  return `<div class="progress" aria-hidden="true"><div class="progress__bar" style="width:${progressPct()}%"></div></div>`;
}

function renderTestType() {
  return `
    <section class="screen">
      <p class="eyebrow">ТЕСТ АНКЕТА НА ЖЕНСКОЕ ЛИБИДО</p>
      <h1>Выберите бланк</h1>
      <div class="grid">
        <button type="button" class="card card--mode" data-test-type="regular">
          <span class="card__title">Обычный цикл</span>
          <span class="card__sub">4 периода — как на бланке с таблицей</span>
        </button>
        <button type="button" class="card card--mode" data-test-type="menopause">
          <span class="card__title">Менопауза</span>
          <span class="card__sub">Бланк «Менопауза»</span>
        </button>
      </div>
    </section>`;
}

function sheetTitle() {
  if (state.test_type === 'menopause') {
    return state.sheet === 1 ? 'Менопауза · лист 1' : 'Менопауза · лист 2';
  }
  const period = PERIODS[state.periodIndex];
  return `${period.name} · лист ${state.sheet}`;
}

function renderSheet() {
  const questions = currentQuestions();
  const blocks = questions.map(renderQuestionBlock).join('');
  const allAnswered = questions.every((q) => state.answers[q.key]);
  const isRegular = state.test_type === 'regular';
  const backLabel = state.periodIndex === 0 && state.sheet === 1 ? '← К выбору бланка' : '← Назад';

  return `
    <section class="screen screen--sheet">
      ${renderProgress()}
      <button type="button" class="back" data-action="back">${backLabel}</button>
      <p class="eyebrow">${sheetTitle()}${isRegular ? ` · ${state.periodIndex + 1}/4` : ''}</p>
      <h2 class="sheet-title">${state.test_type === 'menopause' && state.sheet === 1 ? 'Менопауза' : isRegular ? PERIODS[state.periodIndex].name : ''}</h2>
      <div class="sheet">${blocks}</div>
      <div class="quiz-nav">
        <button type="button" class="btn btn--primary" data-action="next-sheet" ${allAnswered ? '' : 'disabled'}>Далее</button>
      </div>
    </section>`;
}

function renderSeasonAge() {
  const dep = state.answers.season_dependency;
  const showDesc = dep === 'Да';

  return `
    <section class="screen">
      ${renderProgress()}
      <button type="button" class="back" data-action="back-from-season">← Назад</button>
      <div class="question-block">
        <p class="question-label">${esc(SEASON_LABEL)}</p>
        <div class="check-list">
          ${OPT.season
            .map(
              (opt) => `
            <label class="check-row ${dep === opt ? 'check-row--on' : ''}" data-key="season_dependency" data-index="${OPT.season.indexOf(opt)}">
              <input type="radio" name="season_dependency" value="${opt}" hidden>
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
          <textarea id="seasonDesc" rows="4" maxlength="1000">${esc(state.answers.season_description || '')}</textarea>
        </label>`
          : ''
      }
      <label class="field field--top">
        <span>Ваш возраст</span>
        <input type="number" id="ageInput" min="18" max="99" maxlength="3" placeholder="Возраст" value="${esc(state.answers.age || '')}">
      </label>
      <button type="button" class="btn btn--primary btn--wide" data-action="finish" ${dep && state.answers.age ? '' : 'disabled'}>Завершить анкету</button>
    </section>`;
}

function collectPdfRows() {
  const rows = [];
  const pushQs = (questions) => {
    for (const q of questions) {
      const label = q.sub ? `${q.label} — ${q.sub}` : q.label;
      rows.push({ label, value: state.answers[q.key] || '—' });
    }
  };

  if (state.test_type === 'regular') {
    for (const p of PERIODS) {
      rows.push({ label: p.name, isHeader: true });
      pushQs(periodQuestionsSheet1(p.id));
      pushQs(periodQuestionsSheet2(p.id));
    }
  } else {
    rows.push({ label: 'Менопауза', isHeader: true });
    pushQs(menopauseQuestionsSheet1());
    pushQs(menopauseQuestionsSheet2());
  }

  rows.push({ label: SEASON_LABEL, value: state.answers.season_dependency || '—' });
  if (state.answers.season_description) {
    rows.push({ label: 'Описание', value: state.answers.season_description });
  }
  rows.push({ label: 'Ваш возраст', value: state.answers.age || '—' });
  return rows;
}

function renderResult() {
  const typeLabel = state.test_type === 'regular' ? 'Обычный цикл' : 'Менопауза';
  const rows = collectPdfRows()
    .map((row) => {
      if (row.isHeader) return `<h4 class="pdf-period">${esc(row.label)}</h4>`;
      return `<div class="pdf-row"><span class="pdf-q">${esc(row.label)}</span><span class="pdf-a">${esc(row.value)}</span></div>`;
    })
    .join('');

  return `
    <section class="screen">
      <h2>Анкета заполнена</h2>
      <div id="pdfRoot" class="pdf-root">
        <p class="eyebrow">ТЕСТ АНКЕТА НА ЖЕНСКОЕ ЛИБИДО · ${new Date().toLocaleString('ru-RU')}</p>
        <p><strong>Бланк:</strong> ${typeLabel}</p>
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
    case 'test_type':
      app.innerHTML = renderTestType();
      break;
    case 'sheet':
      app.innerHTML = renderSheet();
      break;
    case 'season_age':
      app.innerHTML = renderSeasonAge();
      break;
    case 'result':
      app.innerHTML = renderResult();
      break;
    default:
      app.innerHTML = renderTestType();
  }
  bindEvents();
  if (state.step === 'result' && !state.telegramSent) sendTelegram(true);
}

function optionsForKey(key) {
  if (key === 'season_dependency') return OPT.season;
  const all = [];
  if (state.test_type === 'regular') {
    for (const p of PERIODS) {
      all.push(...periodQuestionsSheet1(p.id), ...periodQuestionsSheet2(p.id));
    }
  } else {
    all.push(...menopauseQuestionsSheet1(), ...menopauseQuestionsSheet2());
  }
  const q = all.find((x) => x.key === key);
  return q?.options || OPT.season;
}

function bindEvents() {
  $('[data-action="back-type"]')?.addEventListener('click', () => goTestType());

  $('[data-action="back"]')?.addEventListener('click', () => {
      if (state.test_type === 'regular') {
        if (state.periodIndex > 0) {
          state.periodIndex -= 1;
        } else if (state.sheet === 2) {
          state.sheet = 1;
          state.periodIndex = 3;
        } else {
          goTestType();
          return;
        }
      } else if (state.sheet === 2) {
        state.sheet = 1;
      } else {
        goTestType();
        return;
      }
      render();
    });

  $('[data-action="back-from-season"]')?.addEventListener('click', () => {
    state.step = 'sheet';
    state.sheet = state.test_type === 'regular' ? 2 : 2;
    if (state.test_type === 'regular') state.periodIndex = 3;
    render();
  });

  $('[data-action="restart"]')?.addEventListener('click', () => {
    Object.assign(state, {
      step: 'test_type',
      test_type: null,
      sheet: 1,
      periodIndex: 0,
      answers: {},
      telegramSent: false,
    });
    render();
  });

  $$('[data-test-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.test_type = btn.dataset.testType;
      state.answers = { test_type: state.test_type };
      state.sheet = 1;
      state.periodIndex = 0;
      state.step = 'sheet';
      render();
    });
  });

  $$('.check-row').forEach((row) => {
    row.addEventListener('click', () => {
      const key = row.dataset.key;
      const idx = Number(row.dataset.index);
      const value = optionsForKey(key)[idx];
      if (!value) return;
      state.answers[key] = value;
      if (key === 'season_dependency' && value === 'Нет') delete state.answers.season_description;
      render();
    });
  });

  $('#seasonDesc')?.addEventListener('input', (e) => {
    state.answers.season_description = e.target.value;
  });

  $('#ageInput')?.addEventListener('input', (e) => {
    state.answers.age = String(e.target.value || '').trim();
    const btn = $('[data-action="finish"]');
    if (btn) btn.disabled = !(state.answers.season_dependency && state.answers.age);
  });

  $('[data-action="next-sheet"]')?.addEventListener('click', () => {
    const qs = currentQuestions();
    if (!qs.every((q) => state.answers[q.key])) return;

    if (state.test_type === 'regular') {
      if (state.periodIndex < 3) {
        state.periodIndex += 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (state.sheet === 1) {
        state.sheet = 2;
        state.periodIndex = 0;
      } else {
        state.step = 'season_age';
      }
    } else if (state.sheet === 1) {
      state.sheet = 2;
    } else {
      state.step = 'season_age';
    }
    render();
  });

  $('[data-action="finish"]')?.addEventListener('click', () => {
    if (!state.answers.season_dependency || !state.answers.age) return;
    state.step = 'result';
    render();
  });

  $('#btnPdf')?.addEventListener('click', downloadPdf);
  $('#btnTelegram')?.addEventListener('click', () => sendTelegram(false));
}

function goTestType() {
  state.step = 'test_type';
  state.test_type = null;
  state.sheet = 1;
  state.periodIndex = 0;
  state.answers = {};
  render();
}

function buildPayload() {
  return {
    test_type: state.test_type,
    answers: { ...state.answers, test_type: state.test_type },
    date: new Date().toISOString(),
  };
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
    if (!silent && status) status.textContent = 'Telegram: ' + e.message;
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
    const margin = 10;
    const maxW = pageW - margin * 2;
    const imgH = (canvas.height * maxW) / canvas.width;
    pdf.addImage(img, 'PNG', margin, margin, maxW, imgH);
    pdf.save(`libido-anketa-${Date.now()}.pdf`);
    if (status) status.textContent = state.telegramSent ? '✓ PDF сохранён' : 'PDF сохранён';
  } catch (e) {
    if (status) status.textContent = 'Ошибка PDF: ' + e.message;
  }
}

render();
