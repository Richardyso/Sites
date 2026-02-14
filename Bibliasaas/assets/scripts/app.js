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
  var currentBook = null;
  var currentChapter = null;

  var bookSelect = document.getElementById('bookSelect');
  var chapterSelect = document.getElementById('chapterSelect');
  var translationsGroup = document.getElementById('translationsGroup');
  var btnRead = document.getElementById('btnRead');
  var emptyMsg = document.getElementById('emptyMsg');
  var loadingMsg = document.getElementById('loadingMsg');
  var errorMsg = document.getElementById('errorMsg');
  var readingContent = document.getElementById('readingContent');
  var readingHeader = document.getElementById('readingHeader');
  var versesStacked = document.getElementById('versesStacked');
  var themeToggle = document.getElementById('themeToggle');
  var translationsEmptyMsg = document.getElementById('translationsEmptyMsg');
  var verseInput = document.getElementById('verseInput');
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var btnPrevChapter = document.getElementById('btnPrevChapter');
  var btnNextChapter = document.getElementById('btnNextChapter');
  var fontSizeUp = document.getElementById('fontSizeUp');
  var fontSizeDown = document.getElementById('fontSizeDown');

  function apiBase() {
    return typeof window.location.origin !== 'undefined' ? window.location.origin : '';
  }

  log('Iniciado. Origin:', window.location.origin, '| API base:', apiBase());

  function showState(showEmpty, showLoading, showError, showContent, showSearch) {
    emptyMsg.style.display = showEmpty ? 'block' : 'none';
    loadingMsg.style.display = showLoading ? 'block' : 'none';
    errorMsg.style.display = showError ? 'block' : 'none';
    readingContent.style.display = showContent ? 'block' : 'none';
    searchResults.style.display = showSearch ? 'block' : 'none';
  }

  function setError(text) {
    errorMsg.textContent = text || '';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
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
          warn('Nenhuma tradução na resposta.');
          fetch(apiBase() + '/api/translations?debug=1')
            .then(function (r) { return r.json(); })
            .then(function (debugData) {
              if (debugData && debugData.debug) {
                log('Debug do servidor:', debugData.debug);
              }
            })
            .catch(function () {});
        }
        translationNames = {};
        translations.forEach(function (t) { translationNames[t.id] = t.name; });
        translationsGroup.innerHTML = '';
        if (translations.length === 0) {
          translationsEmptyMsg.textContent = 'Nenhuma tradução encontrada. Inclua arquivos .sqlite em assets/traducoes.';
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
        translationsEmptyMsg.textContent = 'Não foi possível carregar as traduções.';
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

  function loadVerses(book, chapter, verseNumber) {
    var b = book != null ? book : parseInt(bookSelect.value, 10);
    var ch = chapter != null ? chapter : parseInt(chapterSelect.value, 10);
    var trans = getSelectedTranslations();
    var v = verseNumber != null ? verseNumber : (verseInput && verseInput.value ? parseInt(verseInput.value, 10) : null);
    log('Ler → livro:', b, '| capítulo:', ch, '| versículo:', v || 'todo', '| traduções:', trans.length);
    if (!b || !ch) {
      showState(true, false, false, false, false);
      setError('');
      return;
    }
    if (trans.length === 0) {
      showState(true, false, false, false, false);
      setError('');
      return;
    }
    showState(false, true, false, false, false);
    setError('');
    if (book == null) {
      bookSelect.value = b;
      updateChapters();
    }
    if (chapter == null) {
      chapterSelect.value = ch;
    } else {
      chapterSelect.value = ch;
    }
    if (verseNumber != null && verseInput) verseInput.value = verseNumber;
    var qs = '?book=' + encodeURIComponent(b) + '&chapter=' + encodeURIComponent(ch) + '&translations=' + trans.map(encodeURIComponent).join(',');
    if (v && v >= 1) qs += '&verse=' + encodeURIComponent(v);
    var url = apiBase() + '/api/verses' + qs;
    log('GET versículos:', url);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json.error) {
          err('API versículos retornou erro:', json.error);
          setError(json.detail ? json.error + ': ' + json.detail : json.error);
          showState(false, false, true, false, false);
          return;
        }
        var data = json.data || [];
        currentBook = b;
        currentChapter = ch;
        renderReading(b, ch, v, data);
        showState(false, false, false, true, false);
      })
      .catch(function (e) {
        err('Falha ao carregar versículos:', e.message);
        setError('Falha ao carregar versículos.');
        showState(false, false, true, false, false);
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

  function doSearch() {
    var q = (searchInput && searchInput.value || '').trim();
    if (!q) return;
    var trans = getSelectedTranslations();
    if (trans.length === 0) {
      setError('Selecione ao menos uma versão para pesquisar.');
      showState(false, false, true, false, false);
      return;
    }
    showState(false, true, false, false, false);
    setError('');
    var url = apiBase() + '/api/search?q=' + encodeURIComponent(q) + '&translations=' + trans.map(encodeURIComponent).join(',') + '&limit=80';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json.error) {
          setError(json.detail || json.error);
          showState(false, false, true, false, false);
          return;
        }
        var results = json.results || [];
        showState(false, false, false, false, true);
        searchResults.innerHTML = '';
        var qt = '"';
        if (results.length === 0) {
          searchResults.innerHTML = '<p class="empty-msg">Nenhum versículo encontrado para ' + qt + q + qt + '.</p>';
          return;
        }
        var title = document.createElement('h2');
        title.className = 'reading-header';
        title.textContent = 'Resultados para ' + qt + q + qt;
        searchResults.appendChild(title);
        results.slice(0, 80).forEach(function (r) {
          var div = document.createElement('div');
          div.className = 'search-result-item';
          var ref = r.bookName + ' ' + r.chapter + '.' + r.verse;
          var transName = translationNames[r.translationId] || r.translationId;
          var snippet = (r.text || '').substring(0, 120);
          if (r.text && r.text.length > 120) snippet += '\u2026';
          div.innerHTML = '<span class="ref">' + escapeHtml(ref) + '</span> (' + escapeHtml(transName) + ') ' + escapeHtml(snippet);
          div.style.cursor = 'pointer';
          div.addEventListener('click', function () {
            loadVerses(r.book, r.chapter, r.verse);
            showState(false, false, false, true, false);
          });
          searchResults.appendChild(div);
        });
      })
      .catch(function (e) {
        err('Falha na pesquisa:', e.message);
        setError('Falha ao pesquisar.');
        showState(false, false, true, false, false);
      });
  }

  function goPrevChapter() {
    if (currentBook == null || currentChapter == null) return;
    if (currentChapter > 1) {
      loadVerses(currentBook, currentChapter - 1, null);
    } else if (currentBook > 1) {
      var prevBook = currentBook - 1;
      var maxCh = CHAPTER_COUNTS[prevBook - 1];
      loadVerses(prevBook, maxCh, null);
    }
  }

  function goNextChapter() {
    if (currentBook == null || currentChapter == null) return;
    var maxCh = CHAPTER_COUNTS[currentBook - 1];
    if (currentChapter < maxCh) {
      loadVerses(currentBook, currentChapter + 1, null);
    } else if (currentBook < 66) {
      loadVerses(currentBook + 1, 1, null);
    }
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

  function getFontSize() {
    var v = localStorage.getItem('bibliasaas-font-size');
    return v ? parseInt(v, 10) : 100;
  }

  function setFontSize(percent) {
    percent = Math.max(80, Math.min(140, percent));
    localStorage.setItem('bibliasaas-font-size', String(percent));
    document.documentElement.style.setProperty('--reading-font-size', (percent / 100) + 'rem');
  }

  function initFontSize() {
    setFontSize(getFontSize());
  }

  bookSelect.addEventListener('change', updateChapters);
  btnRead.addEventListener('click', function () { loadVerses(null, null, null); });
  themeToggle.addEventListener('click', toggleTheme);

  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  }

  if (btnPrevChapter) btnPrevChapter.addEventListener('click', goPrevChapter);
  if (btnNextChapter) btnNextChapter.addEventListener('click', goNextChapter);

  if (fontSizeUp) {
    fontSizeUp.addEventListener('click', function () {
      setFontSize(getFontSize() + 10);
    });
  }
  if (fontSizeDown) {
    fontSizeDown.addEventListener('click', function () {
      setFontSize(getFontSize() - 10);
    });
  }

  initTheme();
  initFontSize();
  loadBooks().then(loadTranslations).then(function () {
    if (books.length && translations.length && bookSelect.value) updateChapters();
  });
})();
