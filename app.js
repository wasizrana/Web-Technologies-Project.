

const QUESTIONS_PER_ROUND = 5;
const SECONDS_PER_QUESTION = 20;

const BANK = [
  { q: 'Which HTML element is the best semantic choice for a block of main navigation links?',
    a: ['<nav>', '<div class="menu">', '<section>', '<aside>'], c: 0,
    why: '<nav> tells browsers and screen readers that the links inside are major navigation.' },
  { q: 'Which CSS declaration turns an element into a flex container?',
    a: ['position: flex;', 'display: flex;', 'flex: container;', 'layout: flex;'], c: 1,
    why: 'display: flex makes the element a flex container and its children flex items.' },
  { q: 'What does the === operator do in JavaScript?',
    a: ['Assigns a value', 'Compares values after type conversion', 'Compares value and type with no conversion', 'Checks only the type'], c: 2,
    why: '=== is strict equality: both the value and the type must match.' },
  { q: 'In Tailwind CSS, which classes hide an element on small screens and show it from the md breakpoint up?',
    a: ['hidden md:block', 'md:hidden block', 'show-md', 'invisible md:visible'], c: 0,
    why: 'hidden applies everywhere; md:block overrides it at the md breakpoint and above.' },
  { q: 'How many columns does the Bootstrap grid system divide a row into?',
    a: ['6', '10', '12', '16'], c: 2,
    why: 'Bootstrap rows use a 12-column grid, so col-6 is half the width.' },
  { q: 'What does this code print to the console?', code: 'console.log(typeof null);',
    a: ['"null"', '"object"', '"undefined"', '"number"'], c: 1,
    why: 'typeof null returns "object" – a long-standing quirk of the language.' },
  { q: 'Which CSS unit is relative to the font size of the root (html) element?',
    a: ['em', 'px', 'rem', 'vh'], c: 2,
    why: 'rem is based on the root font size, which keeps spacing consistent across the page.' },
  { q: 'Which array method adds one or more items to the end of an array?',
    a: ['unshift()', 'push()', 'shift()', 'concat()'], c: 1,
    why: 'push() appends to the end and returns the new length; unshift() adds to the start.' },
  { q: 'Which media query applies styles only when the viewport is 600px wide or narrower?',
    a: ['@media (min-width: 600px)', '@media screen only 600', '@media (max-width: 600px)', '@viewport (600px)'], c: 2,
    why: 'max-width queries target viewports up to and including the given width.' },
  { q: 'How long does data saved with localStorage stay in the browser?',
    a: ['Until the tab closes', 'Until the page reloads', 'For 24 hours', 'Until it is cleared by the user or by code'], c: 3,
    why: 'localStorage has no expiry; sessionStorage is the one that ends with the tab.' }
];

const LETTERS = ['A', 'B', 'C', 'D'];
const $app = document.getElementById('app');
let st = null;           // current round state
let timerId = null;


const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function newRound() {
  const picked = shuffle(BANK).slice(0, QUESTIONS_PER_ROUND).map(item => {
    const opts = shuffle(item.a.map((text, i) => ({ text, ok: i === item.c })));
    return { q: item.q, code: item.code, why: item.why, opts };
  });
  st = { qs: picked, i: 0, res: [], left: SECONDS_PER_QUESTION, locked: false };
}
function segBar() {
  return '<div class="segbar" role="progressbar" aria-valuemin="0" aria-valuemax="' + st.qs.length +
    '" aria-valuenow="' + st.res.length + '">' +
    st.qs.map((_, k) => {
      const r = st.res[k];
      const cls = r ? r.status : (k === st.i && !st.done ? 'current' : '');
      return '<span class="seg ' + cls + '"></span>';
    }).join('') + '</div>';
}


function showStart() {
  clearInterval(timerId);
  st = null;
  $app.innerHTML = `
    <h2 class="text-2xl sm:text-3xl font-bold">Ready to test your front-end skills?</h2>
    <p class="mt-3 text-slate-600 dark:text-slate-300">Five random questions on HTML, CSS, JavaScript, Tailwind and Bootstrap, drawn from a pool of ${BANK.length}.</p>
    <ul class="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
      <li class="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><b>${SECONDS_PER_QUESTION} seconds</b><br><span class="text-slate-500 dark:text-slate-400">per question, then it locks</span></li>
      <li class="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><b>Instant feedback</b><br><span class="text-slate-500 dark:text-slate-400">correct and wrong answers are highlighted</span></li>
      <li class="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><b>PDF result</b><br><span class="text-slate-500 dark:text-slate-400">download your score sheet at the end</span></li>
    </ul>
    <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
      <span class="flex items-center gap-2"><span class="seg correct" style="width:28px"></span>Correct</span>
      <span class="flex items-center gap-2"><span class="seg wrong" style="width:28px"></span>Wrong</span>
      <span class="flex items-center gap-2"><span class="seg timeout" style="width:28px"></span>Time ran out</span>
    </div>
    <button id="startBtn" class="btn btn-primary mt-7 w-full sm:w-auto" type="button">Start quiz</button>`;
  document.getElementById('startBtn').onclick = () => { newRound(); showQuestion(); };
}

function showQuestion() {
  clearInterval(timerId);
  const q = st.qs[st.i];
  st.left = SECONDS_PER_QUESTION; st.locked = false;
  $app.innerHTML = `
    <div class="flex items-center justify-between text-sm mb-3">
      <span class="font-semibold">Question ${st.i + 1} of ${st.qs.length}</span>
      <span id="timeTxt" class="font-mono tabular-nums text-slate-600 dark:text-slate-300">${st.left}s</span>
    </div>
    ${segBar()}
    <div class="timer-track mt-4" aria-hidden="true"><div id="timeFill" class="timer-fill"></div></div>
    <h2 class="mt-6 text-xl sm:text-2xl font-semibold leading-snug">${esc(q.q)}</h2>
    ${q.code ? '<pre class="code"><code>' + esc(q.code) + '</code></pre>' : ''}
    <div id="opts" class="mt-5 grid gap-3">
      ${q.opts.map((o, k) => `<button type="button" class="opt" data-k="${k}"><span class="key">${LETTERS[k]}</span><span>${esc(o.text)}</span></button>`).join('')}
    </div>
    <div id="fb" class="mt-5" aria-live="polite"></div>`;
  document.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.k));
  timerId = setInterval(tick, 1000);
}

function tick() {
  st.left--;
  const txt = document.getElementById('timeTxt'), fill = document.getElementById('timeFill');
  if (!txt) return;
  txt.textContent = st.left + 's';
  fill.style.transform = 'scaleX(' + Math.max(st.left, 0) / SECONDS_PER_QUESTION + ')';
  fill.classList.toggle('low', st.left <= 5);
  if (st.left <= 0) answer(-1);
}

function answer(k) {
  if (st.locked) return;
  st.locked = true;
  clearInterval(timerId);
  const q = st.qs[st.i];
  const status = k === -1 ? 'timeout' : (q.opts[k].ok ? 'correct' : 'wrong');
  st.res.push({ chosen: k, status });

  document.querySelectorAll('.opt').forEach((b, idx) => {
    b.disabled = true;
    if (q.opts[idx].ok) b.classList.add('correct');
    else if (idx === k) b.classList.add('wrong');
    else b.classList.add('dim');
  });

  document.querySelector('.segbar').outerHTML = segBar().replace('seg current', 'seg');

  const label = { correct: 'Correct.', wrong: 'Not quite.', timeout: 'Time is up.' }[status];
  const cls = { correct: 'ok', wrong: 'no', timeout: 'to' }[status];
  const last = st.i === st.qs.length - 1;
  document.getElementById('fb').innerHTML = `
    <div class="feedback ${cls} rounded-r-xl bg-slate-50 dark:bg-slate-800/60 p-4">
      <p class="font-semibold">${label}</p>
      <p class="text-sm mt-1 text-slate-600 dark:text-slate-300">${esc(q.why)}</p>
    </div>
    <button id="nextBtn" type="button" class="btn btn-primary mt-4 w-full sm:w-auto">${last ? 'See results' : 'Next question'}</button>`;
  const nb = document.getElementById('nextBtn');
  nb.onclick = next; nb.focus();
}

function next() {
  if (st.i < st.qs.length - 1) { st.i++; showQuestion(); } else showResults();
}

function showResults() {
  clearInterval(timerId);
  st.done = true;
  const score = st.res.filter(r => r.status === 'correct').length;
  const total = st.qs.length;
  const msg = score === total ? 'Perfect round.' : score >= total - 1 ? 'Strong result.' : score >= Math.ceil(total / 2) ? 'Good effort, a little revision will help.' : 'Keep practising and try again.';
  $app.innerHTML = `
    <h2 class="text-2xl sm:text-3xl font-bold">You scored ${score} out of ${total}</h2>
    <p class="mt-2 text-slate-600 dark:text-slate-300">${msg}</p>
    <div class="mt-5">${segBar()}</div>
    <ol class="mt-6 grid gap-3">
      ${st.qs.map((q, k) => {
        const r = st.res[k];
        const correct = q.opts.find(o => o.ok).text;
        const yours = r.chosen === -1 ? 'No answer (time ran out)' : q.opts[r.chosen].text;
        const badge = { correct: 'Correct', wrong: 'Wrong', timeout: 'Timed out' }[r.status];
        return `<li class="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div class="flex items-start justify-between gap-3">
            <p class="font-medium">${k + 1}. ${esc(q.q)}</p>
            <span class="seg badge ${r.status}">${badge}</span>
          </div>
          <p class="text-sm mt-2 text-slate-600 dark:text-slate-300">Your answer: <b>${esc(yours)}</b></p>
          ${r.status !== 'correct' ? '<p class="text-sm text-slate-600 dark:text-slate-300">Correct answer: <b>' + esc(correct) + '</b></p>' : ''}
        </li>`;
      }).join('')}
    </ol>
    <div class="mt-7 flex flex-col sm:flex-row gap-3">
      <button id="pdfBtn" type="button" class="btn btn-primary">Download result as PDF</button>
      <button id="againBtn" type="button" class="btn btn-ghost">Try new questions</button>
    </div>`;
  document.getElementById('pdfBtn').onclick = downloadPdf;
  document.getElementById('againBtn').onclick = () => { newRound(); showQuestion(); };
}


function pdfSafe(s) {
  return String(s).replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7e]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function wrapText(text, size, maxW) {
  const maxChars = Math.floor(maxW / (size * 0.5));
  const words = String(text).split(/\s+/), lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  return lines;
}
function buildPdf() {
  const W = 595, H = 842, M = 48;
  const pages = []; let ops = [], y = H - M;
  const hex = h => [1, 3, 5].map(i => (parseInt(h.substr(i, 2), 16) / 255).toFixed(3)).join(' ');
  const text = (s, x, size, bold, color) => ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${hex(color || '#1e293b')} rg ${x} ${y} Td (${pdfSafe(s)}) Tj ET`);
  const rect = (x, yy, w, h, color) => ops.push(`${hex(color)} rg ${x} ${yy} ${w} ${h} re f`);
  const newPage = () => { pages.push(ops.join('\n')); ops = []; y = H - M; };
  const need = h => { if (y - h < M) newPage(); };

  const score = st.res.filter(r => r.status === 'correct').length;
  const colors = { correct: '#0f9d7a', wrong: '#e5484d', timeout: '#f0a020' };
  rect(0, H - 110, W, 110, '#5b5bd6');
  y = H - 56; text('Stack Check - Quiz Result', M, 24, true, '#ffffff');
  y -= 22; text('CSC336 Web Technologies | ' + new Date().toLocaleString(), M, 10, false, '#e0e0ff');
  y = H - 150; text(`Score: ${score} / ${st.qs.length}`, M, 20, true);
  y -= 20;
  const bw = (W - 2 * M - 6 * (st.qs.length - 1)) / st.qs.length;
  st.res.forEach((r, k) => rect(M + k * (bw + 6), y - 4, bw, 8, colors[r.status]));
  y -= 34;

  st.qs.forEach((q, k) => {
    const r = st.res[k];
    const qLines = wrapText(`${k + 1}. ${q.q}`, 12, W - 2 * M - 12);
    const yours = r.chosen === -1 ? 'No answer (time ran out)' : q.opts[r.chosen].text;
    const correct = q.opts.find(o => o.ok).text;
    need(qLines.length * 15 + 70);
    rect(M, y - 52 - qLines.length * 15 + 12, 4, qLines.length * 15 + 52, colors[r.status]);
    qLines.forEach(l => { text(l, M + 14, 12, true); y -= 15; });
    y -= 4; text('Your answer: ' + yours, M + 14, 10.5); y -= 15;
    text('Correct answer: ' + correct, M + 14, 10.5, false, '#0f7a60'); y -= 15;
    text('Result: ' + { correct: 'Correct', wrong: 'Wrong', timeout: 'Timed out' }[r.status], M + 14, 10.5, true, colors[r.status]);
    y -= 28;
  });
  pages.push(ops.join('\n'));

  const objs = [];
  const add = s => { objs.push(s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('PLACEHOLDER');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach(content => {
    const cId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pId = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cId} 0 R >>`);
    kids.push(pId + ' 0 R');
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}
function downloadPdf() {
  const url = URL.createObjectURL(buildPdf());
  const a = document.createElement('a');
  a.href = url; a.download = 'quiz-result.pdf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


document.addEventListener('keydown', e => {
  if (!st) { if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') document.getElementById('startBtn')?.click(); return; }
  if (st.done) return;
  if (!st.locked && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
  else if (st.locked && e.key === 'Enter' && document.activeElement.id !== 'nextBtn') next();
});

showStart();
