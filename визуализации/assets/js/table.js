/* ============================================================
   Периодическая таблица: раскладка, фильтры, раскраска
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const ptable = $('ptable');
  const COLS = 18, ROWS = 9;
  const ru = v => (v == null ? '—' : (+v).toFixed(3).replace(/\.?0+$/, '').replace('.', ','));

  const ui = {
    mode: 'category',     // 'category' | 'property' | 'state' | 'stp'
    property: 'melt',
    scale: 'inferno',
    log: false,
    temp: 0,
    filters: new Set()
  };

  /* ---------------- Сетка ---------------- */

  ptable.style.gridTemplateColumns = `28px repeat(${COLS}, 1fr)`;

  const cells = new Map();   // 'row,col' → DOM
  const frag = document.createDocumentFragment();

  // шапка с номерами групп
  const head = document.createElement('div');
  head.className = 'rowlabel';
  head.style.justifyContent = 'center';
  head.textContent = '';
  frag.appendChild(head);
  for (let c = 1; c <= COLS; c++) {
    const h = document.createElement('div');
    h.className = 'rowlabel';
    h.style.justifyContent = 'center';
    h.textContent = c;
    frag.appendChild(h);
  }
  const maxZ = new Map();

  for (let r = 1; r <= ROWS; r++) {
    const label = document.createElement('div');
    label.className = 'rowlabel';
    label.textContent = r <= 7 ? r : r === 8 ? '*' : '**';
    frag.appendChild(label);

    for (let c = 1; c <= COLS; c++) {
      const e = ELEMENTS.find(x => x.row === r && x.col === c);
      if (e) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.dataset.z = e.z;
        cell.style.setProperty('--cat', CATEGORIES[e.category].color);
        cell.innerHTML =
          `<span class="cell__z">${e.z}</span>` +
          `<span class="cell__sym">${e.symbol}</span>` +
          `<span class="cell__name">${e.name}</span>` +
          `<span class="cell__mass">${ru(e.mass)}</span>`;
        cells.set(r + ',' + c, cell);
        frag.appendChild(cell);
      } else {
        const ph = ELEMENTS_PLACEHOLDERS[r];
        if (ph && ph.col === c) {
          const cell = document.createElement('div');
          cell.className = 'cell cell--f';
          cell.textContent = ph.text;
          cell.style.cssText = 'display:grid;place-items:center;font-size:9px;color:#8b90a0;cursor:pointer';
          cell.title = 'Перейти к строке лантаноидов / актиноидов';
          cell.addEventListener('click', () => {
            const target = cells.get(ph.to + ',' + c);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              target.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
                { duration: 700 }
              );
            }
          });
          frag.appendChild(cell);
        } else if (r === 8 || r === 9) {
          frag.appendChild(Object.assign(document.createElement('div'), { className: 'cell cell--f' }));
        } else {
          frag.appendChild(Object.assign(document.createElement('div'), { className: 'cell cell--f' }));
        }
      }
    }
  }
  ptable.appendChild(frag);

  /* ---------------- Подсказки ---------------- */

  const ORIGINS = { primordial: 'Примордиальный', decay: 'Образуется при распаде', synthetic: 'Синтетический' };

  function tipHtml(e) {
    const cat = CATEGORIES[e.category].name;
    const mag = e.magnetism ? MAGNETISM[e.magnetism].name : 'нет данных';
    const cur = stateAt(e, ui.temp) || 'неизвестно';
    return `<b>${e.name}</b> · ${e.symbol} · ${e.nameEn}
      <div class="hint__grid">
        <span>Номер</span><span>${e.z}</span>
        <span>Масса</span><span>${ru(e.mass)}</span>
        <span>Конфигурация</span><span>${e.config}</span>
        <span>Период / группа</span><span>${e.period} / ${e.group}</span>
        <span>Категория</span><span>${cat}</span>
        <span>Происхождение</span><span>${ORIGINS[e.origin]}</span>
        <span>Радиоактивность</span><span>${e.radioactive ? 'радиоактивен' : 'имеет стабильные изотопы'}</span>
        <span>Магнетизм</span><span>${mag}</span>
        <span>t плавления</span><span>${e.melt == null ? '—' : e.melt + ' °C'}</span>
        <span>t кипения</span><span>${e.boil == null ? '—' : e.boil + ' °C'}</span>
        <span>Плотность</span><span>${e.density == null ? '—' : ru(e.density) + ' г/см³'}</span>
        <span>При ${ui.temp} °C</span><span>${cur}</span>
      </div>`;
  }

  ptable.addEventListener('mouseover', e => {
    const cell = e.target.closest('.cell[data-z]');
    if (cell) Tooltip.show(tipHtml(BY_Z.get(+cell.dataset.z)), e.clientX, e.clientY);
  });
  ptable.addEventListener('mousemove', e => {
    if (Tooltip.visible) {
      const cell = e.target.closest('.cell[data-z]');
      if (cell) Tooltip.show(tipHtml(BY_Z.get(+cell.dataset.z)), e.clientX, e.clientY);
    }
  });
  ptable.addEventListener('mouseout', e => {
    if (e.target.closest('.cell[data-z]')) Tooltip.hide();
  });

  /* ---------------- Раскраска ---------------- */

  const STATE_RGB = {
    'Газ': hexToRgb('#3b82f6'),
    'Жидкость': hexToRgb('#22d3ee'),
    'Твёрдое': hexToRgb('#f59e0b'),
    'Нет данных': hexToRgb('#3a3a44')
  };
  const STATE_COLORS = {
    'Газ': '#3b82f6', 'Жидкость': '#22d3ee', 'Твёрдое': '#f59e0b', 'Нет данных': '#3a3a44'
  };

  /* Относительная яркость по WCAG — для выбора контрастного цвета текста. */
  function relLuminance(rgb) {
    const a = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  const toRgb = c => c.startsWith('rgb') ? c.match(/[0-9]+/g).map(Number) : hexToRgb(c);

  /* Минимальный контраст, при котором подпись считается читаемой (WCAG AA). */
  const AA = 4.5;

  /**
   * Подбирает цвета подписей ячейки: основной — с максимальным контрастом
   * к фону, приглушённый — самый тусклый из возможных, но не ниже AA.
   */
  function inkFor(bgColor) {
    const bg = toRgb(bgColor);
    const bgL = relLuminance(bg);

    const INK_DARK = [11, 11, 18], INK_LIGHT = [244, 246, 250];
    const fg = contrast(bgL, relLuminance(INK_DARK)) >= contrast(bgL, relLuminance(INK_LIGHT))
      ? INK_DARK : INK_LIGHT;

    let fg2 = fg;
    for (let i = 0; i < 12; i++) {
      const dimmer = fg.map((v, k) => Math.round(v * 0.88 + bg[k] * 0.12));
      if (contrast(bgL, relLuminance(dimmer)) < AA) break;
      fg2 = dimmer;
    }

    return {
      fg: `rgb(${fg[0]},${fg[1]},${fg[2]})`,
      fg2: `rgb(${fg2[0]},${fg2[1]},${fg2[2]})`,
      border: contrast(bgL, relLuminance(fg)) >= 6 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.28)'
    };
  }

  const bestInk = bg => {
    const l = relLuminance(bg);
    return Math.max(contrast(l, relLuminance([11, 11, 18])), contrast(l, relLuminance([244, 246, 250])));
  };

  /**
   * Есть узкая «мёртвая зона» яркости, где ни чёрный, ни белый текст
   * не набирает AA. Сдвигаем фон к чёрному или белому настолько, насколько
   * потребуется: изменение на пару единиц RGB глазом не заметно,
   * зато подпись всегда читаема.
   */
  function makeReadable(rgb) {
    if (bestInk(rgb) >= AA) return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    const toBlack = relLuminance(rgb) > 0.179;
    for (let step = 1; step <= 200; step++) {
      const t = step / 200;
      const bg = rgb.map(v => Math.round(toBlack ? v * (1 - t) : v + (255 - v) * t));
      if (bestInk(bg) >= AA) return `rgb(${bg[0]},${bg[1]},${bg[2]})`;
    }
    return `rgb(${toBlack ? 0 : 255},${toBlack ? 0 : 255},${toBlack ? 0 : 255})`;
  }

  function colorFor(e) {
    if (ui.mode === 'state') return makeReadable(STATE_RGB[stateAt(e, ui.temp) || 'Нет данных']);
    if (ui.mode === 'stp') return makeReadable(STATE_RGB[stateAt(e, 0) || 'Нет данных']);
    if (ui.mode === 'category') return makeReadable(hexToRgb(CATEGORIES[e.category].color));
    const st = statsFor(ui.property);
    if (!st) return makeReadable(hexToRgb('#22222a'));
    const t = normalize(e[ui.property], st.min, st.max, ui.log);
    if (t == null) return makeReadable(hexToRgb('#22222a'));
    return makeReadable(toRgb(scaleColor(t, ui.scale)));
  }

  function matchFilter(e) {
    if (!ui.filters.size) return true;
    for (const f of ui.filters) {
      const [kind, value] = f.split(':');
      if (kind === 'cat' && e.category !== value) return false;
      if (kind === 'origin' && e.origin !== value) return false;
      if (kind === 'mag' && (e.magnetism || 'none') !== value) return false;
      if (kind === 'stable' && (e.radioactive ? 'radio' : 'stable') !== value) return false;
    }
    return true;
  }

  function paint() {
    let shown = 0;
    for (const [, cell] of cells) {
      const e = BY_Z.get(+cell.dataset.z);
      const color = colorFor(e);
      const ink = inkFor(color);
      cell.style.background = color;
      cell.style.setProperty('--fg', ink.fg);
      cell.style.setProperty('--fg-2', ink.fg2);
      cell.style.borderColor = ink.border;
      const ok = matchFilter(e);
      cell.classList.toggle('is-dim', !ok);
      if (ok) shown++;
    }
    const counter = $('countNote');
    if (counter) counter.textContent = `Показано ${shown} из ${ELEMENTS.length}`;
  }

  /* ---------------- Фильтры ---------------- */

  const FILTER_GROUPS = [
    { kind: 'origin', items: [['primordial', 'Примордиальные'], ['decay', 'Из распада'], ['synthetic', 'Синтетические']] },
    { kind: 'stable', items: [['stable', 'Стабильные'], ['radio', 'Радиоактивные']] },
    { kind: 'cat', items: Object.entries(CATEGORIES).map(([k, v]) => [k, v.name]) },
    { kind: 'mag', items: [['d', 'Диамагнитные'], ['p', 'Парамагнитные'], ['f', 'Ферромагнитные']] }
  ];

  $('catFilter').innerHTML = FILTER_GROUPS.map(g => `
    <div class="chips" data-kind="${g.kind}">
      ${g.items.map(([v, label]) => `
        <div class="chip" data-value="${v}"
             style="--chip-color:${g.kind === 'cat' ? CATEGORIES[v].color : '#33ccff'}">${label}</div>`).join('')}
    </div>`).join('');

  $('catFilter').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const key = chip.parentElement.dataset.kind + ':' + chip.dataset.value;
    if (ui.filters.has(key)) ui.filters.delete(key);
    else ui.filters.add(key);
    chip.classList.toggle('is-on', ui.filters.has(key));
    paint();
  });

  /* ---------------- Выбор свойства и шкалы ---------------- */

  $('propSelect').innerHTML = PROPERTIES.map(p =>
    `<option value="${p.key}">${p.name}${p.unit ? ' (' + p.unit + ')' : ''}</option>`).join('');

  $('propSelect').addEventListener('change', e => {
    ui.property = e.target.value;
    ui.mode = 'property';
    paint();
    renderLegend();
  });

  $('scaleSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    [...e.currentTarget.children].forEach(x => x.classList.toggle('is-on', x === b));
    ui.scale = b.dataset.scale;
    paint();
    renderLegend();
  });

  $('logSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    [...e.currentTarget.children].forEach(x => x.classList.toggle('is-on', x === b));
    ui.log = b.dataset.log === '1';
    paint();
    renderLegend();
  });

  $('resetView').addEventListener('click', () => {
    ui.filters.clear();
    [...document.querySelectorAll('#catFilter .chip')].forEach(c => c.classList.remove('is-on'));
    ui.mode = 'category';
    ui.property = 'melt';
    ui.scale = 'inferno';
    ui.log = false;
    ui.temp = 0;
    $('propSelect').value = 'melt';
    $('temp').value = 0;
    [...$('scaleSeg').children].forEach((x, i) => x.classList.toggle('is-on', i === 0));
    [...$('logSeg').children].forEach((x, i) => x.classList.toggle('is-on', i === 0));
    paint(); renderLegend(); updateStates(); renderDetail(current);
  });

  /* ---------------- Температура ---------------- */

  $('temp').addEventListener('input', e => {
    ui.temp = +e.target.value;
    $('tempVal').textContent = ui.temp + ' °C';
    if (ui.mode === 'state') { paint(); renderLegend(); }
    updateStates();
    renderDetail(current);
  });

  function updateStates() {
    const count = { 'Газ': 0, 'Жидкость': 0, 'Твёрдое': 0, 'Нет данных': 0 };
    for (const e of ELEMENTS) count[stateAt(e, ui.temp) || 'Нет данных']++;
    for (const s of $('states').children) {
      const key = s.dataset.state;
      s.classList.add('is-on');
      s.textContent = key === 'Нет данных'
        ? 'Нет данных'
        : `${key} — ${count[key]}`;
    }
    for (const s of $('stp').children) {
      const key = s.dataset.state;
      const n = ELEMENTS.filter(e => (stateAt(e, 0) || 'Нет данных') === key).length;
      s.classList.toggle('is-on', key === 'Жидкость');
      s.textContent = key === 'Нет данных' ? 'Нет данных' : `${key} — ${n}`;
    }
  }

  /* Легенда агрегатных состояний: клик переключает режим подсветки */
  $('states').addEventListener('click', () => { ui.mode = 'state'; paint(); renderLegend(); });
  $('stp').addEventListener('click', () => { ui.mode = 'stp'; paint(); renderLegend(); });

  /* ---------------- Легенда ---------------- */

  function renderLegend() {
    const box = $('legendBox');
    const title = $('legendTitle');
    if (ui.mode === 'property') {
      const p = PROPERTIES.find(x => x.key === ui.property);
      const st = statsFor(ui.property);
      title.textContent = `${p.name}${p.unit ? ', ' + p.unit : ''}`;
      const gradient = SCALES[ui.scale].map((c, i) =>
        `${c} ${(i / (SCALES[ui.scale].length - 1) * 100).toFixed(1)}%`).join(',');
      box.innerHTML = `
        <div class="scale" style="background:linear-gradient(to right,${gradient})"></div>
        <div class="scale__labels">
          <span>${fmt(st.min)}${p.unit && p.unit !== '%' ? ' ' + p.unit : ''}</span>
          <span>${ui.log ? 'логарифмическая шкала' : 'линейная шкала'}</span>
          <span>${fmt(st.max)}${p.unit && p.unit !== '%' ? ' ' + p.unit : ''}</span>
        </div>`;
    } else if (ui.mode === 'category') {
      title.textContent = 'Цвет по категории элемента';
      box.innerHTML = `<div class="chips">${Object.entries(CATEGORIES).map(([k, v]) =>
        `<div class="chip" style="--chip-color:${v.color};pointer-events:none">${v.name}</div>`).join('')}</div>`;
    } else {
      const label = ui.mode === 'state' ? `Агрегатное состояние при ${ui.temp} °C` : 'Агрегатное состояние при НУП';
      title.textContent = label;
      box.innerHTML = `<div class="chips">${Object.entries(STATE_COLORS).map(([k, c]) =>
        `<div class="chip" style="--chip-color:${c};pointer-events:none">${k}</div>`).join('')}</div>`;
    }
  }

  /* ---------------- Карточка выбранного элемента ---------------- */

  let current = 26;

  function renderDetail(e) {
    if (!e) return;
    const cat = CATEGORIES[e.category].name;
    const mag = e.magnetism ? MAGNETISM[e.magnetism].name : 'нет данных';
    const row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
    $('detail').innerHTML = `
      <div class="cardbox">
        <h2 class="cardbox__title">${e.name} · <span class="mono" style="color:#33ccff">${e.symbol}</span>
          <small>${e.nameEn} · №${e.z}</small></h2>
        <dl class="kv">
          ${row('Атомная масса', ru(e.mass))}
          ${row('Конфигурация', e.config)}
          ${row('Период / группа', `${e.period} / ${e.group}`)}
          ${row('Категория', cat)}
          ${row('Происхождение', ORIGINS[e.origin])}
          ${row('Радиоактивность', e.radioactive ? 'радиоактивен' : 'стабильные изотопы')}
          ${row('Магнитные свойства', mag)}
        </dl>
        <a class="btn btn--wide" style="margin-top:14px;text-decoration:none" href="index.html">
          Открыть 3D-модель →
        </a>
      </div>

      <div class="cardbox">
        <h2 class="cardbox__title">Физические свойства</h2>
        <dl class="kv">
          ${row('t плавления', e.melt == null ? '—' : e.melt + ' °C')}
          ${row('t кипения', e.boil == null ? '—' : e.boil + ' °C')}
          ${row('Плотность', e.density == null ? '—' : ru(e.density) + ' г/см³')}
          ${row('Электроотрицательность', e.electronegativity ?? '—')}
          ${row('Энергия ионизации', e.ionization == null ? '—' : e.ionization + ' эВ')}
          ${row('Сродство к электрону', e.electronAffinity == null ? '—' : e.electronAffinity + ' эВ')}
          ${row('Атомный радиус', e.radius == null ? '—' : e.radius + ' пм')}
          ${row('Состояние при ' + ui.temp + ' °C', stateAt(e, ui.temp) || '—')}
          ${row('Состояние при НУП', stateAt(e, 0) || '—')}
        </dl>
      </div>`;

    for (const [, cell] of cells) {
      cell.classList.toggle('is-picked', +cell.dataset.z === e.z);
    }
  }

  ptable.addEventListener('click', e => {
    const cell = e.target.closest('.cell[data-z]');
    if (!cell) return;
    current = +cell.dataset.z;
    renderDetail(BY_Z.get(current));
    history.replaceState(null, '', `?z=${current}`);
  });

  ptable.addEventListener('dblclick', e => {
    const cell = e.target.closest('.cell[data-z]');
    if (cell) location.href = `index.html?z=${cell.dataset.z}`;
  });

  document.addEventListener('keydown', e => {
    if (e.target.matches('input, select')) return;
    if (e.key === 'ArrowRight') current = Math.min(118, current + 1);
    else if (e.key === 'ArrowLeft') current = Math.max(1, current - 1);
    else return;
    renderDetail(BY_Z.get(current));
    const cell = cells.get(BY_Z.get(current).row + ',' + BY_Z.get(current).col);
    cell?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------------- Старт ---------------- */

  const zParam = +new URLSearchParams(location.search).get('z');
  current = BY_Z.has(zParam) ? zParam : 26;
  $('tempVal').textContent = '0 °C';
  paint();
  renderLegend();
  updateStates();
  renderDetail(BY_Z.get(current));
})();
