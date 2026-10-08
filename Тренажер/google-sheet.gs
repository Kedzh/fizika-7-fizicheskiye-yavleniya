/*********************************************************
 *  Сбор результатов прохождения тренажёров (физика и математика)
 *  Google Apps Script — веб-приложение
 *
 *  ТАБЛИЦА УЖЕ УКАЗАНА
 *  https://docs.google.com/spreadsheets/d/1qbNXTekKjG1zCQcY3rMAFgEDq1j4m9Dhtwe5i9CUam4/edit
 *  ID: 1qbNXTekKjG1zCQcY3rMAFgEDq1j4m9Dhtwe5i9CUam4
 *
 *  ЛИСТЫ
 *  - Физика (без поля tab) — первый лист, как и раньше.
 *  - Математика (поле tab = «Математика») — отдельный лист «Математика»,
 *    создаётся автоматически при первой отправке.
 *
 *  КАК ПОДКЛЮЧИТЬ
 *  1. Откройте таблицу по ссылке выше.
 *  2. Меню «Расширения» → «Apps Script».
 *  3. Удалите из редактора всё содержимое и вставьте этот код.
 *  4. «Развернуть» → «Новое развёртывание»
 *       Тип: Веб-приложение
 *       Выполнять как: Я
 *       Кто имеет доступ: Любой
 *  5. Скопируйте ссылку вида
 *       https://script.google.com/macros/s/XXXXXXXX/exec
 *  6. Впишите эту ссылку в тренажёр: файл index.html, строка
 *     const DEFAULT_SHEET_URL='...';
 *     Ученикам ничего вводить не придётся.
 *
 *  ВАЖНО ПРИ ПЕРЕРАЗВЁРТЫВАНИИ
 *  Каждое новое развёртывание получает новый адрес. Если вы создали
 *  новое развёртывание, впишите его адрес в DEFAULT_SHEET_URL в index.html,
 *  иначе тренажёр будет обращаться к старому адресу.
 *
 *  ЕСЛИ НУЖНА ДРУГАЯ ТАБЛИЦА
 *  Впишите её ID в SPREADSHEET_ID ниже — это часть адреса
 *  между /d/ и /edit, например 1AbCdEfGhIjKlMnOpQrStUvWxYz.
 *********************************************************/

var SPREADSHEET_ID = '1qbNXTekKjG1zCQcY3rMAFgEDq1j4m9Dhtwe5i9CUam4';

var HEADERS = [
  'Дата', 'Время', 'Фамилия', 'Имя', 'Класс', 'Буква класса',
  'Тема занятия', 'Тип занятия', 'Верно', 'Всего', 'Процент, %', 'Время, с'
];

/* Проверка связи: тренажёр вызывает GET ?ping=1 */
function doGet(e) {
  try {
    var ss = openSheet();
    ensureSheetHeaders(ss.getSheets()[0]);
    var names = [];
    ss.getSheets().forEach(function (s) { names.push(s.getName()); });
    return json({
      ok: true,
      name: ss.getName(),
      url: ss.getUrl(),
      columns: HEADERS.length,
      sheets: names
    });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* Приём результата: тренажёр отправляет POST с JSON в теле.
   Для математики (поле tab = «Математика») — отдельный лист «Математика»,
   иначе — первый лист таблицы (как было для физики). */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var ss = openSheet();

    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var d = JSON.parse(raw);

    var sheet = targetSheet(ss, d);
    var res = writeRow(sheet, d);

    return json({ ok: true, sheet: sheet.getName(), row: res.row, skipped: !!res.reason, reason: res.reason || '' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* Лист назначения: «Математика» — отдельный лист с такими же заголовками */
function targetSheet(ss, d) {
  var tab = String((d && d.tab) || '').trim();
  var sheet;
  if (tab === 'Математика') {
    sheet = ss.getSheetByName('Математика');
    if (!sheet) sheet = ss.insertSheet('Математика');
  } else {
    sheet = ss.getSheets()[0];
  }
  return ensureSheetHeaders(sheet);
}

/* Проверка данных, защита от дублей и запись строки */
function writeRow(sheet, d) {
  var row = buildRow(d);
  if (isDuplicate(sheet, row)) return { row: 0, reason: 'Дубль уже есть в таблице' };
  sheet.appendRow(row);
  return { row: sheet.getLastRow() };
}

/* Проверка данных перед записью: мусор и подделки в таблицу не попадают */
function buildRow(d) {
  if (!d || typeof d !== 'object') throw new Error('Нет данных');

  var fam = plain(d.fam);
  var im = plain(d.im);
  var topic = plain(d.topic);
  var type = plain(d.type);

  if (!fam) throw new Error('Не указана фамилия');
  if (!im) throw new Error('Не указано имя');
  if (!topic) throw new Error('Не указана тема занятия');
  if (!type) throw new Error('Не указан тип занятия');

  var klass = plain(d.klass);
  if (klass && !/^\d{1,2}$/.test(klass)) throw new Error('Класс должен быть числом от 1 до 99');

  var letter = plain(d.letter);
  if (letter && !/^[А-Яа-яЁёA-Za-z]$/u.test(letter)) throw new Error('Буква класса указана неверно');

  var total = num(d.total);
  var ok = num(d.ok);
  if (total === '' || ok === '') throw new Error('Не указаны верные ответы и их количество');
  if (total <= 0) throw new Error('Количество заданий должно быть больше нуля');
  if (ok < 0) throw new Error('Верных ответов не может быть меньше нуля');
  if (ok > total) throw new Error('Верных ответов больше, чем заданий');

  var pct = d.pct === undefined || d.pct === null || d.pct === '' ? Math.round(ok / total * 100) : num(d.pct);
  if (pct < 0 || pct > 100) throw new Error('Процент должен быть от 0 до 100');

  var sec = d.sec === undefined || d.sec === null || d.sec === '' ? '' : num(d.sec);
  if (sec !== '' && sec < 0) throw new Error('Время не может быть отрицательным');

  return [
    plain(d.date) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy'),
    plain(d.time) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss'),
    fam, im, klass, letter, topic, type, ok, total, pct, sec
  ];
}

/* Защита от дублей: повторный POST того же результата не удвоит строку.
   Дата и время сравниваются через normDate/normTime: Google Sheets
   превращает «01:31» в значение времени и отдаёт его как 1:31. */
function isDuplicate(sheet, row) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var first = Math.max(2, last - 200);
  var count = last - first + 1;
  if (count < 1) return false;
  var rows = sheet.getRange(first, 1, count, row.length).getValues();
  var want = rowKey(row);
  for (var i = 0; i < rows.length; i++) {
    if (rowKey(rows[i]) === want) return true;
  }
  return false;
}

/* Ключ строки для сравнения: дата, время и содержимое в одном виде */
function rowKey(r) {
  return [normDate(r[0]), normTime(r[1]), r[2], r[3], r[6], r[7], r[8], r[9], r[11]]
    .map(function (v) { return String(v); }).join(' ');
}

function normDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd.MM.yyyy');
  return String(v === null || v === undefined ? '' : v).trim();
}

function normTime(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  var s = String(v === null || v === undefined ? '' : v).trim();
  var m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return (m[1].length === 2 ? m[1] : '0' + m[1]) + ':' + m[2];
}
/* Ручная отправка строки из редактора — для проверки */
function testFromEditor() {
  var ss = openSheet();
  var sheet = ensureSheetHeaders(ss.getSheets()[0]);
  sheet.appendRow(buildRow({
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy'),
    time: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss'),
    fam: 'Проверка',
    im: 'Связи',
    klass: '7',
    letter: 'А',
    topic: 'Тестовая тема',
    type: 'Тестовый режим',
    ok: 10,
    total: 10,
    sec: 42
  }));
  SpreadsheetApp.getUi().alert('Строка добавлена: ' + sheet.getName() + ', строка ' + sheet.getLastRow());
}

function openSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);

  var prop = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (prop) return SpreadsheetApp.openById(prop);

  throw new Error('Таблица не указана. Откройте скрипт из нужной таблицы или впишите SPREADSHEET_ID.');
}

function ensureSheetHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setFontWeight('bold')
         .setBackground('#dbeafe')
         .setFontSize(11);
    sheet.setFrozenRows(1);
    var w = [90, 70, 130, 110, 60, 90, 260, 170, 70, 70, 90, 90];
    for (var i = 0; i < w.length; i++) {
      sheet.setColumnWidth(i + 1, w[i]);
    }
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), 2).setNumberFormat('@');
  }
  return sheet;
}

/* Чистка текста: убираем управляющие символы, режем длину и гасим формулы.
   Google Sheets считает формулой значение, начинающееся с = + - @,
   поэтому такой текст принудительно становится обычным текстом. */
function plain(v) {
  if (v === null || v === undefined) return '';
  var s = String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length > 250) s = s.slice(0, 250);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num(v) {
  var n = Number(v);
  return isFinite(n) ? n : '';
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
