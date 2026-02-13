(function () {
  'use strict';

  var CHAPTER_COUNTS = [
    50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22
  ];

  var books = [];
  var translations = [];
  var translationNames = {};

  var bookSelect = document.getElementById('bookSelect');
  var chapterSelect = document.getElementById('chapterSelect');
  var translationsGroup = document.getElementById('translationsGroup');
  var btnRead = document.getElementById('btnRead');
  var emptyMsg = document.getElementById('emptyMsg');
  var loadingMsg = document.getElementById('loadingMsg');
  var errorMsg = document.getElementById('errorMsg');
  var readingContent = document.getElementById('readingContent');
  var readingHeader = document.getElementById('readingHeader');
  var versesTableHead = document.getElementById('versesTableHead');
  var versesTableBody = document.getElementById('versesTableBody');
  var versesStacked = document.getElementById('versesStacked');
  var themeToggle = document.getElementById('themeToggle');

  function apiBase() {
    return typeof window.location.origin !== 'undefined' ? window.location.origin : '';
  }

  function showState(showEmpty, showLoading, showError, showContent) {
    emptyMsg.style.display = showEmpty ? 'block' : 'none';
    loadingMsg.style.display = showLoading ? 'block' : 'none';
    errorMsg.style.display = showError ? 'block' : 'none';
    readingContent.style.display = showContent ? 'block' : 'none';
  }

  function setError(text) {
    errorMsg.textContent = text || '';
  }

  function loadBooks() {
    return fetch(apiBase() + '/api/books')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        books = data;
        bookSelect.innerHTML = '';
        var opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Selecione o livro';
        bookSelect.appendChild(opt);
        books.forEach(function (b) {
          var o = document.createElement('option');
          o.value = b.number;
          o.textContent = b.name;
          bookSelect.appendChild(o);
        });
      });
  }

  function loadTranslations() {
    return fetch(apiBase() + '/api/translations')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        translations = data;
        translationNames = {};
        data.forEach(function (t) { translationNames[t.id] = t.name; });
        translationsGroup.innerHTML = '';
        data.forEach(function (t) {
          var label = document.createElement('label');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = t.id;
          cb.name = 'translation';
          label.appendChild(cb);
          label.appendChild(document.createTextNode(t.name));
          translationsGroup.appendChild(label);
        });
      });
  }

  function updateChapters() {
    var bookNum = parseInt(bookSelect.value, 10);
    chapterSelect.innerHTML = '';
    var opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Selecione o capítulo';
    chapterSelect.appendChild(opt);
    if (bookNum >= 1 && bookNum <= 66) {
      var max = CHAPTER_COUNTS[bookNum - 1];
      for (var c = 1; c <= max; c++) {
        var o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        chapterSelect.appendChild(o);
      }
    }
  }

  function getSelectedTranslations() {
    var nodes = document.querySelectorAll('input[name="translation"]:checked');
    var ids = [];
    for (var i = 0; i < nodes.length && ids.length < 3; i++) {
      ids.push(nodes[i].value);
    }
    return ids;
  }

  function getBookName(bookNumber) {
    var b = books.find(function (x) { return x.number === bookNumber; });
    return b ? b.name : 'Livro ' + bookNumber;
  }

  function loadVerses() {
    var book = parseInt(bookSelect.value, 10);
    var chapter = parseInt(chapterSelect.value, 10);
    var trans = getSelectedTranslations();
    if (!book || !chapter || trans.length === 0) {
      showState(true, false, false, false);
      setError('');
      return;
    }
    showState(false, true, false, false);
    setError('');
    var qs = '?book=' + encodeURIComponent(book) + '&chapter=' + encodeURIComponent(chapter) + '&translations=' + trans.map(encodeURIComponent).join(',');
    fetch(apiBase() + '/api/verses' + qs)
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json.error) {
          setError(json.error);
          showState(false, false, true, false);
          return;
        }
        renderReading(book, chapter, json.data);
        showState(false, false, false, true);
      })
      .catch(function (err) {
        setError('Falha ao carregar versículos. Verifique se as traduções estão em /assets/traducoes.');
        showState(false, false, true, false);
      });
  }

  function renderReading(bookNumber, chapter, data) {
    var bookName = getBookName(bookNumber);
    readingHeader.textContent = bookName + ' ' + chapter;

    var maxVerses = 0;
    var byVerse = {};
    data.forEach(function (item) {
      var id = item.translationId;
      var arr = item.verses || [];
      if (arr.length > maxVerses) maxVerses = arr.length;
      arr.forEach(function (v) {
        var key = v.verse;
        if (!byVerse[key]) byVerse[key] = {};
        byVerse[key][id] = v.text;
      });
    });

    var verseNumbers = Object.keys(byVerse).map(Number).sort(function (a, b) { return a - b; });

    var thead = versesTableHead;
    thead.innerHTML = '';
    var trHead = document.createElement('tr');
    var thNum = document.createElement('th');
    thNum.textContent = '#';
    thNum.className = 'verse-num';
    trHead.appendChild(thNum);
    data.forEach(function (item) {
      var th = document.createElement('th');
      th.textContent = translationNames[item.translationId] || item.translationId;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    var tbody = versesTableBody;
    tbody.innerHTML = '';
    verseNumbers.forEach(function (num) {
      var tr = document.createElement('tr');
      var tdNum = document.createElement('td');
      tdNum.className = 'verse-num';
      tdNum.textContent = num;
      tr.appendChild(tdNum);
      data.forEach(function (item) {
        var td = document.createElement('td');
        td.className = 'verse-text';
        td.textContent = (byVerse[num] && byVerse[num][item.translationId]) || '—';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    versesStacked.innerHTML = '';
    verseNumbers.forEach(function (num) {
      var block = document.createElement('div');
      block.className = 'verse-block';
      var header = document.createElement('div');
      header.className = 'verse-block-header';
      var numSpan = document.createElement('span');
      numSpan.className = 'verse-block-num';
      numSpan.textContent = num;
      header.appendChild(numSpan);
      var transDiv = document.createElement('div');
      transDiv.className = 'verse-translations';
      data.forEach(function (item) {
        var itemDiv = document.createElement('div');
        itemDiv.className = 'verse-translation-item';
        var label = document.createElement('div');
        label.className = 'translation-label';
        label.textContent = translationNames[item.translationId] || item.translationId;
        var text = document.createElement('div');
        text.className = 'translation-text';
        text.textContent = (byVerse[num] && byVerse[num][item.translationId]) || '—';
        itemDiv.appendChild(label);
        itemDiv.appendChild(text);
        transDiv.appendChild(itemDiv);
      });
      block.appendChild(header);
      block.appendChild(transDiv);
      versesStacked.appendChild(block);
    });
  }

  function initTheme() {
    var dark = localStorage.getItem('bibliasaas-dark') === '1';
    if (dark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('bibliasaas-dark', document.body.classList.contains('dark-mode') ? '1' : '0');
  }

  bookSelect.addEventListener('change', updateChapters);
  btnRead.addEventListener('click', loadVerses);
  themeToggle.addEventListener('click', toggleTheme);

  initTheme();
  loadBooks().then(loadTranslations).then(function () {
    if (books.length && translations.length && bookSelect.value) updateChapters();
  });
})();
