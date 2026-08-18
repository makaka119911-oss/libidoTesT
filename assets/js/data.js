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

/** Максимум по шкале SCORE: обычный цикл 4×35, менопауза 1×35. SCORE не менять. */
export const MAX_SCORE = { regular: 140, menopause: 35 };

const LOW_ADVICE =
  'Если хочется больше тепла к себе — это можно спокойно разобрать со специалистом, без спешки и оценок. Не диагноз и не приговор.';

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

  const maxScore = type === 'menopause' ? MAX_SCORE.menopause : MAX_SCORE.regular;
  const pack = (level, desc, advice = '') => ({ score: total, maxScore, level, desc, advice });

  if (type === 'menopause') {
    // Было <45 / «очень высокое» — недостижимо (макс. 35). Квартили от 35: 12 / 22 / 29.
    if (total < 12) {
      return pack(
        'Низкое либидо в menopause',
        'В этот период желание часто становится тише — так бывает при гормональных переменах, и это не «поломка».',
        LOW_ADVICE
      );
    }
    if (total < 22) {
      return pack(
        'Среднее либидо в menopause',
        'Умеренный ритм для этого этапа: есть и тепло, и пространство для мягкой настройки под себя.'
      );
    }
    if (total < 29) {
      return pack(
        'Высокое либидо в menopause',
        'Желание живое — хорошая опора, чтобы бережно относиться к себе и к близости.'
      );
    }
    return pack(
      'Очень высокое либидо в menopause',
      'Очень живой ритм для этого периода. Важно направлять энергию так, как комфортно именно вам.'
    );
  }

  // Было <40 / <70 / <100 при максимуме 140. Квартили: 35 / 70 / 105.
  if (total < 35) {
    return pack(
      'Низкий уровень либидо',
      'Сейчас желание может быть тише, чем хотелось бы. Так бывает по разным причинам — усталость, стресс, цикл, отношения — и это не приговор.',
      LOW_ADVICE
    );
  }
  if (total < 70) {
    return pack(
      'Средний уровень либидо',
      'Есть и ресурс, и зоны, которые можно мягко подсветить. Можно идти в своём темпе, без гонки «должно быть сильнее».'
    );
  }
  if (total < 105) {
    return pack(
      'Высокий уровень либидо',
      'Желание в целом живое и сохранённое. Можно просто замечать, что уже работает хорошо.'
    );
  }
  return pack(
    'Очень высокий уровень либидо',
    'Очень живая сексуальная энергия. Важно направлять её бережно — так, как откликается тело и сердце.'
  );
}
