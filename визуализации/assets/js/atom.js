/* ============================================================
   3D-модель атома: ядро (протоны + нейтроны) и электронные оболочки
   ============================================================ */

(function () {
  'use strict';

  const host = document.getElementById('scene');
  if (!host || typeof THREE === 'undefined') {
    const fb = document.getElementById('fallback');
    if (fb) fb.hidden = false;
    return;
  }

  const MAX_COUNT = 300;
  const COLORS = { proton: 0xff554d, neutron: 0xaaaaaa, electron: 0x33ccff };
  const ru = v => (+v).toFixed(3).replace('.', ',');

  const state = {
    protons: 22,
    neutrons: 26,
    electrons: 22,
    speed: 30,
    z: 22
  };

  /* ---------------- Рендер ---------------- */

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(5, 6, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88bbff, 0.4);
  fill.position.set(-6, -3, -5);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const nucleusGroup = new THREE.Group();
  const shellGroup = new THREE.Group();
  root.add(nucleusGroup, shellGroup);

  /* ---------------- Камера / управление ---------------- */

  const cam = { theta: 0.5, phi: 0.35, dist: 46, target: new THREE.Vector3() };

  function applyCamera() {
    cam.phi = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, cam.phi));
    cam.dist = Math.max(12, Math.min(160, cam.dist));
    camera.position.set(
      cam.target.x + cam.dist * Math.cos(cam.phi) * Math.sin(cam.theta),
      cam.target.y + cam.dist * Math.sin(cam.phi),
      cam.target.z + cam.dist * Math.cos(cam.phi) * Math.cos(cam.theta)
    );
    camera.lookAt(cam.target);
  }

  function resetView() {
    cam.theta = 0.5; cam.phi = 0.35; cam.dist = 46;
    shake = 0;
  }

  let dragging = false;
  let lastX = 0, lastY = 0, pinch = 0;
  let shake = 0;

  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.style.cursor = 'grab';

  el.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
  });

  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    cam.theta -= (e.clientX - lastX) * 0.006;
    cam.phi += (e.clientY - lastY) * 0.006;
    lastX = e.clientX; lastY = e.clientY;
  });

  const endDrag = () => { dragging = false; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  el.addEventListener('wheel', e => {
    e.preventDefault();
    cam.dist *= 1 + Math.sign(e.deltaY) * 0.09;
  }, { passive: false });

  el.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (pinch) cam.dist *= pinch / d;
    pinch = d;
  }, { passive: true });

  el.addEventListener('touchend', () => { pinch = 0; });

  /* ---------------- Ядро ---------------- */

  const protonMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshStandardMaterial({ color: COLORS.proton, roughness: 0.42, metalness: 0.05 }),
    MAX_COUNT
  );
  const neutronMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshStandardMaterial({ color: COLORS.neutron, roughness: 0.55, metalness: 0.05 }),
    MAX_COUNT
  );
  protonMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  neutronMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  protonMesh.frustumCulled = false;
  neutronMesh.frustumCulled = false;
  nucleusGroup.add(protonMesh, neutronMesh);

  const dummy = new THREE.Object3D();
  let nucleons = [];   // {x,y,z,vx,vy,vz,type}

  function buildNucleus() {
    const total = state.protons + state.neutrons;
    nucleons = [];
    if (!total) { protonMesh.count = 0; neutronMesh.count = 0; return; }

    const R = 1.5 * Math.cbrt(total);
    const minDist = 1.7;

    for (let i = 0; i < total; i++) {
      let px = 0, py = 0, pz = 0, ok = false;
      for (let attempt = 0; attempt < 220 && !ok; attempt++) {
        const u = Math.random(), v = Math.random(), w = Math.random();
        const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1), r = R * Math.cbrt(w);
        px = r * Math.sin(phi) * Math.cos(theta);
        py = r * Math.sin(phi) * Math.sin(theta);
        pz = r * Math.cos(phi);
        ok = nucleons.every(n =>
          (px - n.x) ** 2 + (py - n.y) ** 2 + (pz - n.z) ** 2 > minDist * minDist);
      }
      nucleons.push({
        x: px, y: py, z: pz,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        vz: (Math.random() - 0.5) * 0.06,
        type: i < state.protons ? 'p' : 'n'
      });
    }
  }

  function updateNucleons(dt) {
    const total = nucleons.length;
    if (!total) return;
    const R = 1.5 * Math.cbrt(total);
    const minDist = 1.55;
    const k = 0.35;

    for (const n of nucleons) {
      n.x += n.vx * dt * 60;
      n.y += n.vy * dt * 60;
      n.z += n.vz * dt * 60;
    }

    // мягкое «расталкивание» соседей
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        const a = nucleons[i], b = nucleons[j];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > minDist * minDist || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        const push = (minDist - d) * 0.5 * k;
        const ux = dx / d, uy = dy / d, uz = dz / d;
        a.x -= ux * push; a.y -= uy * push; a.z -= uz * push;
        b.x += ux * push; b.y += uy * push; b.z += uz * push;
      }
    }

    // удержание внутри сферы ядра + броуновское движение
    for (const n of nucleons) {
      const r = Math.hypot(n.x, n.y, n.z);
      if (r > R) {
        n.x *= R / r; n.y *= R / r; n.z *= R / r;
        n.vx *= -0.4; n.vy *= -0.4; n.vz *= -0.4;
      }
      n.vx += (Math.random() - 0.5) * 0.045;
      n.vy += (Math.random() - 0.5) * 0.045;
      n.vz += (Math.random() - 0.5) * 0.045;
      const v = Math.hypot(n.vx, n.vy, n.vz);
      if (v > 0.09) { n.vx *= 0.09 / v; n.vy *= 0.09 / v; n.vz *= 0.09 / v; }
    }

    let p = 0, q = 0;
    for (const n of nucleons) {
      dummy.position.set(n.x, n.y, n.z);
      dummy.rotation.set(n.x, n.y, n.z);
      dummy.updateMatrix();
      if (n.type === 'p') protonMesh.setMatrixAt(p++, dummy.matrix);
      else neutronMesh.setMatrixAt(q++, dummy.matrix);
    }
    protonMesh.count = p;
    neutronMesh.count = q;
    protonMesh.instanceMatrix.needsUpdate = true;
    neutronMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------------- Электронные оболочки ---------------- */

  const electronGeom = new THREE.SphereGeometry(0.85, 14, 10);
  const electronMat = new THREE.MeshStandardMaterial({
    color: COLORS.electron, emissive: 0x0a5f7a, emissiveIntensity: 1, roughness: 0.3
  });
  const ringMat = new THREE.LineBasicMaterial({ color: 0x2a7f9e, transparent: true, opacity: 0.35 });
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x1c5f78, transparent: true, opacity: 0.10 });

  let orbits = [];   // {radius, count, group, electrons:[{angle,inc,node,speed}]}

  function shellRadii(count) {
    // Бор-модель: радиусы слоёв растут неравномерно, как в реальных расчётах
    return Array.from({ length: count }, (_, i) => 9 + i * 4.2 + (i > 1 ? i * 0.55 : 0));
  }

  function buildOrbits() {
    while (shellGroup.children.length) {
      const child = shellGroup.children.pop();
      child.geometry?.dispose?.();
      shellGroup.remove(child);
    }
    orbits = [];

    let electrons = Math.max(0, Math.min(MAX_COUNT, state.electrons));
    if (!electrons) return;

    // Слои заполняются по правилу 2n²
    const counts = [];
    let rest = electrons;
    for (let n = 1; rest > 0; n++) {
      const cap = 2 * n * n;
      const take = Math.min(cap, rest);
      counts.push(take);
      rest -= take;
      if (n > 7) break;
    }
    const radii = shellRadii(counts.length);

    counts.forEach((count, i) => {
      const radius = radii[i];
      const group = new THREE.Group();

      const points = [];
      for (let a = 0; a <= 128; a++) {
        const t = (a / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ringMat));

      const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.12, 6, 128), orbitMat);
      torus.rotation.x = -Math.PI / 2;
      group.add(torus);

      const list = [];
      for (let k = 0; k < count; k++) {
        const mesh = new THREE.Mesh(electronGeom, electronMat);
        group.add(mesh);
        list.push({
          mesh,
          angle: (k / count) * Math.PI * 2 + Math.random() * 0.2,
          inc: (Math.random() - 0.5) * 0.5,          // наклон плоскости
          node: Math.random() * Math.PI * 2,          // долгота
          speed: (0.55 + Math.random() * 0.35) / Math.cbrt(i + 1)
        });
      }
      shellGroup.add(group);
      orbits.push({ radius, count, group, electrons: list });
    });
  }

  const v3 = new THREE.Vector3();

  function updateOrbits(dt) {
    const scale = 0.25 + (state.speed / 100) * 3.4;
    for (const orbit of orbits) {
      const { radius, electrons } = orbit;
      for (const e of electrons) {
        e.angle += e.speed * scale * dt;
        const x = Math.cos(e.angle) * radius;
        const z = Math.sin(e.angle) * radius;
        v3.set(x, 0, z);
        v3.applyAxisAngle(new THREE.Vector3(1, 0, 0), e.inc);
        v3.applyAxisAngle(new THREE.Vector3(0, 1, 0), e.node);
        e.mesh.position.copy(v3);
      }
      orbit.group.rotation.y += dt * 0.05 * scale;
    }
  }

  /* ---------------- Размер сцены ---------------- */

  function resize() {
    const w = host.clientWidth || innerWidth;
    const h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px';
    renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  /* ---------------- Интерфейс ---------------- */

  const $ = id => document.getElementById(id);
  const card = $('card'), cZ = $('cZ'), cConfig = $('cConfig'), cSym = $('cSym'),
        cName = $('cName'), cMass = $('cMass'), mSym = $('mSym'), mName = $('mName'),
        esDisplay = $('esDisplay'), esList = $('esList'), esName = $('esName');

  function detailHtml(e) {
    const cat = CATEGORIES[e.category].name;
    const mag = e.magnetism ? MAGNETISM[e.magnetism].name : 'нет данных';
    return `<b>${e.name}</b> · ${e.nameEn} · ${e.symbol}
      <div class="hint__grid">
        <span>Атомный номер</span><span>${e.z}</span>
        <span>Атомная масса</span><span>${ru(e.mass)}</span>
        <span>Конфигурация</span><span>${e.config}</span>
        <span>Категория</span><span>${cat}</span>
        <span>Магнитные свойства</span><span>${mag}</span>
        <span>Период / группа</span><span>${e.period} / ${e.group}</span>
      </div>
      <div style="margin-top:6px;color:#8b90a0">Нажмите, чтобы открыть в таблице</div>`;
  }

  function selectElement(z, skipSync) {
    const e = BY_Z.get(z);
    if (!e) return;
    state.z = z;
    state.protons = e.z;
    state.neutrons = Math.max(0, Math.round(e.mass) - e.z);
    state.electrons = e.z;

    cZ.textContent = e.z;
    cConfig.textContent = e.config;
    cSym.textContent = e.symbol;
    cName.textContent = e.name;
    cMass.textContent = ru(e.mass);
    mSym.textContent = e.symbol;
    mName.textContent = e.name;
    esName.textContent = e.name;
    card.setAttribute('aria-label', `Подробнее об элементе ${e.name}`);
    document.title = `${e.name} (${e.symbol}) — Анимация атома`;
    history.replaceState(null, '', `?z=${z}`);

    if (!skipSync) { buildNucleus(); buildOrbits(); syncCounters(); }
  }

  function syncCounters() {
    legend.querySelectorAll('input').forEach(inp => {
      const key = inp.dataset.key;
      if (document.activeElement !== inp) inp.value = state[key];
    });
  }

  /* --- счётчики частиц --- */
  const legend = $('legend');
  const PARTICLES = [
    { key: 'protons',   name: 'Протоны',   color: COLORS.proton },
    { key: 'neutrons',  name: 'Нейтроны',  color: COLORS.neutron },
    { key: 'electrons', name: 'Электроны', color: COLORS.electron }
  ];

  legend.innerHTML = PARTICLES.map(p => `
    <div class="pcounter">
      <div class="pcounter__dot" style="background:#${p.color.toString(16).padStart(6, '0')}"></div>
      <span class="pcounter__name">${p.name}</span>
      <div class="pcounter__box">
        <button class="pcounter__btn" data-key="${p.key}" data-step="-1" aria-label="Убрать">−</button>
        <input class="pcounter__input mono" type="number" min="0" max="${MAX_COUNT}"
               data-key="${p.key}" value="${state[p.key]}" aria-label="${p.name}">
        <button class="pcounter__btn" data-key="${p.key}" data-step="1" aria-label="Добавить">+</button>
      </div>
    </div>`).join('');

  legend.addEventListener('click', e => {
    const btn = e.target.closest('.pcounter__btn');
    if (!btn) return;
    const key = btn.dataset.key;
    setCount(key, state[key] + Number(btn.dataset.step));
  });

  legend.addEventListener('input', e => {
    const inp = e.target.closest('.pcounter__input');
    if (!inp) return;
    setCount(inp.dataset.key, inp.value, true);
  });

  function setCount(key, value, raw) {
    let v = raw ? parseInt(value, 10) : value;
    if (isNaN(v)) v = 0;
    state[key] = Math.max(0, Math.min(MAX_COUNT, v));
    if (key === 'protons' || key === 'neutrons') buildNucleus();
    else buildOrbits();
    syncCounters();
  }

  /* --- выбор элемента --- */
  esList.innerHTML =
    '<input class="eselect__search mono" type="text" placeholder="Поиск: имя, символ, номер">' +
    ELEMENTS.map(e => `
      <div class="eselect__item" role="option" data-z="${e.z}">
        <span class="eselect__item-z">${e.z}</span>
        <span class="eselect__item-sym">${e.symbol}</span>
        <span>${e.name}</span>
      </div>`).join('');

  function toggleList(open) {
    esList.classList.toggle('is-open', open);
    esDisplay.setAttribute('aria-expanded', String(open));
    if (open) {
      const input = esList.querySelector('.eselect__search');
      input.value = '';
      filterList('');
      setTimeout(() => input.focus(), 0);
    }
  }

  function filterList(q) {
    const needle = q.trim().toLowerCase();
    esList.querySelectorAll('.eselect__item').forEach(item => {
      const e = BY_Z.get(+item.dataset.z);
      const hit = !needle ||
        e.name.toLowerCase().includes(needle) ||
        e.nameEn.toLowerCase().includes(needle) ||
        e.symbol.toLowerCase().includes(needle) ||
        String(e.z) === needle;
      item.style.display = hit ? '' : 'none';
    });
  }

  esDisplay.addEventListener('click', () => toggleList(!esList.classList.contains('is-open')));

  esList.addEventListener('input', e => {
    if (e.target.matches('.eselect__search')) filterList(e.target.value);
  });

  esList.addEventListener('click', e => {
    const item = e.target.closest('.eselect__item');
    if (!item) return;
    selectElement(+item.dataset.z);
    toggleList(false);
  });

  document.addEventListener('click', e => {
    if (!esList.classList.contains('is-open')) return;
    if (!e.target.closest('#eselect')) toggleList(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && esList.classList.contains('is-open')) {
      toggleList(false);
      esDisplay.focus();
    }
  });

  const step = d => selectElement(Math.max(1, Math.min(118, state.z + d)));
  $('nextBtn').addEventListener('click', () => step(1));
  $('prevBtn').addEventListener('click', () => step(-1));

  /* --- скорость, встряхивание, сброс --- */
  const speed = $('speed');
  speed.addEventListener('input', () => { state.speed = +speed.value; });
  $('shakeBtn').addEventListener('click', () => {
    shake = 1;
    for (const n of nucleons) {
      n.vx += (Math.random() - 0.5) * 1.4;
      n.vy += (Math.random() - 0.5) * 1.4;
      n.vz += (Math.random() - 0.5) * 1.4;
    }
  });
  $('resetBtn').addEventListener('click', resetView);

  /* --- переход в таблицу --- */
  card.addEventListener('click', () => { location.href = `periodic-table.html?z=${state.z}`; });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });

  Tooltip.bind(card, () => detailHtml(BY_Z.get(state.z)));

  document.addEventListener('keydown', e => {
    if (e.target.matches('input')) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') step(-1);
  });

  /* ---------------- Цикл рендера ---------------- */

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (shake > 0) {
      shake = Math.max(0, shake - dt * 2.2);
      root.position.set(
        (Math.random() - 0.5) * shake * 3,
        (Math.random() - 0.5) * shake * 3,
        (Math.random() - 0.5) * shake * 3
      );
    } else if (root.position.lengthSq() > 1e-6) {
      root.position.multiplyScalar(0.85);
    }

    nucleusGroup.rotation.y += dt * 0.25 * (state.speed / 100 + 0.2);
    nucleusGroup.rotation.x += dt * 0.06;

    updateNucleons(dt);
    updateOrbits(dt);
    applyCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  /* ---------------- Старт ---------------- */

  resize();
  const zParam = +new URLSearchParams(location.search).get('z');
  selectElement(BY_Z.has(zParam) ? zParam : 22);
  applyCamera();
  requestAnimationFrame(frame);
})();
