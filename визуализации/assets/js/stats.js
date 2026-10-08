/* ============================================================
   Страница статистики: агрегаты по свойствам элементов
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const ru = v => (v == null ? '—' : (+v).toFixed(3).replace(/\.?0+$/, '').replace('.', ','));

  /* ---------------- Вспомогательные подсчёты ---------------- */

  const countBy = fn => {
    const map = new Map();
    for (const e of ELEMENTS) {
      const k = fn(e);
      if (k == null) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  /** Горизонтальные полосы из готовых данных */
  function bars(items, total) {
    return '<div class="hbars">' + items.map(([label, value, color, note]) => `
      <div class="hbar">
        <span class="hbar__label" title="${label}">${label}</span>
        <div class="hbar__track">
          <div class="hbar__fill" style="width:${(value / total * 100).toFixed(1)}%;background:${color}"></div>
        </div>
        <span class="hbar__val">${note ?? value}</span>
      </div>`).join('') + '</div>';
  }

  /** Вертикальные столбцы по периодам */
  function columns(counts, colors) {
    return '<div class="bars">' + counts.map((v, i) => `
      <div class="bars__col" title="Период ${i + 1}">
        <div class="bars__bar" style="height:${(v / Math.max(...counts) * 100).toFixed(1)}%;background:${colors[i % colors.length]}"></div>
        <span class="bars__lab">${i + 1}</span>
      </div>`).join('') + '</div>';
  }

  const PERIOD_COLORS = ['#5aa9f7', '#3ec6c0', '#4ecdc4', '#8fd14f', '#ffd94a', '#ffab5e', '#ff6f61'];

  /* ---------------- Верхние карточки ---------------- */

  const catItems = countBy(e => CATEGORIES[e.category].name)
    .map(([name, n]) => {
      const key = Object.keys(CATEGORIES).find(k => CATEGORIES[k].name === name);
      return [name, n, CATEGORIES[key].color, `${n}`];
    });

  const magItems = countBy(e => e.magnetism ? MAGNETISM[e.magnetism].name : 'Данных нет')
    .map(([name, n]) => {
      const key = Object.keys(MAGNETISM).find(k => MAGNETISM[k].name === name);
      const color = key === 'd' ? '#9a8cff' : key === 'p' ? '#5aa9f7' : key === 'f' ? '#ff6f61' : '#3a3a44';
      return [name, n, color, `${n}`];
    });

  const stateItems = countBy(e => stateAt(e, 0) || 'Нет данных')
    .map(([name, n]) => [name, n, { 'Газ': '#3b82f6', 'Жидкость': '#22d3ee', 'Твёрдое': '#f59e0b' }[name] || '#3a3a44', `${n}`]);

  const originItems = countBy(e => ({ primordial: 'Примордиальные', decay: 'Образуются при распаде', synthetic: 'Синтетические' })[e.origin])
    .map(([name, n], i) => [name, n, ['#8fd14f', '#c76ee0', '#ff6f61'][i], `${n}`]);

  $('top').innerHTML = `
    <div class="cardbox">
      <h2 class="cardbox__title">Всего элементов <small>изучено</small></h2>
      <div style="font-size:44px;font-weight:700;line-height:1;font-family:'JetBrains Mono',Consolas,monospace;color:#33ccff">${ELEMENTS.length}</div>
      <p style="color:#8b90a0;font-size:12.5px;margin:12px 0 0;line-height:1.5">
        Среди них ${ELEMENTS.filter(e => e.radioactive).length} радиоактивных и
        ${ELEMENTS.filter(e => !e.radioactive).length} имеющих стабильные изотопы.
      </p>
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">По категориям</h2>
      ${bars(catItems, ELEMENTS.length)}
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">По происхождению</h2>
      ${bars(originItems, ELEMENTS.length)}
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">Магнитные свойства</h2>
      ${bars(magItems, ELEMENTS.length)}
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">Агрегатное состояние при НУП <small>0 °C, 1 атм</small></h2>
      ${bars(stateItems, ELEMENTS.length)}
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">Число элементов по периодам</h2>
      ${columns([1, 2, 3, 4, 5, 6, 7].map(p => ELEMENTS.filter(e => e.period === p).length), PERIOD_COLORS)}
      <p style="color:#8b90a0;font-size:12px;margin:10px 0 0">
        Седьмой период содержит 32 элемента — больше всех.
      </p>
    </div>`;

  /* ---------------- Свойства ---------------- */

  $('props').innerHTML = PROPERTIES.map(p => {
    const st = statsFor(p.key);
    if (!st) return '';
    const unit = p.unit && p.unit !== '%' ? ' ' + p.unit : '';
    return `
      <div class="cardbox">
        <h2 class="cardbox__title">${p.name}</h2>
        <dl class="kv">
          <dt>Элементов с данными</dt><dd>${st.count}</dd>
          <dt>Минимум</dt><dd>${ru(st.min)}${unit}</dd>
          <dt>Максимум</dt><dd>${ru(st.max)}${unit}</dd>
          <dt>Среднее</dt><dd>${ru(st.mean)}${unit}</dd>
          <dt>Медиана</dt><dd>${ru(st.median)}${unit}</dd>
          <dt>Стандартное отклонение</dt><dd>${ru(st.std)}${unit}</dd>
        </dl>
        <div class="bars" style="height:80px">
          ${(function () {
            const sorted = [...ELEMENTS].filter(e => e[p.key] != null).sort((a, b) => a[p.key] - b[p.key]);
            return sorted.map((e, i) => {
              const t = (e[p.key] - st.min) / (st.max - st.min || 1);
              return `<div class="bars__col" title="${e.name} — ${ru(e[p.key])}${unit}">
                <div class="bars__bar" style="height:${Math.max(2, t * 100).toFixed(1)}%;background:${scaleColor(t)}"></div>
              </div>`;
            }).join('');
          })()}
        </div>
        <div class="scale__labels"><span>${ru(st.min)}</span><span>по возрастанию значения</span><span>${ru(st.max)}</span></div>
      </div>`;
  }).join('');

  /* ---------------- Электронная структура ---------------- */

  const shellCount = [0, 0, 0, 0, 0, 0, 0];
  for (const e of ELEMENTS) e.shells.forEach((n, i) => { shellCount[i] += n; });

  const maxShells = [
    'Водород и гелий имеют один электронный слой — модели с двумя и более слоями '
    + 'здесь не встречаются.',
    'Второй период: от лития до неона, 8 элементов.',
    'Третий период: от натрия до аргона, 8 элементов.',
    'Четвёртый период: от калия до криптона, 18 элементов — впервые появляется d-блок.',
    'Пятый период: от рубидия ксенону, 18 элементов.',
    'Шестой период: от цезия к радону, 32 элемента, включая лантаноиды.',
    'Седьмой период: от франция к оганесону, 32 элемента, включая актиноиды.'
  ];

  $('shells').innerHTML = `
    <div class="cardbox">
      <h2 class="cardbox__title">Заполнение электронных слоёв <small>суммарно по всем элементам</small></h2>
      ${columns(shellCount, PERIOD_COLORS)}
      <div class="scale__labels" style="margin-top:8px">
        <span>K (1)</span><span>L (2)</span><span>M (3)</span><span>N (4)</span>
        <span>O (5)</span><span>P (6)</span><span>Q (7)</span>
      </div>
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">Как меняются периоды</h2>
      <ul style="margin:0;padding-left:18px;color:#8b90a0;font-size:12.5px;line-height:1.65">
        ${maxShells.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>

    <div class="cardbox">
      <h2 class="cardbox__title">Самые распространённые во Вселенной</h2>
      ${bars(
        [...ELEMENTS].filter(e => e.abundance > 0)
          .sort((a, b) => b.abundance - a.abundance).slice(0, 12)
          .map(e => [`${e.name} (${e.symbol})`, e.abundance, scaleColor(e.abundance / 74), ru(e.abundance) + ' %']),
        74
      )}
      <p style="color:#8b90a0;font-size:12px;margin:12px 0 0;line-height:1.5">
        Водород и гелий составляют около 98 % всей массы Вселенной.
      </p>
    </div>`;
})();
