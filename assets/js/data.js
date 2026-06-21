export const PERIODS = [
  { id: 1, name: 'Период-1: От конца месячных до овуляции', short: 'Период-1' },
  { id: 2, name: 'Период-2: В период овуляции', short: 'Период-2' },
  { id: 3, name: 'Период-3: От конца овуляции до начала месячных', short: 'Период-3' },
  { id: 4, name: 'Период-4: В период месячных', short: 'Период-4' },
];

export const OPT = {
  frequency: [
    'Вообще не хочется',
    'Хочется 1 раза в неделю',
    'Хочется 1 раз в 3 дня',
    'Хочется через день',
    'Хочется каждый день',
    'Хочется каждый день по много раз',
  ],
  strength: [
    'Легкое желание',
    'Среднее желание',
    'Сильное желание',
    'Очень сильное желание',
    'Максимально сильное желание(на столько,что почти невозможно терпеть)',
  ],
  arousal: [
    'Вообще не возбуждает',
    'Немного возбуждает',
    'Средне возбуждает',
    'Сильно возбуждает',
    'Очень сильно возбуждает',
  ],
  oral: [
    'Вообще не возбуждаюсь',
    'Немного возбуждаюсь',
    'Средне возбуждаюсь',
    'Сильно возбуждаюсь',
    'Очень сильно возбуждаюсь',
  ],
  fantasy: [
    'Вообще не бывают',
    'Бывают 1 раз в неделю',
    'Бывают 1 раз в 3 дня',
    'Бывают через день',
    'Бывают каждый день',
    'Бывают каждый день по много раз',
  ],
  season: ['Нет', 'Да'],
};

const ERECTED = 'Возбуждает ли Вас вид эрегированного полового члена?';
const NON_ERECTED = 'Возбуждает ли Вас вид НЕэрегированного полового члена?';
const SUB_WANT = 'В дни, когда хочется секса';
const SUB_NOT_WANT = 'В дни, когда НЕ хочется секса (если такие дни бывают)';

/** Лист 1 обычного цикла (photo_3) — частота, сила, эрегированный */
export function periodQuestionsSheet1(periodId) {
  const p = `period${periodId}`;
  return [
    { key: `${p}_frequency`, label: 'Как часто хочется секса?', options: OPT.frequency },
    { key: `${p}_strength`, label: 'Сила желания в те дни, когда хочется секса?', options: OPT.strength },
    { key: `${p}_erected_want`, label: ERECTED, sub: SUB_WANT, options: OPT.arousal },
    { key: `${p}_erected_not_want`, label: ERECTED, sub: SUB_NOT_WANT, options: OPT.arousal },
  ];
}

/** Лист 2 обычного цикла (photo_4) — неэрегированный, фантазии, минет */
export function periodQuestionsSheet2(periodId) {
  const p = `period${periodId}`;
  return [
    { key: `${p}_non_erected_want`, label: NON_ERECTED, sub: SUB_WANT, options: OPT.arousal },
    { key: `${p}_non_erected_not_want`, label: NON_ERECTED, sub: SUB_NOT_WANT, options: OPT.arousal },
    { key: `${p}_fantasy`, label: 'Бывают ли у Вас фантазии о сексе?', options: OPT.fantasy },
    { key: `${p}_oral`, label: 'Возбуждаетесь ли Вы, когда делаете минет?', options: OPT.oral },
  ];
}

/** Лист 1 менопаузы (photo_1) */
export function menopauseQuestionsSheet1() {
  return [
    { key: 'menopause_frequency', label: 'Как часто хочется секса?', options: OPT.frequency },
    { key: 'menopause_strength', label: 'Сила желания в те дни, когда хочется секса?', options: OPT.strength },
    { key: 'menopause_erected_want', label: ERECTED, sub: SUB_WANT, options: OPT.arousal },
    { key: 'menopause_erected_not_want', label: ERECTED, sub: SUB_NOT_WANT, options: OPT.arousal },
    { key: 'menopause_non_erected_want', label: NON_ERECTED, sub: SUB_WANT, options: OPT.arousal },
    { key: 'menopause_non_erected_not_want', label: NON_ERECTED, sub: SUB_NOT_WANT, options: OPT.arousal },
  ];
}

/** Лист 2 менопаузы (photo_2) */
export function menopauseQuestionsSheet2() {
  return [
    { key: 'menopause_fantasy', label: 'Бывают ли у Вас фантазии о сексе?', options: OPT.fantasy },
    { key: 'menopause_oral', label: 'Возбуждаетесь ли Вы, когда делаете минет?', options: OPT.oral },
  ];
}

export const SEASON_LABEL =
  'Зависит ли Ваше либидо от времени года, если да, то опишите как оно меняется';

export function allQuestionsForType(type, sheet, periodId) {
  if (type === 'regular') {
    return sheet === 1 ? periodQuestionsSheet1(periodId) : periodQuestionsSheet2(periodId);
  }
  return sheet === 1 ? menopauseQuestionsSheet1() : menopauseQuestionsSheet2();
}

export function sheetQuestions(type, sheet, periodId) {
  return allQuestionsForType(type, sheet, periodId);
}
