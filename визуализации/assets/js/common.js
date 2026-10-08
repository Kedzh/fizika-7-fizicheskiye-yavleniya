/* ============================================================
   Общие скрипты: меню, всплывающие подсказки, мелкие утилиты
   ============================================================ */

const NAV = [
  { href: 'index.html',            title: 'Модель атома',      icon: 'atom' },
  { href: 'periodic-table.html',   title: 'Периодическая таблица', icon: 'table' },
  { href: 'statistics.html',       title: 'Статистика',       icon: 'chart' }
];

const ICONS = {
  atom: '<path d="M12 12v.01"></path><path d="M19.071 4.929c-1.562-1.562-6 .337-9.9 4.243c-3.905 3.905-5.804 8.337-4.242 9.9c1.562 1.561 6-.338 9.9-4.244c3.905-3.905 5.804-8.337 4.242-9.9"></path><path d="M4.929 4.929c-1.562 1.562.337 6 4.243 9.9c3.905 3.905 8.337 5.804 9.9 4.242c1.561-1.562-.338-6-4.244-9.9c-3.905-3.905-8.337-5.804-9.9-4.242"></path>',
  table: '<rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="2" y1="9" x2="22" y2="9"></line><line x1="2" y1="15" x2="22" y2="15"></line><line x1="8" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="16" y2="15"></line>',
  chart: '<path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path>'
};

function svgIcon(name, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

/** Рисует боковое меню и подсвечивает активный пункт. */
function buildNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="side">
      <nav class="side__nav">
        ${NAV.map(item => `
          <a class="side__btn${item.href === current ? ' is-active' : ''}"
             href="${item.href}" title="${item.title}" aria-label="${item.title}">
            ${svgIcon(item.icon)}
          </a>`).join('')}
      </nav>
      <div class="side__label">Анимация атома</div>
    </div>`;
  document.body.prepend(host);
}

/* ---------- Всплывающая подсказка ---------- */

const Tooltip = (() => {
  let el = null;
  let timer = null;

  function ensure() {
    if (!el) {
      el = document.createElement('div');
      el.className = 'hint';
      document.body.appendChild(el);
    }
    return el;
  }

  function show(html, x, y) {
    const node = ensure();
    node.innerHTML = html;
    node.classList.add('is-visible');
    const r = node.getBoundingClientRect();
    let left = x - r.width / 2;
    let top = y - r.height - 14;
    left = Math.max(8, Math.min(left, innerWidth - r.width - 8));
    if (top < 8) top = y + 20;
    node.style.left = left + 'px';
    node.style.top = top + 'px';
  }

  function hide() {
    clearTimeout(timer);
    if (el) el.classList.remove('is-visible');
  }

  /** Навешивает подсказку на элемент с задержкой. */
  function bind(target, html) {
    target.addEventListener('mouseenter', e => {
      clearTimeout(timer);
      timer = setTimeout(() => show(typeof html === 'function' ? html() : html, e.clientX, e.clientY), 260);
    });
    target.addEventListener('mousemove', e => {
      if (el && el.classList.contains('is-visible')) show(typeof html === 'function' ? html() : html, e.clientX, e.clientY);
    });
    target.addEventListener('mouseleave', hide);
    target.addEventListener('click', hide);
  }

  return { show, hide, bind, get visible() { return !!el && el.classList.contains('is-visible'); } };
})();

/* ---------- Форматирование чисел ---------- */

const fmt = (v, digits = 2) => {
  if (v == null) return '—';
  const n = Number(v);
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  return n.toFixed(digits).replace(/[.,]?0+$/, '');
};

/**
 * Агрегатное состояние вещества при заданной температуре (°C).
 * Выше точки кипения — газ, между плавлением и кипением — жидкость,
 * ниже точки плавления — твёрдое вещество.
 */
function stateAt(element, tempC) {
  if (!element || element.melt == null || element.boil == null) return null;
  if (tempC >= element.boil) return 'Газ';
  if (tempC >= element.melt) return 'Жидкость';
  return 'Твёрдое';
}

document.addEventListener('DOMContentLoaded', buildNav);
