export const PERIODS = [
  { id: 1, name: 'Период-1: От конца месячных до овуляции', short: 'Период 1' },
  { id: 2, name: 'Период-2: В период овуляции', short: 'Период 2' },
  { id: 3, name: 'Период-3: От конца овуляции до начала месячных', short: 'Период 3' },
  { id: 4, name: 'Период-4: В период месячных', short: 'Период 4' },
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

/** Вопросы как на бумажной анкете */
export function periodQuestions(periodId) {
  const p = `period${periodId}`;
  return [
    { key: `${p}_frequency`, label: 'Как часто хочется секса?', options: OPT.frequency },
    { key: `${p}_strength`, label: 'Сила желания в те дни, когда хочется секса?', options: OPT.strength },
    {
      key: `${p}_erected_want`,
      label: 'Возбуждает ли Вас вид эрегированного полового члена? В дни, когда хочется секса',
      options: OPT.arousal,
    },
    {
      key: `${p}_erected_not_want`,
      label: 'Возбуждает ли Вас вид эрегированного полового члена? В дни, когда НЕ хочется секса (если такие дни бывают)',
      options: OPT.arousal,
    },
    {
      key: `${p}_non_erected_want`,
      label: 'Возбуждает ли Вас вид НЕэрегированного полового члена? В дни, когда хочется секса',
      options: OPT.arousal,
    },
    {
      key: `${p}_non_erected_not_want`,
      label: 'Возбуждает ли Вас вид НЕэрегированного полового члена? В дни, когда НЕ хочется секса (если такие дни бывают)',
      options: OPT.arousal,
    },
    { key: `${p}_fantasy`, label: 'Бывают ли у Вас фантазии о сексе?', options: OPT.fantasy },
    { key: `${p}_oral`, label: 'Возбуждаетесь ли Вы, когда делаете минет?', options: OPT.oral },
  ];
}

export function menopauseQuestions() {
  return [
    { key: 'menopause_frequency', label: 'Как часто хочется секса?', options: OPT.frequency },
    { key: 'menopause_strength', label: 'Сила желания в те дни, когда хочется секса?', options: OPT.strength },
    {
      key: 'menopause_erected_want',
      label: 'Возбуждает ли Вас вид эрегированного полового члена? В дни, когда хочется секса',
      options: OPT.arousal,
    },
    {
      key: 'menopause_erected_not_want',
      label: 'Возбуждает ли Вас вид эрегированного полового члена? В дни, когда НЕ хочется секса (если такие дни бывают)',
      options: OPT.arousal,
    },
    {
      key: 'menopause_non_erected_want',
      label: 'Возбуждает ли Вас вид НЕэрегированного полового члена? В дни, когда хочется секса',
      options: OPT.arousal,
    },
    {
      key: 'menopause_non_erected_not_want',
      label: 'Возбуждает ли Вас вид НЕэрегированного полового члена? В дни, когда НЕ хочется секса (если такие дни бывают)',
      options: OPT.arousal,
    },
    { key: 'menopause_fantasy', label: 'Бывают ли у Вас фантазии о сексе?', options: OPT.fantasy },
    { key: 'menopause_oral', label: 'Возбуждаетесь ли Вы, когда делаете минет?', options: OPT.oral },
  ];
}

export const SCORE = {
  frequency: Object.fromEntries(OPT.frequency.map((t, i) => [t, i])),
  strength: Object.fromEntries(OPT.strength.map((t, i) => [t, i + 1])),
  arousal: Object.fromEntries(OPT.arousal.map((t, i) => [t, i])),
  oral: Object.fromEntries(OPT.oral.map((t, i) => [t, i])),
  fantasy: Object.fromEntries(OPT.fantasy.map((t, i) => [t, i])),
};

export function calculateResult(data) {
  let total = 0;
  const type = data.test_type;

  const add = (val, map) => {
    if (val && map[val] != null) total += map[val];
  };

  if (type === 'regular') {
    for (let i = 1; i <= 4; i++) {
      const p = `period${i}_`;
      add(data[p + 'frequency'], SCORE.frequency);
      add(data[p + 'strength'], SCORE.strength);
      add(data[p + 'erected_want'], SCORE.arousal);
      add(data[p + 'erected_not_want'], SCORE.arousal);
      add(data[p + 'non_erected_want'], SCORE.arousal);
      add(data[p + 'non_erected_not_want'], SCORE.arousal);
      add(data[p + 'fantasy'], SCORE.fantasy);
      add(data[p + 'oral'], SCORE.oral);
    }
  } else {
    add(data.menopause_frequency, SCORE.frequency);
    add(data.menopause_strength, SCORE.strength);
    add(data.menopause_erected_want, SCORE.arousal);
    add(data.menopause_erected_not_want, SCORE.arousal);
    add(data.menopause_non_erected_want, SCORE.arousal);
    add(data.menopause_non_erected_not_want, SCORE.arousal);
    add(data.menopause_fantasy, SCORE.fantasy);
    add(data.menopause_oral, SCORE.oral);
  }

  if (type === 'menopause') {
    if (total < 15) return { score: total, level: 'Низкое либидо в menopause', desc: 'Снижение либидо в menopause — частое явление из‑за гормональных изменений. Есть эффективные методы восстановления.' };
    if (total < 30) return { score: total, level: 'Среднее либидо в menopause', desc: 'Умеренный уровень либидо — хороший показатель для этого периода. Есть возможности усилить сексуальную энергию.' };
    if (total < 45) return { score: total, level: 'Высокое либидо в menopause', desc: 'Высокий уровень либидо — отличная основа для развития сексуальности.' };
    return { score: total, level: 'Очень высокое либидо в menopause', desc: 'Исключительно высокий уровень либидо для menopause.' };
  }

  if (total < 40) return { score: total, level: 'Низкий уровень либидо', desc: 'Возможен выраженный спад желания — имеет смысл разобрать причины со специалистом.' };
  if (total < 70) return { score: total, level: 'Средний уровень либидо', desc: 'Есть ресурс и зоны роста; работа с телом и эмоциями может помочь.' };
  if (total < 100) return { score: total, level: 'Высокий уровень либидо', desc: 'Желание и удовлетворённость в целом сохранены.' };
  return { score: total, level: 'Очень высокий уровень либидо', desc: 'Высокая сексуальная энергия — важно направлять её осознанно.' };
}
