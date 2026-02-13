(function () {
  'use strict';

  var DEBUG = true;
  function log() {
    if (DEBUG && typeof console !== 'undefined' && console.log) {
      console.log.apply(console, ['[Bibliasaas]'].concat(Array.prototype.slice.call(arguments)));
    }
  }
  function warn() {
    if (DEBUG && typeof console !== 'undefined' && console.warn) {
      console.warn.apply(console, ['[Bibliasaas]'].concat(Array.prototype.slice.call(arguments)));
    }
  }
  function err() {
    if (DEBUG && typeof console !== 'undefined' && console.error) {
      console.error.apply(console, ['[Bibliasaas]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

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
  var translationsEmptyMsg = document.getElementById('translationsEmptyMsg');
  var verseInput = document.getElementById('verseInput');

  function apiBase() {
    return typeof window.location.origin !== 'undefined' ? window.location.origin : '';
  }

  log('Iniciado. Origin:', window.location.origin, '| API base:', apiBase());

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
    var url = apiBase() + '/api/books';
    log('GET livros:', url);
    return fetch(url)
      .then(function (r) {
        log('Resposta /api/books → status:', r.status, r.statusText);
        return r.json();
      })
      .then(function (data) {
        books = data;
        log('Livros recebidos:', Array.isArray(data) ? data.length : 0, 'livros', data && data[0] ? '(ex.: ' + data[0].name + ')' : '');
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
      })
      .catch(function (e) {
        err('Falha ao carregar livros:', e.message);
      });
  }

  function loadTranslations() {
    translationsEmptyMsg.style.display = 'none';
    translationsEmptyMsg.textContent = '';
    var url = apiBase() + '/api/translations';
    log('GET traduções:', url);
    return fetch(url)
      .then(function (r) {
        log('Resposta /api/translations → status:', r.status, r.statusText);
        if (!r.ok) throw new Error('API respondeu com ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var list = Array.isArray(data) ? data : (data && data.translations) || [];
        translations = list;
        log('Traduções recebidas:', translations.length, '→', translations.length ? translations.map(function (t) { return t.id + ' (' + t.name + ')'; }) : 'array vazio []');
        if (translations.length === 0) {
          warn('Nenhuma tradução na resposta. A API retornou array vazio. Verifique includeFiles no vercel.json e se os .sqlite estão no repo.');
          fetch(apiBase() + '/api/translations?debug=1')
            .then(function (r) { return r.json(); })
            .then(function (debugData) {
              if (debugData && debugData.debug) {
                log('Debug do servidor (por que não há traduções):', debugData.debug);
              }
            })
            .catch(function () {});
        }
        translationNames = {};
        translations.forEach(function (t) { translationNames[t.id] = t.name; });
        translationsGroup.innerHTML = '';
        if (translations.length === 0) {
          translationsEmptyMsg.textContent = 'Nenhuma tradução encontrada. Inclua arquivos .sqlite em assets/traducoes no repositório e faça um novo deploy na Vercel.';
          translationsEmptyMsg.style.display = 'block';
          return;
        }
        translations.forEach(function (t) {
          var label = document.createElement('label');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = t.id;
          cb.name = 'translation';
          label.appendChild(cb);
          label.appendChild(document.createTextNode(t.name));
          translationsGroup.appendChild(label);
        });
      })
      .catch(function (e) {
        err('Falha ao carregar traduções:', e.message);
        translationsGroup.innerHTML = '';
        translations = [];
        translationsEmptyMsg.textContent = 'Não foi possível carregar as traduções. Verifique se os arquivos .sqlite estão em assets/traducoes e foram enviados ao repositório.';
        translationsEmptyMsg.style.display = 'block';
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
    if (nodes.length === 0) {
      return translations.map(function (t) { return t.id; });
    }
    var ids = [];
    for (var i = 0; i < nodes.length; i++) {
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
    var verse = verseInput && verseInput.value ? parseInt(verseInput.value, 10) : null;
    log('Ler clicado → livro:', book, '| capítulo:', chapter, '| versículo:', verse || 'todo', '| traduções:', trans.length ? trans.length + ' selecionada(s)' : 'todas');
    if (!book || !chapter) {
      showState(true, false, false, false);
      setError('');
      return;
    }
    if (trans.length === 0) {
      showState(true, false, false, false);
      setError('');
      return;
    }
    showState(false, true, false, false);
    setError('');
    var qs = '?book=' + encodeURIComponent(book) + '&chapter=' + encodeURIComponent(chapter) + '&translations=' + trans.map(encodeURIComponent).join(',');
    if (verse && verse >= 1) qs += '&verse=' + encodeURIComponent(verse);
    var url = apiBase() + '/api/verses' + qs;
    log('GET versículos:', url);
    fetch(url)
      .then(function (r) {
        log('Resposta /api/verses → status:', r.status, r.statusText);
        return r.json();
      })
      .then(function (json) {
        if (json.error) {
          err('API versículos retornou erro:', json.error, json.detail ? json.detail : '');
          setError(json.detail ? json.error + ': ' + json.detail : json.error);
          showState(false, false, true, false);
          return;
        }
        var data = json.data || [];
        log('Versículos recebidos:', data.length, 'tradução(ões)', data.length ? '→ ' + data.map(function (d) { return d.translationId + ': ' + (d.verses && d.verses.length) + ' versos'; }).join(', ') : '');
        renderReading(book, chapter, verse, data);
        showState(false, false, false, true);
      })
      .catch(function (e) {
        err('Falha ao carregar versículos:', e.message);
        setError('Falha ao carregar versículos. Verifique se as traduções estão em /assets/traducoes.');
        showState(false, false, true, false);
      });
  }

  function renderReading(bookNumber, chapter, verseNumber, data) {
    var bookName = getBookName(bookNumber);
    readingHeader.textContent = verseNumber ? bookName + ' ' + chapter + '.' + verseNumber : bookName + ' ' + chapter;

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
