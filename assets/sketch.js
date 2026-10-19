/* English at UCF: the opening book, the decorative library shelves, and the program panels. */

const INK = '#1B2A4A';
const BOOK = { cover: '#F2B632', deep: '#C98E16', inside: '#F5C85A', page: '#FBF7EE', edge: '#E7DCC4' };
const QUILL = { vane: '#C63D2B', barb: '#F08A72', shaft: '#F7F0E1' };
const GENERIC = ['#C9A24A', '#7F9C6A', '#A85A4A', '#3E5578', '#2A3B5E', '#D8C9A8', '#8E6B4A', '#B5873A', '#5E7F55', '#8C3F35', '#5D7397', '#E0B85A', '#6B8F4E', '#B9473A'];

// Introduction timeline, in milliseconds.
const T = {
  fadeIn: [0, 900],
  open: [1300, 3100],
  quillIn: [3000, 3700],
  write: [3700, 7600],
  quillOut: [7900, 8700],
  exit: [15000, 16400],
  done: 15600,
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ready = false;
let finished = false;
let introStart = 0;
let L = {};
let page = null;       // right-hand page: the handwritten line
let leftPage = null;   // left-hand page: the department statement
let lines = [];

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('stage');
  fillShelves();
  wireDom();

  const fonts = ['48px "Homemade Apple"', '48px "Special Elite"', '16px "Work Sans"']
    .map((f) => document.fonts.load(f));
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  Promise.race([Promise.all(fonts), timeout]).then(() => {
    fitTitles();
    computeLayout();
    ready = true;
    if (reducedMotion) skipIntro();
    else introStart = millis();
  });
}

function computeLayout() {
  const w = width, h = height;
  const portrait = h > w;
  L.ratio = portrait ? 1.5 : 1.35;
  L.W = Math.min(400, w * 0.47, (h * 0.8) / L.ratio);
  L.H = L.W * L.ratio;
  L.x = w / 2;
  L.y = h * 0.48;
  const label = document.querySelector('.label-plate').getBoundingClientRect();
  L.exitX = label.left + label.width / 2;
  L.exitY = label.top + label.height / 2;
  buildPages();
}

function buildPages() {
  const pw = L.W - 8, ph = L.H - 12;

  if (page) page.remove();
  page = createGraphics(Math.ceil(pw), Math.ceil(ph));
  page.textFont('Homemade Apple');
  let size = pw * 0.13;
  page.textSize(size);
  while (page.textWidth('Your story') > pw * 0.74 && size > 8) page.textSize(size -= 0.5);
  const left = pw * 0.12;
  const base1 = ph * 0.43, base2 = base1 + size * 1.7;
  page.fill(INK);
  page.noStroke();
  page.textAlign(LEFT, BASELINE);
  lines = [
    { text: 'Your story', base: base1, x: left },
    { text: 'awaits...', base: base2, x: left + size * 0.6 },
  ].map((ln) => {
    page.text(ln.text, ln.x, ln.base);
    const x0 = ln.x - size * 0.3;
    return { ...ln, x0, x1: x0 + page.textWidth(ln.text) + size * 0.8, top: ln.base - size * 1.25, bot: ln.base + size * 0.75, size };
  });

  if (leftPage) leftPage.remove();
  leftPage = createGraphics(Math.ceil(pw), Math.ceil(ph));
  const statement = document.getElementById('intro-text').textContent.trim();
  const boxW = pw * 0.8, boxH = ph * 0.8;
  leftPage.textFont('Special Elite');
  let ts = pw * 0.07, wrapped;
  for (;;) {
    leftPage.textSize(ts);
    wrapped = wrap(leftPage, statement, boxW);
    if (wrapped.length * ts * 1.45 <= boxH || ts < 7) break;
    ts -= 0.25;
  }
  leftPage.fill(INK);
  leftPage.noStroke();
  leftPage.textAlign(LEFT, TOP);
  const startY = (ph - wrapped.length * ts * 1.45) / 2;
  wrapped.forEach((row, i) => leftPage.text(row, (pw - boxW) / 2 + pw * 0.02, startY + i * ts * 1.45));
}

function wrap(g, str, maxW) {
  const out = [];
  let row = '';
  for (const word of str.split(/\s+/)) {
    const next = row ? row + ' ' + word : word;
    if (g.textWidth(next) > maxW && row) { out.push(row); row = word; } else row = next;
  }
  if (row) out.push(row);
  return out;
}

function draw() {
  clear();
  if (!ready || finished) return;
  const t = millis() - introStart;
  if (t >= T.done) {
    document.body.classList.add('intro-done');
  }
  if (t >= T.exit[1]) {
    finished = true;
    noLoop();
    return;
  }

  const fade = ease(seg(t, T.fadeIn));
  const open = easeInOut(seg(t, T.open));
  const away = easeInOut(seg(t, T.exit));
  const bx = lerp(L.x, L.exitX, away);
  const by = lerp(L.y + (1 - fade) * 30, L.exitY, away);
  const bs = lerp(1, 0.08, away);

  drawBook(bx, by, bs, open, fade * (1 - away * away), t);
  drawQuillAt(t, bx, by);
}

/* ---------- The opening book ---------- */

function drawBook(bx, by, s, open, alpha, t) {
  const W = L.W * s, H = L.H * s, r = 10 * s;
  const top = by - H / 2;
  const spineX = bx - (W / 2) * (1 - open);
  const ctx = drawingContext;
  ctx.save();
  ctx.globalAlpha = alpha;

  noStroke();
  fill(0, 0, 0, 90);
  ellipse(bx, by + H / 2 + 8 * s, lerp(W, 2 * W, open) * 1.08, 20 * s);

  // Back cover and page block (right side).
  fill(BOOK.deep);
  rect(spineX + 3 * s, top + 3 * s, W, H, 0, r, r, 0);
  fill(BOOK.cover);
  rect(spineX, top, W, H, 0, r, r, 0);
  fill(BOOK.page);
  rect(spineX + 2 * s, top + 6 * s, W - 8 * s, H - 12 * s, 0, 5 * s, 5 * s, 0);
  stroke(BOOK.edge);
  strokeWeight(Math.max(0.6, s));
  for (let i = 1; i <= 3; i++) {
    const x = spineX + W - 6 * s - i * 1.6 * s;
    line(x, top + 9 * s, x, top + H - 9 * s);
  }
  noStroke();
  fill(0, 0, 0, 22);
  rect(spineX + 2 * s, top + 6 * s, 14 * s, H - 12 * s);

  if (t >= T.write[0]) drawWriting(spineX + 2 * s, top + 6 * s, s, t);

  // Front cover, hinged at the spine, foreshortened as it swings open.
  const c = Math.cos(PI * open);
  push();
  translate(spineX, 0);
  scale(c === 0 ? 0.0001 : c, 1);
  if (c > 0) {
    fill(lerpColor(color(BOOK.deep), color(BOOK.cover), 0.35 + 0.65 * c));
    rect(0, top, W, H, 0, r, r, 0);
    fill(0, 0, 0, 30);
    rect(13 * s, top, 2.5 * s, H);
    noFill();
    stroke(27, 42, 74, 150);
    strokeWeight(1.5 * s);
    rect(26 * s, top + 22 * s, W - 44 * s, H - 44 * s, 6 * s);
    strokeWeight(0.8 * s);
    rect(31 * s, top + 27 * s, W - 54 * s, H - 54 * s, 4 * s);
    noStroke();
    fill(INK);
    textFont('Special Elite');
    textAlign(CENTER, CENTER);
    textSize(L.W * 0.135 * s);
    text('UCF English', W / 2 + 6 * s, by - 6 * s);
    fill(27, 42, 74, 160);
    rect(W / 2 - 12 * s, by + 22 * s, 36 * s, 1.5 * s, 1 * s);
  } else {
    fill(lerpColor(color(BOOK.deep), color(BOOK.inside), -c));
    rect(0, top, W, H, 0, r, r, 0);
    fill(BOOK.page);
    rect(5 * s, top + 6 * s, W - 11 * s, H - 12 * s, 0, 5 * s, 5 * s, 0);
    fill(0, 0, 0, 18);
    rect(0, top + 6 * s, 12 * s, H - 12 * s);
  }
  pop();

  // The department statement, printed on the left-hand page.
  if (open > 0.9) {
    ctx.save();
    ctx.globalAlpha = alpha * seg(open, [0.9, 1]);
    image(leftPage, spineX - W + 5 * s, top + 6 * s, leftPage.width * s, leftPage.height * s);
    ctx.restore();
  }

  ctx.restore();
}

function drawWriting(px, py, s, t) {
  const reveal = writingProgress(seg(t, T.write));
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  lines.forEach((ln, i) => {
    const x = i < reveal.line ? ln.x1 : i === reveal.line ? reveal.x : ln.x0;
    if (x > ln.x0) ctx.rect(px + ln.x0 * s, py + ln.top * s, (x - ln.x0) * s, (ln.bot - ln.top) * s);
  });
  ctx.clip();
  image(page, px, py, page.width * s, page.height * s);
  ctx.restore();
}

// Constant pen speed across both lines, with a short lift between them.
function writingProgress(p) {
  const lens = lines.map((ln) => ln.x1 - ln.x0);
  const gap = lens[0] * 0.18;
  let d = p * (lens[0] + gap + lens[1]);
  if (d <= lens[0]) return { line: 0, x: lines[0].x0 + d, lifting: false };
  d -= lens[0];
  if (d <= gap) return { line: 1, x: lines[1].x0, lifting: true, lift: d / gap };
  d -= gap;
  return { line: 1, x: lines[1].x0 + Math.min(d, lens[1]), lifting: false };
}

function drawQuillAt(t, bx, by) {
  if (t < T.quillIn[0] || t > T.quillOut[1]) return;
  const px = bx + 2, py = by - L.H / 2 + 6;
  const k = (L.W / 300) * 0.85;

  const pen = (p) => {
    const r = writingProgress(p);
    if (r.lifting) {
      const a = lines[0], b = lines[1];
      return {
        x: lerp(a.x1, b.x0, r.lift),
        y: lerp(a.base, b.base, r.lift) - a.size * (0.9 + Math.sin(PI * r.lift) * 1.2),
      };
    }
    const ln = lines[r.line];
    const wobble = p >= 1 ? 0.6 : 0.45 + 0.35 * Math.sin(t * 0.032) * Math.cos(t * 0.011);
    return { x: r.x, y: ln.base - ln.size * wobble };
  };

  let x, y, alpha = 255;
  if (t < T.write[0]) {
    const q = easeInOut(seg(t, T.quillIn));
    const tip = pen(0);
    x = lerp(px + L.W * 1.3, px + tip.x, q);
    y = lerp(py - L.H * 0.7, py + tip.y, q);
    alpha = 255 * q;
  } else if (t < T.quillOut[0]) {
    const tip = pen(seg(t, T.write));
    x = px + tip.x;
    y = py + tip.y;
  } else {
    const q = easeInOut(seg(t, T.quillOut));
    const tip = pen(1);
    x = lerp(px + tip.x, px + L.W * 1.4, q);
    y = lerp(py + tip.y, py - L.H * 0.8, q);
    alpha = 255 * (1 - q);
  }
  drawQuill(x, y, k, alpha);
}

function drawQuill(x, y, k, a) {
  push();
  translate(x, y);
  rotate(0.5);
  scale(k);
  noStroke();
  fill(0, 0, 0, a * 0.18);
  ellipse(10, 8, 18, 6);
  fill(27, 42, 74, a);
  triangle(0, 0, -3.5, -16, 3.5, -16);
  const vane = color(QUILL.vane); vane.setAlpha(a);
  fill(vane);
  beginShape();
  vertex(0, -46);
  bezierVertex(-30, -88, -34, -160, -6, -214);
  vertex(2, -210);
  bezierVertex(20, -170, 24, -96, 0, -46);
  endShape(CLOSE);
  const barb = color(QUILL.barb); barb.setAlpha(a * 0.8);
  stroke(barb);
  strokeWeight(1.2);
  for (let i = 0; i < 11; i++) {
    const yy = -62 - i * 13;
    line(0, yy, -16 + i * 0.6, yy - 12);
    line(0, yy, 12 - i * 0.4, yy - 10);
  }
  const shaft = color(QUILL.shaft); shaft.setAlpha(a);
  stroke(shaft);
  strokeWeight(2.2);
  line(0, -15, 1, -212);
  pop();
}

/* ---------- Decorative books on the surrounding shelves ---------- */

function fillShelves() {
  const row = document.querySelector('.lower .tier').getBoundingClientRect().height;
  const zoom = Math.max(1, row / 200);
  document.querySelectorAll('.bay.g').forEach((bay) => {
    bay.textContent = '';
    const width = bay.clientWidth;
    let used = 20;
    while (used < width) {
      const roll = Math.random();
      let el;
      if (roll < 0.07) {
        el = document.createElement('div');
        el.className = 'gb-stack';
        const n = 2 + Math.floor(Math.random() * 3);
        let w = 0;
        for (let i = 0; i < n; i++) {
          const b = book(row * random(0.36, 0.5), random(12, 17) * zoom);
          el.appendChild(b);
          w = Math.max(w, parseFloat(b.style.width));
        }
        used += w + 14;
      } else {
        const w = random(16, 34) * zoom;
        el = book(w, row * random(0.62, 0.9));
        if (roll > 0.95) el.classList.add('lean');
        used += w + 2 + (el.classList.contains('lean') ? 18 : 0);
      }
      bay.appendChild(el);
    }
  });
}

function book(w, h) {
  const el = document.createElement('div');
  el.className = 'gb';
  el.style.width = w.toFixed(1) + 'px';
  el.style.height = h.toFixed(1) + 'px';
  el.style.setProperty('--g', random(GENERIC));
  return el;
}

/* ---------- Panels and controls ---------- */

let lastFocus = null;
let modalOpen = false;

function wireDom() {
  const modal = document.querySelector('.modal');
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) { openPanel(opener.dataset.open); return; }
    if (e.target.closest('.panel-close') || e.target.classList.contains('modal-backdrop')) closePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOpen) closePanel();
  });
  document.querySelector('.skip-intro').addEventListener('click', skipIntro);
  document.querySelector('.replay').addEventListener('click', replay);
  modal.querySelectorAll('.panel').forEach((p) => { p.hidden = true; });
  loadCourseDescriptions();
}

// Replace the short course summaries with the department's own descriptions (assets/courses.json,
// refreshed by tools/fetch_courses.py). Courses without a current description keep their summary.
async function loadCourseDescriptions() {
  let data;
  try {
    data = await (await fetch('assets/courses.json')).json();
  } catch (err) {
    return;
  }
  document.querySelectorAll('.panel').forEach((panel) => {
    let used = false;
    panel.querySelectorAll('details').forEach((det) => {
      const m = (det.querySelector('.code')?.textContent || '').match(/^([A-Z]{3}) (\d{4})(?: \/ (\d{4}))?$/);
      if (!m) return;
      const found = [m[2], m[3]].filter(Boolean)
        .map((num) => ({ label: m[1] + ' ' + num, course: data.courses[m[1] + num] }))
        .filter((f) => f.course);
      if (!found.length) return;

      const body = document.createElement('div');
      body.className = 'course-desc';
      let described = false;
      found.forEach(({ label, course }) => {
        if (!course.description.length) return;
        if (found.length > 1 || m[3]) addEl(body, 'h5', `${label}: ${course.title}`);
        course.description.forEach((text) => addEl(body, 'p', text));
        described = true;
      });
      const summary = det.querySelector(':scope > p');
      if (described && summary) summary.replaceWith(body);
      used = used || described;
    });
    if (used) {
      const note = addEl(panel.querySelector('.panel-courses'), 'p', 'Course descriptions from the Department of English course listings. ');
      note.className = 'source-note';
      addEl(note, 'a', 'View all courses').href = data.source;
    }
  });
}

function addEl(parent, tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

function openPanel(id) {
  const modal = document.querySelector('.modal');
  const panel = document.getElementById(id);
  if (!panel) return;
  if (!modalOpen) lastFocus = document.activeElement;
  modal.querySelectorAll('.panel').forEach((p) => { p.hidden = p !== panel; });
  modal.setAttribute('aria-labelledby', id + '-title');
  modal.hidden = false;
  modal.querySelector('.modal-sheet').scrollTop = 0;
  modalOpen = true;
  panel.querySelector('.panel-close').focus();
}

function closePanel() {
  document.querySelector('.modal').hidden = true;
  modalOpen = false;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function skipIntro() {
  finished = true;
  noLoop();
  clear();
  document.body.classList.add('intro-done');
}

function replay() {
  if (reducedMotion) return;
  document.body.classList.remove('intro-done');
  finished = false;
  introStart = millis();
  loop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fillShelves();
  fitTitles();
  if (ready) computeLayout();
  if (finished) redraw();
}

// Every program title must show in full: if one overflows its book, step its type size down until it fits.
// Books of the same kind then share the smallest size, so the shelf reads evenly.
function fitTitles() {
  ['.spine.major', '.spine.flat', '.spine.minor'].forEach((kind) => {
    const titles = [...document.querySelectorAll(kind + ' .title')];
    const sizes = titles.map((el) => {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      while ((el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && size > 10) {
        size -= 0.5;
        el.style.fontSize = size + 'px';
      }
      return size;
    });
    const shared = Math.min(...sizes);
    titles.forEach((el) => { el.style.fontSize = shared + 'px'; });
  });
}

/* ---------- Helpers ---------- */

function seg(t, [a, b]) { return constrain((t - a) / (b - a), 0, 1); }
function ease(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
