// Rotating track strip in the hero. Rotates every 5 seconds unless the visitor
// prefers reduced motion; pauses on hover or keyboard focus and via the pause button.
(function () {
  var strip = document.querySelector('.track-strip');
  if (!strip) return;
  var tabs = Array.prototype.slice.call(strip.querySelectorAll('[role="tab"]'));
  var slides = Array.prototype.slice.call(strip.querySelectorAll('.strip-slide'));
  var pauseBtn = strip.querySelector('.strip-pause');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0, timer = null, paused = reduced, hovering = false;

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

  function tick() { if (!paused && !hovering) show(current + 1); }

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
  timer = setInterval(tick, 5000);
})();
