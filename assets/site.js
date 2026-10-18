// Program panels: selecting a book (or a track in the hero strip, or a related
// program chip) shows only that program's panel below the bookshelf.
(function () {
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  if (!panels.length) return;
  var books = Array.prototype.slice.call(document.querySelectorAll('.book, .flat'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function open(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.classList.contains('panel')) return false;
    panels.forEach(function (p) { p.hidden = p !== target; });
    books.forEach(function (b) { b.setAttribute('aria-expanded', b.getAttribute('data-open') === id ? 'true' : 'false'); });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (opts.scroll !== false) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (opts.focus) target.querySelector('h3').setAttribute('tabindex', '-1'), target.querySelector('h3').focus({ preventScroll: true });
    return true;
  }

  function close(panel) {
    panel.hidden = true;
    var id = panel.id;
    books.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    var book = document.querySelector('[data-open="' + id + '"].book, [data-open="' + id + '"].flat');
    if (book) book.focus({ preventScroll: true });
    document.getElementById('programs').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open]');
    if (trigger) {
      var id = trigger.getAttribute('data-open');
      var target = document.getElementById(id);
      // Selecting the open book again closes it
      if ((trigger.classList.contains('book') || trigger.classList.contains('flat')) && target && !target.hidden) {
        e.preventDefault();
        close(target);
        return;
      }
      if (open(id, { focus: true })) e.preventDefault();
      return;
    }
    var closer = e.target.closest('.panel-close');
    if (closer) close(closer.closest('.panel'));
  });

  if (location.hash) open(location.hash.slice(1), { scroll: true });
})();

// Rotating track strip in the hero. Rotates every 5 seconds unless the visitor
// prefers reduced motion; pauses on hover or keyboard focus and via the pause button.
(function () {
  var strip = document.querySelector('.track-strip');
  if (!strip) return;
  var tabs = Array.prototype.slice.call(strip.querySelectorAll('[role="tab"]'));
  var slides = Array.prototype.slice.call(strip.querySelectorAll('.strip-slide'));
  var pauseBtn = strip.querySelector('.strip-pause');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0, paused = reduced, hovering = false;

  function show(i, focusTab) {
    current = (i + slides.length) % slides.length;
    strip.setAttribute('data-active', current);
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === current); });
    tabs.forEach(function (t, n) {
      t.setAttribute('aria-selected', n === current ? 'true' : 'false');
      t.tabIndex = n === current ? 0 : -1;
    });
    if (focusTab) tabs[current].focus();
  }

  function setPaused(p) {
    paused = p;
    pauseBtn.innerHTML = p ? '&#9654;' : '&#10074;&#10074;';
    pauseBtn.setAttribute('aria-label', p ? 'Resume rotation' : 'Pause rotation');
  }

  tabs.forEach(function (t, n) {
    t.addEventListener('click', function () { show(n); setPaused(true); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(current + 1, true); setPaused(true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(current - 1, true); setPaused(true); e.preventDefault(); }
    });
  });
  pauseBtn.addEventListener('click', function () { setPaused(!paused); });
  strip.addEventListener('mouseenter', function () { hovering = true; });
  strip.addEventListener('mouseleave', function () { hovering = false; });
  strip.addEventListener('focusin', function () { hovering = true; });
  strip.addEventListener('focusout', function () { hovering = false; });

  setPaused(paused);
  setInterval(function () { if (!paused && !hovering) show(current + 1); }, 5000);
})();
