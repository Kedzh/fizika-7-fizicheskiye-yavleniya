# -*- coding: utf-8 -*-
"""Сборка итогового теста (20 вопросов) из банков Тренажёра -> DOCX."""
import json, random, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'O:\ШКОЛА\Физика\Тренажер'
OUT = r'O:\ШКОЛА\Физика\Итоговый тест по физике (20 вопросов).docx'

# ---------------------------------------------------------------- утилиты
EMOJI = re.compile(
    '[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\u2190-\u21FF\u2755-\u2757\uFE0F\u200D]+')


def clean(t):
    """Убрать декоративные эмодзи, лишние пробелы и ZWJ-мусор."""
    t = EMOJI.sub('', t)
    t = t.replace('\u00a0', ' ').replace('\u200d', '')
    t = re.sub(r'\s+([,.:;?!])', r'\1', t)
    t = re.sub(r'\(\s+', '(', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip()


LETTERS = ['А', 'Б', 'В', 'Г']


def set_font(run, name='Times New Roman', size=12, bold=False, italic=False,
             color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    rPr = run._element.get_or_add_rPr()
    rf = rPr.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts')
        rPr.append(rf)
    for a in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rf.set(qn(a), name)


# ---------------------------------------------------------------- данные
raw = json.load(open(BASE + r'\_banks.json', encoding='utf-8'))
B = {}
for n, v in raw.items():
    if isinstance(v, dict):
        for k, arr in v.items():
            B['QUESTIONS.' + k] = arr
    else:
        B[n] = v

TOPICS = [
    ('phenomena', 'Физические явления', ['QUESTIONS.mech', 'QUESTIONS.thermal',
     'QUESTIONS.electric', 'QUESTIONS.magnetic', 'QUESTIONS.light',
     'QUESTIONS.sound'], ['TRUE_FALSE'], ['ODD_ROUNDS']),
    ('measure', 'Физические величины и их измерение', ['QUESTIONS2'], ['TRUE_FALSE2'], ['ODD_ROUNDS2']),
    ('temp', 'Измерение температуры', ['QUESTIONS3'], ['TRUE_FALSE3'], ['ODD_ROUNDS3']),
    ('tech', 'Физика и техника', ['QUESTIONS5'], ['TRUE_FALSE5'], ['ODD_ROUNDS5']),
    ('matter', 'Строение вещества', ['QUESTIONS6'], ['TRUE_FALSE6'], ['ODD_ROUNDS6']),
    ('molecules', 'Молекулы', ['QUESTIONS7'], ['TRUE_FALSE7'], ['ODD_ROUNDS7']),
    ('diffusion', 'Броуновское движение. Диффузия', ['QUESTIONS8'], ['TRUE_FALSE8'], ['ODD_ROUNDS8']),
    ('states', 'Агрегатные состояния вещества', ['QUESTIONS9'], ['TRUE_FALSE9'], ['ODD_ROUNDS9']),
    ('structure', 'Молекулярное строение состояний', ['QUESTIONS10'], ['TRUE_FALSE10'], ['ODD_ROUNDS10']),
    ('motion', 'Механическое движение', ['QUESTIONS11'], ['TRUE_FALSE11'], ['ODD_ROUNDS11']),
    ('uniform', 'Равномерное и неравномерное движение', ['QUESTIONS12'], ['TRUE_FALSE12'], ['ODD_ROUNDS12']),
]

# квоты: (тема, сколько с выбором ответа, сколько «верно/неверно»)
# Появилась тема Урока 13 — квоты у «Агрегатных состояний» и «Молекулярного
# строения» уменьшены на 1, чтобы итог остался 20 вопросами (13 + 7).
PLAN = {
    'phenomena': (1, 0),
    'measure':   (2, 0),
    'temp':      (1, 1),
    'tech':      (1, 1),
    'matter':    (1, 0),
    'molecules': (2, 0),
    'diffusion': (1, 1),
    'states':    (1, 1),
    'structure': (1, 1),
    'motion':    (1, 1),
    'uniform':   (1, 1),
}
assert sum(a + b for a, b in PLAN.values()) == 20, sum(a + b for a, b in PLAN.values())
assert sum(a for a, _ in PLAN.values()) == 13, sum(a for a, _ in PLAN.values())
# вопросы с оборванной формулировкой — в тест не берём
SKIP_STEMS = {
    'в курсе физики изучаются превращения, при которых',
}

rnd = random.Random(20261012)
used_text = set()


def pick(items, k):
    """Выбрать k уникальных по тексту вопросов, перемешав порядок."""
    pool = []
    for q in items:
        t = clean(q.get('q', ''))
        if not t or t.lower() in used_text or t.lower() in SKIP_STEMS:
            continue
        pool.append((t, q))
    rnd.shuffle(pool)
    out = []
    for t, q in pool:
        used_text.add(t.lower())
        out.append((t, q))
        if len(out) == k:
            break
    return out


TEST = []
for tid, tname, mqbanks, tfbanks, oddbanks in TOPICS:
    n_mcq, n_tf = PLAN[tid]

    mcq_pool = [q for b in mqbanks for q in B[b]]
    tf_pool = [q for b in tfbanks for q in B[b]]

    for t, q in pick(mcq_pool, n_mcq):
        TEST.append({'kind': 'mcq', 'topic': tname, 'q': t, 'q_': q})

    # «верно/неверно» — поровну верных и неверных внутри темы
    tr = [q for q in tf_pool if q['a'] is True]
    fa = [q for q in tf_pool if q['a'] is False]
    rnd.shuffle(tr); rnd.shuffle(fa)
    want = [False] if n_tf == 1 else [True, False] * 10
    got = 0
    for w in want:
        if got == n_tf:
            break
        res = pick(tr if w else fa, 1)
        if not res:
            continue
        t, q = res[0]
        TEST.append({'kind': 'tf', 'topic': tname, 'q': t, 'q_': q})
        got += 1

assert len(TEST) == 20, len(TEST)

# ---- порядок: сначала вопросы с выбором ответа, затем «верно/неверно»;
#      внутри групп порядок случайный.
rnd.shuffle(TEST)
TEST.sort(key=lambda it: 0 if it['kind'] == 'mcq' else 1)
for i, it in enumerate(TEST, 1):
    it['n'] = i

N_MCQ = sum(1 for it in TEST if it['kind'] == 'mcq')
N_TF = len(TEST) - N_MCQ


def build_options(it):
    """Перемешать варианты, вернуть (варианты, индекс верного)."""
    q = it['q_']
    if it['kind'] == 'mcq':
        opts = [clean(x) for x in q['a']]
        order = list(range(len(opts)))
        rnd.shuffle(order)
        return [opts[i] for i in order], order.index(q['c'])
    return ['Верно', 'Неверно'], (0 if q['a'] else 1)


# ---- балансировка букв: перемешиваем варианты, пока А/Б/В/Г не распределены
#      поровну среди вопросов с выбором ответа.
best = None
for _ in range(5000):
    trial = [build_options(it) for it in TEST]
    letters = [c for (_, c), it in zip(trial, TEST) if it['kind'] == 'mcq']
    cnt = [letters.count(i) for i in range(4)]
    spread = max(cnt) - min(cnt)
    score = (spread, sum((c - N_MCQ / 4.0) ** 2 for c in cnt))
    if best is None or score < best[0]:
        best = (score, trial)
    if spread == 0:
        break

for it, (opts, corr) in zip(TEST, best[1]):
    it['opts'], it['correct'] = opts, corr

# ---------------------------------------------------------------- документ
doc = Document()
st = doc.styles['Normal']
st.font.name = 'Times New Roman'
st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')

sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin = Cm(1.8); sec.bottom_margin = Cm(1.8)
sec.left_margin = Cm(2.2); sec.right_margin = Cm(1.5)

st.paragraph_format.space_after = Pt(0)
st.paragraph_format.line_spacing = 1.12


def para(text='', size=12, bold=False, italic=False, align=None, before=0,
         after=0, indent=None, color=None, spacing=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    if align is not None:
        p.alignment = align
    if indent is not None:
        pf.left_indent = Cm(indent)
    if spacing is not None:
        pf.line_spacing = spacing
    if text:
        set_font(p.add_run(text), size=size, bold=bold, italic=italic, color=color)
    return p


C = WD_ALIGN_PARAGRAPH.CENTER
L = WD_ALIGN_PARAGRAPH.LEFT
GRAY = RGBColor(0x59, 0x59, 0x59)


def cell_border(cell, edge='bottom', sz=6, color='000000'):
    """Нижняя (или иная) линия ячейки — чтобы по полям можно было писать."""
    tcPr = cell._tc.get_or_add_tcPr()
    borders = tcPr.find(qn('w:tcBorders'))
    if borders is None:
        borders = OxmlElement('w:tcBorders')
        tcPr.append(borders)
    el = OxmlElement('w:' + edge)
    el.set(qn('w:val'), 'single')
    el.set(qn('w:sz'), str(sz))
    el.set(qn('w:space'), '0')
    el.set(qn('w:color'), color)
    borders.append(el)


# --- шапка
para('Итоговый тест по физике', size=17, bold=True, align=C, after=2)
para('7 класс · 20 вопросов с выбором ответа', size=11, italic=True,
     align=C, color=GRAY, after=10)

# --- ФИО: подписи + линейки для записи
#     [подпись][линейка][подпись][линейка]
FIELDS = [
    ('Фамилия, имя:', '', '', ''),
    ('Класс:', '', 'Дата:', ''),
]
WID = [Cm(3.7), Cm(5.8), Cm(1.9), Cm(5.9)]
t = doc.add_table(rows=len(FIELDS), cols=4)
t.alignment = WD_TABLE_ALIGNMENT.LEFT
t.autofit = False
for r, row in enumerate(FIELDS):
    for c_, txt in enumerate(row):
        cell = t.cell(r, c_)
        cell.width = WID[c_]
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(5)
        set_font(p.add_run(txt), size=12, bold=(c_ in (0, 2)))
        if c_ in (1, 3):
            cell_border(cell, 'bottom')
        else:
            cell_border(cell, 'bottom', color='FFFFFF')   # лишние границы убираем

para(after=8)

# --- инструкция
para('Инструкция', size=12, bold=True, after=2)
for line in [
    '•  В вопросах 1–%d выберите один правильный ответ и обведите его номер.' % N_MCQ,
    '•  В вопросах %d–20 определите, верно ли утверждение, и выберите один ответ.' % (N_MCQ + 1),
    '•  На каждый вопрос отводится 1 балл. Всего можно набрать 20 баллов.',
    '•  Время выполнения — 25 минут.',
]:
    para(line, size=11, after=1)
para(after=10)

# --- вопросы
# keep_with_next на всём блоке, кроме последнего варианта: вопрос не разрывается
for it in TEST:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.keep_together = True
    set_font(p.add_run('%d. ' % it['n']), size=12, bold=True)
    set_font(p.add_run(it['q']), size=12)

    last = len(it['opts']) - 1
    for j, o in enumerate(it['opts']):
        pp = doc.add_paragraph()
        pp.paragraph_format.left_indent = Cm(0.85)
        pp.paragraph_format.space_after = Pt(0)
        pp.paragraph_format.keep_with_next = (j != last)
        pp.paragraph_format.keep_together = True
        set_font(pp.add_run('%s) %s' % (LETTERS[j], o)), size=12)

# --- разрыв страницы -> ответы
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

para('Ответы и комментарии', size=15, bold=True, align=C, after=2)
para('для проверки учителем', size=10, italic=True, align=C, color=GRAY, after=10)

KEYNOTE = {
    'mcq': lambda it: 'верный вариант — «%s»' % it['opts'][it['correct']],
    'tf': lambda it: 'верно' if it['correct'] == 0 else 'неверно',
    'odd': lambda it: 'лишний — «%s»' % it['opts'][it['correct']],
}

tbl = doc.add_table(rows=1, cols=3)
tbl.style = 'Table Grid'
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = ['№', 'Ответ', 'Тема']
for i, h in enumerate(hdr):
    c = tbl.rows[0].cells[i]
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    set_font(p.add_run(h), size=11, bold=True)
    sh = OxmlElement('w:shd')
    sh.set(qn('w:fill'), 'DCE6F1')
    c._tc.get_or_add_tcPr().append(sh)

for it in TEST:
    row = tbl.add_row().cells
    vals = [str(it['n']), '%s) %s' % (LETTERS[it['correct']],
                                      KEYNOTE[it['kind']](it)), it['topic']]
    for i, v in enumerate(vals):
        p = row[i].paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        set_font(p.add_run(v), size=10, bold=(i == 0))
for r in tbl.rows:
    r.cells[0].width = Cm(1.1)
    r.cells[1].width = Cm(8.0)
    r.cells[2].width = Cm(6.6)

# --- пояснения к утверждениям «верно/неверно»
para('Пояснения к вопросам на «верно / неверно»', size=12, bold=True,
     before=12, after=3)
for it in TEST:
    if it['kind'] == 'tf':
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Cm(0.5)
        set_font(p.add_run('%d. ' % it['n']), size=11, bold=True)
        set_font(p.add_run(clean(it['q_'].get('e', ''))), size=11)

# --- лишний вариант
oddq = [it for it in TEST if it['kind'] == 'odd']
if oddq:
    para('Пояснения к заданиям «найди лишний»', size=12, bold=True,
         before=10, after=3)
    for it in oddq:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Cm(0.5)
        set_font(p.add_run('%d. ' % it['n']), size=11, bold=True)
        set_font(p.add_run(clean(it['q_'].get('note', ''))), size=11)

# --- шкала
para('Оценивание', size=12, bold=True, before=12, after=3)
para('19–20 баллов — «5»    ·    15–18 баллов — «4»    ·    10–14 баллов — «3»    ·    '
     'менее 10 баллов — «2»', size=11, after=2)
para('Итого: ___________ / 20', size=12, bold=True, before=6)

doc.save(OUT)

# ---------------------------------------------------------------- отчёт
print('Сохранено:', OUT)
print()
for it in TEST:
    print('%2d. [%-16s] %s' % (it['n'], it['topic'], it['q'][:78]))
print()
import collections
print('типы:', dict(collections.Counter(i['kind'] for i in TEST)))
print('правильные буквы:',
      ''.join(LETTERS[i['correct']] for i in TEST))
print('тем:', dict(collections.Counter(i['topic'] for i in TEST)))