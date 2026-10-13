# -*- coding: utf-8 -*-
"""Извлечение банков вопросов из Тренажер/index.html в JSON."""
import json, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = r'O:\ШКОЛА\Физика\Тренажер\index.html'
html = open(SRC, encoding='utf-8').read()

def find_block(name):
    """Возвращает тело литерала после `const name=` до сбалансированной скобки."""
    m = re.search(r'const\s+' + re.escape(name) + r'\s*=\s*', html)
    if not m:
        return None
    i = m.end()
    opener = html[i]
    closer = {'[': ']', '{': '}'}[opener]
    depth = 0
    in_str = None
    esc = False
    for j in range(i, len(html)):
        ch = html[j]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in '\'"':
            in_str = ch
            continue
        if ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return html[i:j + 1]
    return None


def to_json(block):
    """JS-литерал -> JSON."""
    s = block
    # ключи: {q: -> {"q":
    s = re.sub(r'([{,])\s*([A-Za-z_$][\w$]*)\s*:', r'\1"\2":', s)
    # строки в одинарных кавычках -> в двойные
    def fix(m):
        body = m.group(1)
        body = body.replace('\\"', '"').replace("\\'", "'")
        return '"' + body + '"'
    s = re.sub(r"'((?:[^'\\]|\\.)*)'", fix, s)
    # true/false -> true/false (уже ok), ключевые слова-значения
    return json.loads(s)


NAMES = ['QUESTIONS', 'QUESTIONS2', 'QUESTIONS3', 'QUESTIONS5', 'QUESTIONS6',
         'QUESTIONS7', 'QUESTIONS8', 'QUESTIONS9', 'QUESTIONS10', 'QUESTIONS11',
         'TRUE_FALSE', 'TRUE_FALSE2', 'TRUE_FALSE3', 'TRUE_FALSE5', 'TRUE_FALSE6',
         'TRUE_FALSE7', 'TRUE_FALSE8', 'TRUE_FALSE9', 'TRUE_FALSE10',
         'TRUE_FALSE11',
         'ODD_ROUNDS', 'ODD_ROUNDS2', 'ODD_ROUNDS3', 'ODD_ROUNDS5', 'ODD_ROUNDS6',
         'ODD_ROUNDS7', 'ODD_ROUNDS8', 'ODD_ROUNDS9', 'ODD_ROUNDS10',
         'ODD_ROUNDS11']

out = {}
for n in NAMES:
    b = find_block(n)
    if not b:
        print('MISS', n); continue
    try:
        out[n] = to_json(b)
    except Exception as e:
        print('FAIL', n, e); continue
    print('OK  %-14s %d' % (n, len(out[n])))

# диагностика: где ответ всегда первый
for n in [k for k in NAMES if k.startswith('QUESTIONS') and isinstance(out.get(k), list)]:
    arr = out[n]
    if all(q['c'] == 0 for q in arr):
        print('  ! все ответы c=0 ->', n)

json.dump(out, open(r'O:\ШКОЛА\Физика\Тренажер\_banks.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\nSaved _banks.json')