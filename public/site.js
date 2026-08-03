/* luauengine.org — theme toggle, mobile nav, copy buttons, TOC scrollspy, search. */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------------------------------------------------------- theme */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    var label = document.querySelector('.theme-label');
    if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#e6e7ea');
  }
  applyTheme(root.getAttribute('data-theme') || 'dark');

  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ----------------------------------------------------------- mobile nav */
  var navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* --------------------------------------------------------------- copy */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.copy') : null;
    if (!btn) return;
    var block = btn.closest('.codeblock');
    var code = block && block.querySelector('code');
    if (!code) return;
    var text = code.innerText;
    var done = function () {
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (err) {}
      document.body.removeChild(ta);
    }
  });

  /* --------------------------------------------------------- TOC scrollspy */
  var tocLinks = [].slice.call(document.querySelectorAll('.docs-toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) {
      byId[a.getAttribute('href').slice(1)] = a;
    });
    var headings = Object.keys(byId)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    var visible = new Set();
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) visible.add(en.target.id);
          else visible.delete(en.target.id);
        });
        var current = null;
        for (var i = 0; i < headings.length; i++) {
          if (visible.has(headings[i].id)) {
            current = headings[i].id;
            break;
          }
        }
        if (!current) return;
        tocLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
      },
      { rootMargin: '-70px 0px -70% 0px' }
    );
    headings.forEach(function (h) {
      spy.observe(h);
    });
  }

  /* -------------------------------------------------------------- search */
  var modal = document.querySelector('.search-modal');
  if (!modal) return;

  var input = modal.querySelector('input');
  var resultsEl = modal.querySelector('.search-results');
  var emptyEl = modal.querySelector('.search-empty');
  var trigger = document.querySelector('.search-trigger');
  var index = null;
  var loading = false;
  var activeIdx = -1;
  var current = [];

  function loadIndex() {
    if (index || loading) return;
    loading = true;
    fetch('/search-index.json')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        index = data;
        loading = false;
        if (input.value) render(input.value);
      })
      .catch(function () {
        loading = false;
        emptyEl.textContent = 'Search is unavailable right now.';
      });
  }

  function open() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    loadIndex();
    setTimeout(function () {
      input.focus();
      input.select();
    }, 10);
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    activeIdx = -1;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = lower.indexOf(terms[i]);
    if (at < 0) at = 0;
    var start = Math.max(0, at - 40);
    var raw = (start > 0 ? '…' : '') + text.slice(start, start + 160).trim();
    var out = escapeHtml(raw);
    terms.forEach(function (t) {
      if (!t) return;
      out = out.replace(
        new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
        '<mark>$1</mark>'
      );
    });
    return out;
  }

  function score(entry, terms) {
    var title = entry.t.toLowerCase();
    var desc = (entry.d || '').toLowerCase();
    var text = (entry.x || '').toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var hit = 0;
      if (title === t) hit += 120;
      if (title.indexOf(t) >= 0) hit += 60;
      if (desc.indexOf(t) >= 0) hit += 20;
      var pos = text.indexOf(t);
      if (pos >= 0) hit += 12 + Math.max(0, 8 - Math.floor(pos / 200));
      if (!hit) return 0; // every term must appear somewhere
      total += hit;
    }
    return total;
  }

  function render(query) {
    var q = query.trim().toLowerCase();
    if (!q) {
      resultsEl.innerHTML = '';
      emptyEl.hidden = false;
      emptyEl.textContent = 'Start typing to search the documentation.';
      current = [];
      return;
    }
    if (!index) {
      emptyEl.hidden = false;
      emptyEl.textContent = 'Loading search index…';
      return;
    }

    var terms = q.split(/\s+/).filter(Boolean);
    current = index
      .map(function (e) {
        return { e: e, s: score(e, terms) };
      })
      .filter(function (r) {
        return r.s > 0;
      })
      .sort(function (a, b) {
        return b.s - a.s;
      })
      .slice(0, 12)
      .map(function (r) {
        return r.e;
      });

    if (!current.length) {
      resultsEl.innerHTML = '';
      emptyEl.hidden = false;
      emptyEl.textContent = 'No results for “' + query + '”.';
      return;
    }

    emptyEl.hidden = true;
    activeIdx = 0;
    resultsEl.innerHTML = current
      .map(function (e, i) {
        return (
          '<a class="search-result' +
          (i === 0 ? ' active' : '') +
          '" href="' +
          e.u +
          '" role="option">' +
          '<span class="sr-section">' +
          escapeHtml(e.s) +
          '</span>' +
          '<span class="sr-title">' +
          escapeHtml(e.t) +
          '</span>' +
          '<span class="sr-snippet">' +
          snippet(e.d || e.x || '', terms) +
          '</span></a>'
        );
      })
      .join('');
  }

  function move(delta) {
    var items = resultsEl.querySelectorAll('.search-result');
    if (!items.length) return;
    items[activeIdx] && items[activeIdx].classList.remove('active');
    activeIdx = (activeIdx + delta + items.length) % items.length;
    items[activeIdx].classList.add('active');
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  if (trigger) trigger.addEventListener('click', open);
  modal.querySelector('.search-backdrop').addEventListener('click', close);
  input.addEventListener('input', function () {
    render(input.value);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      var items = resultsEl.querySelectorAll('.search-result');
      if (items[activeIdx]) {
        e.preventDefault();
        window.location.href = items[activeIdx].getAttribute('href');
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.hidden ? open() : close();
    } else if (e.key === 'Escape' && !modal.hidden) {
      close();
    } else if (e.key === '/' && modal.hidden) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        open();
      }
    }
  });
})();
