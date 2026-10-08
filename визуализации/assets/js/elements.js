/* ============================================================
   Данные химических элементов (1–118)
   Формат строки: Z|символ|рус.название|англ.название|масса|
                 категория|магнетизм|t.melting|t.boiling|ρ|
                 χ(Pauling)|I1(eV)|EA(eV)|R(pm)|доля во Вселенной(%)
   Пустая ячейка = нет данных
   ============================================================ */

const RAW_ELEMENTS = `
1|H|Водород|Hydrogen|1.008|nonmetal|p|-259.16|-252.87|0.00008988|2.2|13.598|0.754|53|74
2|He|Гелий|Helium|4.0026|noble|d|-272.2|-268.93|0.0001785||24.587|-0.5|31|24
3|Li|Литий|Lithium|6.94|alkali|p|180.5|1342|0.534|0.98|5.392|0.618|167|0.00002
4|Be|Бериллий|Beryllium|9.0122|alkaline|d|1287|2469|1.85|1.57|9.323|-0.5|112|
5|B|Бор|Boron|10.81|metalloid|p|2349|4200|2.34|2.04|8.298|0.277|87|
6|C|Углерод|Carbon|12.011|nonmetal|p|3550|4027|2.267|2.55|11.26|1.263|67|0.5
7|N|Азот|Nitrogen|14.007|nonmetal|p|-210|-195.79|0.0012506|3.04|14.534|-0.07|56|0.07
8|O|Кислород|Oxygen|15.999|nonmetal|p|-218.79|-182.95|0.001429|3.44|13.618|1.461|48|1
9|F|Фтор|Fluorine|18.998|halogen|p|-219.67|-188.11|0.001696|3.98|17.423|3.401|42|0.00004
10|Ne|Неон|Neon|20.18|noble|d|-248.59|-246.05|0.0008999||21.565|-1.2|38|0.13
11|Na|Натрий|Sodium|22.99|alkali|p|97.79|883|0.968|0.93|5.139|0.548|190|0.0002
12|Mg|Магний|Magnesium|24.305|alkaline|p|650|1091|1.738|1.31|7.646|-0.4|145|0.06
13|Al|Алюминий|Aluminum|26.982|post|p|660.32|2470|2.7|1.61|5.986|0.433|118|0.002
14|Si|Кремний|Silicon|28.085|metalloid|p|1414|3265|2.3296|1.9|8.152|1.39|111|0.06
15|P|Фосфор|Phosphorus|30.974|nonmetal|p|44.15|280.5|1.823|2.19|10.487|0.746|98|0.00005
16|S|Сера|Sulfur|32.06|nonmetal|p|115.21|444.6|2.07|2.58|10.36|2.077|88|0.04
17|Cl|Хлор|Chlorine|35.45|halogen|p|-101.5|-34.04|0.003214|3.16|12.968|3.613|79|0.0001
18|Ar|Аргон|Argon|39.95|noble|d|-189.34|-185.85|0.0017837||15.76|-1|71|0.0001
19|K|Калий|Potassium|39.098|alkali|p|63.5|759|0.862|0.82|4.341|0.501|243|0.0001
20|Ca|Кальций|Calcium|40.078|alkaline|d|842|1484|1.55|1|6.113|0.025|194|0.004
21|Sc|Скандий|Scandium|44.956|transition|d|1541|2836|2.985|1.36|6.561|0.188|184|0.00001
22|Ti|Титан|Titanium|47.867|transition|d|1668|3287|4.506|1.54|6.828|0.079|176|0.00003
23|V|Ванадий|Vanadium|50.942|transition|d|1910|3402|6.11|1.63|6.746|0.525|171|0.00001
24|Cr|Хром|Chromium|51.996|transition|p|1907|2671|7.15|1.66|6.767|0.666|166|0.0015
25|Mn|Марганец|Manganese|54.938|transition|p|1246|2061|7.21|1.55|7.434|-0.5|161|0.0001
26|Fe|Железо|Iron|55.845|transition|f|1538|2862|7.874|1.83|7.902|0.163|156|0.11
27|Co|Кобальт|Cobalt|58.933|transition|f|1495|2927|8.9|1.88|7.881|0.661|152|0.001
28|Ni|Никель|Nickel|58.693|transition|f|1455|2913|8.908|1.91|7.64|1.156|149|0.005
29|Cu|Медь|Copper|63.546|transition|p|1084.62|2562|8.96|1.9|7.726|1.235|145|0.00006
30|Zn|Цинк|Zinc|65.38|transition|d|419.53|907|7.134|1.65|9.394|-0.6|142|0.00002
31|Ga|Галлий|Gallium|69.723|post|d|29.76|2204|5.91|1.81|5.999|0.43|136|
32|Ge|Германий|Germanium|72.63|metalloid|d|938.25|2820|5.323|2.01|7.9|1.233|125|
33|As|Мышьяк|Arsenic|74.922|metalloid|d|1090|887|5.727|2.18|9.789|0.804|114|
34|Se|Селен|Selenium|78.971|nonmetal|d|221.93|685|4.81|2.55|9.752|2.021|103|
35|Br|Бром|Bromine|79.904|halogen|p|-7.2|58.8|3.1028|2.96|11.814|3.364|94|
36|Kr|Криптон|Krypton|83.798|noble|d|-157.37|-153.34|0.003733|3|14|-1|88|
37|Rb|Рубидий|Rubidium|85.468|alkali|p|39.31|688|1.532|0.82|4.177|0.486|265|
38|Sr|Стронций|Strontium|87.62|alkaline|d|777|1650|2.64|0.95|5.695|0.048|219|
39|Y|Иттрий|Yttrium|88.906|transition|d|1526|3338|4.472|1.22|6.217|0.307|212|
40|Zr|Цирконий|Zirconium|91.224|transition|d|1855|4409|6.52|1.33|6.634|0.427|206|
41|Nb|Ниобий|Niobium|92.906|transition|d|2477|4744|8.57|1.6|6.759|0.916|198|
42|Mo|Молибден|Molybdenum|95.95|transition|p|2623|4639|10.28|2.16|7.092|0.746|190|
43|Tc|Технеций|Technetium|98|transition|d|2157|4265|11.5|1.9|7.28|0.55|183|
44|Ru|Рутений|Ruthenium|101.07|transition|p|2334|4150|12.45|2.2|7.361|1.05|178|
45|Rh|Родий|Rhodium|102.91|transition|p|1964|3695|12.41|2.28|7.459|1.137|173|
46|Pd|Палладий|Palladium|106.42|transition|p|1555.62|2963|12.023|2.2|8.337|0.562|169|
47|Ag|Серебро|Silver|107.87|transition|p|961.78|2162|10.49|1.93|7.576|1.302|165|
48|Cd|Кадмий|Cadmium|112.41|transition|d|321.07|767|8.65|1.69|8.994|-0.7|161|
49|In|Индий|Indium|114.82|post|d|156.6|2072|7.31|1.78|5.786|0.3|156|
50|Sn|Олово|Tin|118.71|post|d|231.93|2602|7.287|1.96|7.344|1.112|145|
51|Sb|Сурьма|Antimony|121.76|metalloid|d|630.63|1587|6.685|2.05|8.608|1.047|133|
52|Te|Теллур|Tellurium|127.6|metalloid|d|449.51|988|6.232|2.1|9.01|1.971|123|
53|I|Иод|Iodine|126.9|halogen|p|113.7|184.3|4.933|2.66|10.451|3.059|115|
54|Xe|Ксенон|Xenon|131.29|noble|d|-111.8|-108.1|0.005894|2.6|12.13|-1|108|
55|Cs|Цезий|Caesium|132.91|alkali|p|28.5|671|1.93|0.79|3.894|0.472|298|
56|Ba|Барий|Barium|137.33|alkaline|d|727|1870|3.51|0.89|5.212|0.145|253|
57|La|Лантан|Lanthanum|138.91|lanthanide|d|920|3464|6.162|1.1|5.577|0.47|226|
58|Ce|Церий|Cerium|140.12|lanthanide|p|798|3443|6.77|1.12|5.539|0.65|210|
59|Pr|Празеодим|Praseodymium|140.91|lanthanide|p|931|3520|6.77|1.13|5.473|0.962|247|
60|Nd|Неодим|Neodymium|144.24|lanthanide|p|1024|3074|7.01|1.14|5.525|1.916|206|
61|Pm|Прометий|Promethium|145|lanthanide|p|1042|3000|7.26||5.582|0.129|205|
62|Sm|Самарий|Samarium|150.36|lanthanide|p|1072|1907|7.52|1.17|5.644|0.162|238|
63|Eu|Европий|Europium|151.96|lanthanide|p|826|1529|5.264|1.2|5.67|0.116|231|
64|Gd|Гадолиний|Gadolinium|157.25|lanthanide|p|1312|3546|7.9|1.2|6.15|0.137|233|
65|Tb|Тербий|Terbium|158.93|lanthanide|p|1356|3503|8.23|1.1|5.864|1.165|221|
66|Dy|Диспрозий|Dysprosium|162.5|lanthanide|p|1412|2840|8.54|1.22|5.939|0.352|229|
67|Ho|Гольмий|Holmium|164.93|lanthanide|p|1474|2993|8.79|1.23|6.022|0.338|216|
68|Er|Эрбий|Erbium|167.26|lanthanide|p|1529|3141|9.066|1.24|6.108|0.312|235|
69|Tm|Тулий|Thulium|168.93|lanthanide|p|1545|2223|9.32|1.25|6.184|1.029|222|
70|Yb|Иттербий|Ytterbium|173.05|lanthanide|d|824|1469|6.9|1.1|6.254|-0.02|222|
71|Lu|Лютеций|Lutetium|174.97|lanthanide|d|1663|3675|9.841|1.27|5.426|0.239|217|
72|Hf|Гафний|Hafnium|178.49|transition|d|2233|4603|13.31|1.3|6.825|0.178|208|
73|Ta|Тантал|Tantalum|180.95|transition|p|3017|5458|16.69|1.5|7.55|0.323|200|
74|W|Вольфрам|Tungsten|183.84|transition|p|3422|5555|19.25|2.36|7.864|0.815|193|
75|Re|Рений|Rhenium|186.21|transition|p|3186|5596|21.02|1.9|7.834|0.15|188|
76|Os|Осмий|Osmium|190.23|transition|p|3033|5285|22.59|2.2|8.438|1.078|185|
77|Ir|Иридий|Iridium|192.22|transition|p|2446|4428|22.56|2.2|8.967|1.564|180|
78|Pt|Платина|Platinum|195.08|transition|p|1768.3|3825|21.45|2.28|8.959|2.125|177|
79|Au|Золото|Gold|196.97|transition|d|1064.18|2856|19.3|2.54|9.226|2.309|174|
80|Hg|Ртуть|Mercury|200.59|transition|d|-38.83|356.73|13.534|2|10.438|-0.5|171|
81|Tl|Таллий|Thallium|204.38|post|d|304.5|1473|11.85|1.62|6.108|0.377|156|
82|Pb|Свинец|Lead|207.2|post|d|327.46|1749|11.34|2.33|7.417|0.364|154|
83|Bi|Висмут|Bismuth|208.98|post|d|271.4|1564|9.78|2.02|7.286|0.942|143|
84|Po|Полоний|Polonium|209|post|d|254|962|9.2|2|8.417|1.9|135|
85|At|Астат|Astatine|210|halogen|d|302|337|6.35|2.2|9.32|2.8|127|
86|Rn|Радон|Radon|222|noble|d|-71|-61.8|0.00973||10.749|-1|120|
87|Fr|Франций|Francium|223|alkali|p|27|677|2.48|0.7|4.073|0.486|348|
88|Ra|Радий|Radium|226|alkaline|p|700|1737|5.5|0.9|5.278|0.1|283|
89|Ac|Актиний|Actinium|227|actinide|p|1050|3200|10.07|1.1|5.17|0.35|260|
90|Th|Торий|Thorium|232.04|actinide|p|1750|4788|11.72|1.3|6.307|0.37|237|
91|Pa|Протактиний|Protactinium|231.04|actinide|p|1572|4000|15.37|1.5|5.89|0.55|240|
92|U|Уран|Uranium|238.03|actinide|p|1132.2|4131|19.1|1.38|6.194|0.53|229|
93|Np|Нептуний|Neptunium|237|actinide|p|644|3902|20.45|1.36|6.266|0.48|221|
94|Pu|Плутоний|Plutonium|244|actinide|p|639.5|3228|19.85|1.28|6.026|0.5|243|
95|Am|Америций|Americium|243|actinide|p|1176|2880|13.69|1.13|5.974|0.1|244|
96|Cm|Кюрий|Curium|247|actinide|p|1340|3383|13.51|1.28|5.991|0.28|245|
97|Bk|Беркелий|Berkelium|247|actinide|p|1259|2900|14.78|1.3|6.198|-1.72|244|
98|Cf|Калифорний|Californium|251|actinide|p|1173||15.1|1.3|6.282|-1.5|245|
99|Es|Эйнштейний|Einsteinium|252|actinide|p|1133||8.84|1.3|6.42|-0.3|245|
100|Fm|Фермий|Fermium|257|actinide|p|||||||245|
101|Md|Менделевий|Mendelevium|258|actinide|p|||||||246|
102|No|Нобелий|Nobelium|259|actinide|p|||||||246|
103|Lr|Лоуренсий|Lawrencium|266|actinide|p|1900||||5.426||246|
104|Rf|Резерфордий|Rutherfordium|267|transition|p|2400||||||257|
105|Db|Дубний|Dubnium|268|transition|p|||||||249|
106|Sg|Сиборгий|Seaborgium|269|transition|p|||||||243|
107|Bh|Борий|Bohrium|270|transition|p|||||||242|
108|Hs|Хассий|Hassium|269|transition|p|||||||136|
109|Mt|Мейтнерий|Meitnerium|278|transition|p|||||||159|
110|Ds|Дармштадтий|Darmstadtium|281|transition|p|||||||157|
111|Rg|Рентгений|Roentgenium|282|transition|p|||||||156|
112|Cn|Коперниций|Copernicium|285|transition|p|||||||145|
113|Nh|Нихоний|Nihonium|286|post|p|700||||||142|
114|Fl|Флеровий|Flerovium|289|post|p|200||||||140|
115|Mc|Московий|Moscovium|290|post|p|700||||||140|
116|Lv|Ливерморий|Livermorium|293|post|p|709||||||136|
117|Ts|Теннессин|Tennessine|294|halogen|p|723||||||132|
118|Og|Оганесон|Oganesson|294|noble|p|325||||||130|
`;

/* ---------- Справочники ---------- */

const CATEGORIES = {
  alkali:    { name: 'Щелочные металлы',              color: '#ff6f61' },
  alkaline:  { name: 'Щелочноземельные металлы',      color: '#ffab5e' },
  lanthanide:{ name: 'Лантаноиды',                   color: '#c76ee0' },
  actinide:  { name: 'Актиноиды',                    color: '#ef5bd0' },
  transition:{ name: 'Переходные металлы',           color: '#ffd94a' },
  post:      { name: 'Постпереходные металлы',       color: '#8fd14f' },
  metalloid: { name: 'Металлоиды',                   color: '#4ecdc4' },
  nonmetal:  { name: 'Другие неметаллы',             color: '#5aa9f7' },
  halogen:   { name: 'Галогены',                     color: '#3ec6c0' },
  noble:     { name: 'Благородные газы',              color: '#9a8cff' }
};

const MAGNETISM = {
  d: { name: 'Диамагнитный' },
  p: { name: 'Парамагнитный' },
  f: { name: 'Ферромагнитный' }
};

/* Цветовые шкалы (градиенты для «цвет по свойству») */
const SCALES = {
  inferno: ['#000004', '#160b39', '#420a68', '#6a176e', '#932667', '#bc3754', '#dd513a', '#f37819', '#fca50a', '#f6d746', '#fcffa4'],
  viridis: ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21918c', '#28ae80', '#5ec962', '#addc30', '#fde725'],
  turbo:   ['#30123b', '#4145ab', '#4675ed', '#39a2fc', '#1bcfd4', '#24eca6', '#61fc6c', '#a4fc3b', '#d1e834', '#f3c63a', '#fe9b2d', '#f36315', '#cb2a04', '#7a0403']
};

/* ---------- Разбор данных ---------- */

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const SUB_ORDER = { s: 0, p: 1, d: 2, f: 3 };

const sup = n => String(n).split('').map(d => SUP[d]).join('');

/** Порядок заполнения подуровней (правило Клечковского) */
const AUFBAU = [
  '1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p',
  '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s',
  '5f', '6d', '7p'
];
const CAPACITY = { s: 2, p: 6, d: 10, f: 14 };

/** Исключения из правила заполнения: Z → [откуда, сколько, куда] */
const EXCEPTIONS = {
  24: [['4s', 1, '3d']],
  29: [['4s', 1, '3d']],
  41: [['5s', 1, '4d']],
  42: [['5s', 1, '4d']],
  44: [['5s', 1, '4d']],
  45: [['5s', 1, '4d']],
  46: [['5s', 2, '4d']],
  47: [['5s', 1, '4d']],
  57: [['4f', 1, '5d']],
  58: [['4f', 1, '5d']],
  64: [['4f', 1, '5d']],
  78: [['6s', 1, '5d']],
  79: [['6s', 1, '5d']],
  89: [['5f', 1, '6d']],
  90: [['5f', 2, '6d']],
  91: [['5f', 1, '6d']],
  92: [['5f', 1, '6d']],
  93: [['5f', 1, '6d']],
  96: [['5f', 1, '6d']],
  103: [['6d', 1, '7p']]
};

/** Инертные газы для сокращённой записи */
const NOBLE = [
  { z: 2, sym: 'He' }, { z: 10, sym: 'Ne' }, { z: 18, sym: 'Ar' },
  { z: 36, sym: 'Kr' }, { z: 54, sym: 'Xe' }, { z: 86, sym: 'Rn' }
];

/**
 * Распределение электронов по подуровням.
 * @returns {Object} {'1s': n, '2p': n, ...}
 */
function subshellsFor(z) {
  const sub = {};
  let left = z;
  for (const key of AUFBAU) {
    if (left <= 0) break;
    const cap = CAPACITY[key[key.length - 1]];
    const take = Math.min(cap, left);
    sub[key] = take;
    left -= take;
  }
  for (const [from, n, to] of EXCEPTIONS[z] || []) {
    if (!sub[from] || !n) continue;
    const move = Math.min(n, sub[from]);
    sub[from] -= move;
    sub[to] = (sub[to] || 0) + move;
  }
  Object.keys(sub).forEach(k => { if (!sub[k]) delete sub[k]; });
  return sub;
}

/** Электронная конфигурация: [Ar] 3d² 4s² */
function configurationOf(z) {
  const sub = subshellsFor(z);
  const list = Object.keys(sub)
    .map(k => ({ key: k, n: +k[0], l: k[1], c: sub[k] }))
    .sort((a, b) => a.n - b.n || SUB_ORDER[a.l] - SUB_ORDER[b.l]);
  const full = list.map(o => o.key + sup(o.c)).join(' ');

  // Подбор «остова» из благородного газа
  const core = [...NOBLE].reverse().find(nb => nb.z < z);
  if (core) {
    const coreSub = subshellsFor(core.z);
    const coreKeys = Object.keys(coreSub)
      .map(k => ({ key: k, n: +k[0], l: k[1], c: coreSub[k] }))
      .sort((a, b) => a.n - b.n || SUB_ORDER[a.l] - SUB_ORDER[b.l]);
    const prefix = coreKeys.every(o => sub[o.key] === o.c);
    if (prefix) {
      const rest = list.filter(o => !coreKeys.some(c => c.key === o.key));
      if (rest.length) return `[${core.sym}] ` + rest.map(o => o.key + sup(o.c)).join(' ');
    }
  }
  return full;
}

/** Распределение электронов по слоям K L M N O P Q */
function shellsFor(z) {
  const shells = [0, 0, 0, 0, 0, 0, 0];
  for (const [key, count] of Object.entries(subshellsFor(z))) {
    shells[+key[0] - 1] += count;
  }
  return shells;
}

const num = v => (v === '' || v == null) ? null : Number(v);

/** Разбор строки в объект элемента */
function parseRow(line) {
  const c = line.split('|');
  const z = +c[0];
  return {
    z,
    symbol: c[1],
    name: c[2],
    nameEn: c[3],
    mass: +c[4],
    shells: shellsFor(z),
    category: c[5],
    magnetism: c[6] || null,
    melt: num(c[7]),
    boil: num(c[8]),
    density: num(c[9]),
    electronegativity: num(c[10]),
    ionization: num(c[11]),
    electronAffinity: num(c[12]),
    radius: num(c[13]),
    abundance: num(c[14]),
    config: configurationOf(z),
    radioactive: z === 43 || z === 61 || z >= 83,
    origin: (z === 43 || z === 61 || (z >= 85 && z <= 89)) ? 'decay'
      : z >= 93 ? 'synthetic' : 'primordial'
  };
}

const ELEMENTS = RAW_ELEMENTS.trim().split('\n').map(parseRow);
const BY_Z = new Map(ELEMENTS.map(e => [e.z, e]));

/* ---------- Производные величины ---------- */

/* ---------- Положение в периодической системе ---------- */

/**
 * Подглавные группы: [Zначало, Zконец, группа начальная, период].
 * Внутри блока группа возрастает на единицу с каждым Z (13→18, 3→12 и т. д.).
 * Водород и гелий заданы отдельно — они стоят по краям первого периода.
 */
const BLOCKS = [
  [3, 3, 1, 2], [4, 4, 2, 2], [5, 10, 13, 2],
  [11, 12, 1, 3], [13, 18, 13, 3],
  [19, 20, 1, 4], [21, 30, 3, 4], [31, 36, 13, 4],
  [37, 38, 1, 5], [39, 48, 3, 5], [49, 54, 13, 5],
  [55, 56, 1, 6], [57, 71, 3, 6], [72, 80, 4, 6], [81, 86, 13, 6],
  [87, 88, 1, 7], [89, 103, 3, 7], [104, 112, 4, 7], [113, 118, 13, 7]
];

/** Плейсхолдеры в 6-м и 7-м периодах (группа 3) — указатели на f-блок */
const ELEMENTS_PLACEHOLDERS = {
  6: { col: 3, text: '57–71', to: 8 },
  7: { col: 3, text: '89–103', to: 9 }
};

/** Истинные главная группа и период элемента */
function groupPeriodOf(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [18, 1];
  const b = BLOCKS.find(b => z >= b[0] && z <= b[1]);
  return b ? [b[2] + (z - b[0]), b[3]] : [null, null];
}

/**
 * Вычисляет для каждого элемента:
 *  group/period — истинные главная группа и период;
 *  row/col      — место в «змейке» 18 колонок (f-блок вынесен в строки 8–9).
 */
(() => {
  for (const e of ELEMENTS) {
    const [group, period] = groupPeriodOf(e.z);
    e.group = group;
    e.period = period;

    const isLanthanide = e.z >= 57 && e.z <= 71;
    const isActinide = e.z >= 89 && e.z <= 103;
    const fBlock = isLanthanide || isActinide;

    if (fBlock) {
      e.row = isLanthanide ? 8 : 9;
      e.col = e.z - (isLanthanide ? 57 : 89) + 3;
    } else {
      e.row = period;
      e.col = group;
    }
  }
})();

/** Свойства для раскраски таблицы */
const PROPERTIES = [
  { key: 'melt',          name: 'Температура плавления',    unit: '°C' },
  { key: 'boil',          name: 'Температура кипения',     unit: '°C' },
  { key: 'density',       name: 'Плотность',                unit: 'г/см³' },
  { key: 'electronegativity', name: 'Электроотрицательность', unit: '' },
  { key: 'ionization',    name: 'Энергия ионизации',        unit: 'эВ' },
  { key: 'electronAffinity', name: 'Сродство к электрону',    unit: 'эВ' },
  { key: 'radius',        name: 'Атомный радиус',           unit: 'пм' },
  { key: 'abundance',     name: 'Распространённость во Вселенной', unit: '%' }
];

/* ---------- Утилиты для цвета ---------- */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Цвет из шкалы по нормированному положению t∈[0,1] */
function scaleColor(t, scaleName = 'inferno') {
  const scale = SCALES[scaleName] || SCALES.inferno;
  const v = Math.max(0, Math.min(1, t));
  const pos = v * (scale.length - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const a = hexToRgb(scale[i]);
  const b = hexToRgb(scale[Math.min(i + 1, scale.length - 1)]);
  const mix = a.map((c, k) => Math.round(c + (b[k] - c) * f));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

/** Нормировка значения свойства в [0,1] с учётом логарифма */
function normalize(value, min, max, logarithmic) {
  if (value == null) return null;
  const lo = logarithmic ? Math.log10(Math.max(min, 1e-6)) : min;
  const hi = logarithmic ? Math.log10(Math.max(max, 1e-5)) : max;
  const v = logarithmic ? Math.log10(Math.max(value, 1e-6)) : value;
  if (hi === lo) return 0.5;
  return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}

/** Агрегаты по колонке свойства (для страницы статистики) */
function statsFor(key) {
  const values = ELEMENTS.map(e => e[key]).filter(v => v != null);
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const median = sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    std: Math.sqrt(variance),
    sum
  };
}
