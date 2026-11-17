/* V7: one script for every page. Each part runs only where its elements exist.
   The globe and the location maps share the land and industrial-site data. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const S = window.SUMMIT || { cities: [], t: {} }, T = k => (S.t && S.t[k]) || k;
  const D2R = Math.PI / 180;
  const fmtTime = tz => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) { return ''; } };
  const coord = c => `${Math.abs(c.lat).toFixed(2)}° ${c.lat >= 0 ? 'N' : 'S'}  ${Math.abs(c.lon).toFixed(2)}° ${c.lon >= 0 ? 'E' : 'W'}`;

  /* ---------------- header: solid once scrolled, a fine reading line, the language menu */
  const nav = $('.nav');
  if (nav) {
    const onScroll = () => { nav.classList.toggle('scrolled', scrollY > 24); nav.style.setProperty('--p', (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4)); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  $$('[data-lang-menu]').forEach(m => { const b = $('.lang-btn', m); if (!b) return;
    b.addEventListener('click', e => { e.stopPropagation(); m.classList.toggle('open'); });
    document.addEventListener('click', () => m.classList.remove('open')); });

  /* ---------------- quiet reveals */
  $$('.rv-auto > *, .rec-item, .quotes, .q-bars, .guide-panel, .people li, .sec-head, .about .label, .pg-block').forEach(el => el.classList.add('rv'));
  $$('.rec-item, .people li').forEach((el, i) => el.style.transitionDelay = `${(i % 6) * 60}ms`);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------------- live local times, wherever a [data-tz] sits */
  const tick = () => $$('[data-tz]').forEach(el => { el.textContent = fmtTime(el.dataset.tz); });
  tick(); setInterval(tick, 15000);
  /* ---------------- five windows: the sky over each city right now, from the sun's real position */
  const skyNow = () => { const d = new Date(), n = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
    return { dec: -23.44 * Math.cos(2 * Math.PI / 365 * (n + 10)) * D2R, lonS: (12 - (d.getUTCHours() + d.getUTCMinutes() / 60)) * 15 * D2R }; };
  const SKY = [[-18, [6, 8, 14], [12, 16, 28]], [-9, [12, 18, 38], [36, 40, 66]], [-3, [26, 36, 74], [150, 104, 104]], [2, [58, 84, 132], [232, 160, 120]],
               [9, [104, 140, 192], [236, 204, 176]], [25, [128, 164, 214], [214, 228, 242]], [70, [118, 158, 212], [226, 236, 247]]];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const skyAt = e => { let k = 0; while (k < SKY.length - 2 && e > SKY[k + 1][0]) k++; const [e0, t0c, b0] = SKY[k], [e1, t1c, b1] = SKY[k + 1], t = Math.max(0, Math.min(1, (e - e0) / (e1 - e0))); return [mix(t0c, t1c, t), mix(b0, b1, t)]; };
  const paintSkies = () => { const { dec, lonS } = skyNow();
    $$('.sky').forEach(el => { const la = +el.dataset.lat * D2R, lo = +el.dataset.lon * D2R;
      let h = lo - lonS; while (h > Math.PI) h -= 2 * Math.PI; while (h < -Math.PI) h += 2 * Math.PI;
      const e = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(h)) / D2R, [top, bot] = skyAt(e), night = e < -4;
      el.style.background = `linear-gradient(180deg, rgb(${top}) 0%, rgb(${bot}) 100%)`;
      const er = e * D2R, az = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(la) - Math.tan(dec) * Math.cos(la)) / D2R + 180;   /* bearing of the sun, 0 north, 90 east */
      const orb = $('.orb', el), bearing = night ? (az + 180) % 360 : az, xPos = 50 + Math.max(-46, Math.min(46, (bearing - 180) / 130 * 46));
      orb.style.left = `${xPos.toFixed(1)}%`; orb.style.top = `${(night ? 28 : 86 - Math.max(-6, Math.min(70, e)) / 70 * 66).toFixed(1)}%`;
      el.classList.toggle('night', night); }); };
  paintSkies(); setInterval(paintSkies, 60000);
  $$('[data-goto]').forEach(a => a.addEventListener('click', e => { const i = +a.dataset.goto; if (window.__goto) { e.preventDefault(); window.__goto(i); } }));

  /* ---------------- quotes: one at a time; they move on by themselves while in view, and wait while the reader hovers */
  const qs = $$('.q');
  if (qs.length) {
    let qi = 0; const at = $('.q-at b'), prog = $('.q-prog'), vp = $('.voice-panel'), ph = $$('.v-photos img');
    const showQ = n => { qi = (n + qs.length) % qs.length; qs.forEach((q, i) => q.classList.toggle('on', i === qi)); ph.forEach((p, i) => p.classList.toggle('on', i === qi)); if (at) at.textContent = qi + 1;
      if (prog) { prog.classList.remove('run'); void prog.offsetWidth; prog.classList.add('run'); } };
    $('.q-prev')?.addEventListener('click', () => showQ(qi - 1)); $('.q-next')?.addEventListener('click', () => showQ(qi + 1));
    if (prog && !RM && vp) {
      prog.addEventListener('animationend', () => showQ(qi + 1));
      new IntersectionObserver(es => es.forEach(en => vp.classList.toggle('in-view', en.isIntersecting)), { threshold: .45 }).observe(vp);
    } else if (prog) prog.hidden = true;
    showQ(0);
  }

  /* ---------------- the menu on small screens */
  const mb = $('.menu-btn'), menu = $('#menu');
  if (mb && menu) {
    const setMenu = open => { menu.hidden = !open; mb.setAttribute('aria-expanded', open); document.body.classList.toggle('menu-on', open); if (open) $('a', menu).focus(); else mb.focus(); };
    mb.addEventListener('click', () => setMenu(menu.hidden));
    $('.menu-x', menu).addEventListener('click', () => setMenu(false));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    menu.addEventListener('keydown', e => { if (e.key !== 'Tab') return; const f = $$('a, button', menu), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
  }

  /* ---------------- the handbook: the cover opens, a page turns */
  const book = $('#book');
  if (book) {
    const prev = $('.bc-prev'), next = $('.bc-next'), lab = $('.bc-l');
    const L = [T('Open the book'), T('Contents, 1 of 2'), T('Contents, 2 of 2')];
    const setPage = n => { n = Math.max(0, Math.min(2, n)); book.dataset.page = n; lab.textContent = L[n]; prev.disabled = n === 0; next.disabled = n === 2; };
    next.addEventListener('click', () => setPage(+book.dataset.page + 1)); prev.addEventListener('click', () => setPage(+book.dataset.page - 1));
    book.addEventListener('click', () => { const n = +book.dataset.page; setPage(n === 2 ? 0 : n + 1); });
    setPage(0);
  }

  /* ---------------- forms: check, send to the endpoint when one is set, then show what happens next */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  $$('form[data-form]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    let bad = null;
    $$('[required]', f).forEach(i => { const v = (i.value || '').trim(), ok = i.type === 'email' ? EMAIL.test(v) : !!v; i.closest('label')?.classList.toggle('bad', !ok); if (!ok && !bad) bad = i; });
    if (bad) { bad.focus(); return; }
    const data = {}; for (const [k, v] of new FormData(f).entries()) data[k] = data[k] ? data[k] + '; ' + v : v;
    const err = $('.fm-err', f) || $('.fm-err', f.parentElement), say = msg => { if (err) { err.textContent = msg; err.hidden = false; } };
    if (err) err.hidden = true;
    const fid = S.formspree;
    if (!fid) { say(T('Requests are not connected yet. Please write to {m}.').replace('{m}', S.contact || 'summit@intuigence.ai')); return; }
    /* one Formspree form takes every request; the kind of request travels with it */
    const btn = $('button[type=submit]', f), label0 = btn.textContent; btn.disabled = true; btn.textContent = T('Sending');
    let ok = false;
    try { const r = await fetch(`https://formspree.io/f/${fid}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ request: f.dataset.form, ...data, page: location.href, _subject: `Summit request: ${f.dataset.form}` }) }); ok = r.ok; } catch (x) { ok = false; }
    btn.disabled = false; btn.textContent = label0;
    if (!ok) { say(T('We could not send this. Please try again, or write to {m}.').replace('{m}', S.contact || 'summit@intuigence.ai')); return; }
    const done = $('#' + f.dataset.done);
    if (done) { $$('[data-echo]', done).forEach(el => el.textContent = data[el.dataset.echo] || ''); f.hidden = true; done.hidden = false; done.classList.add('in'); done.focus?.(); f.closest('.wz-main')?.classList.add('finished'); }
  }));

  /* ---------------- the request: one question at a time, single answers move on by themselves */
  const wz = $('.wz-form');
  if (wz) {
    const steps = $$('.wz-step', wz), prev = $('.wz-prev'), next = $('.wz-next'), sub = $('.wz-submit'), bar = $('.wz-bar i'), at = $('.wz-at');
    let i = 0;
    const valid = st => {
      if (st.dataset.kind === 'fields') { let ok = true; $$('input', st).forEach(inp => { const v = inp.value.trim(), g = inp.type === 'email' ? EMAIL.test(v) : !!v; inp.closest('label').classList.toggle('bad', !g); if (!g && ok) { inp.focus(); ok = false; } }); return ok; }
      const n = $$('input:checked', st).length; st.classList.toggle('need', !n); return n > 0; };
    const show = n => {
      const dir = n >= i ? 1 : -1; steps[i].hidden = true; i = n; const st = steps[i]; st.hidden = false; st.classList.remove('need');
      st.style.setProperty('--dir', dir); st.classList.remove('enter'); void st.offsetWidth; st.classList.add('enter');
      prev.disabled = i === 0; const last = i === steps.length - 1; next.hidden = last; sub.hidden = !last;
      const qn = steps.length - 1; bar.style.transform = `scaleX(${Math.min(1, (i + 1) / qn).toFixed(3)})`; at.textContent = Math.min(i + 1, qn); $('.wz-count')?.classList.toggle('hide', i >= qn);
      if (st.dataset.kind === 'fields') $('input', st).focus({ preventScroll: true }); };
    next.addEventListener('click', () => { if (valid(steps[i])) show(i + 1); });
    prev.addEventListener('click', () => { if (i) show(i - 1); });
    wz.addEventListener('change', e => { const st = steps[i], inp = e.target; st.classList.remove('need');
      const box = inp.closest('.wz-opts'); if (box && box.dataset.max && $$('input:checked', box).length > +box.dataset.max) inp.checked = false;
      /* one answer moves on at once; "up to two" moves on once the second is ticked */
      const full = box && box.dataset.max && inp.checked && $$('input:checked', box).length === +box.dataset.max;
      if ((st.dataset.kind === 'one' || full) && i < steps.length - 1) setTimeout(() => { if (steps[i] === st) show(i + 1); }, RM ? 0 : (full ? 480 : 340)); });
    addEventListener('keydown', e => { const st = steps[i]; if (!st || st.hidden || st.dataset.kind === 'fields' || e.metaKey || e.ctrlKey || e.altKey || !/^[a-f]$/i.test(e.key) || /INPUT|TEXTAREA/.test(document.activeElement?.tagName) && document.activeElement.type !== 'radio' && document.activeElement.type !== 'checkbox') return;
      const opt = $$('.opt input', st)[e.key.toLowerCase().charCodeAt(0) - 97]; if (opt) { opt.click(); } });
    wz.addEventListener('keydown', e => { if (e.key !== 'Enter') return; e.preventDefault(); if (i < steps.length - 1) next.click(); else if (valid(steps[i])) wz.requestSubmit(); });
    wz.addEventListener('submit', e => { if (!valid(steps[i])) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      /* three chapters for where they are, each with the answer that led to it */
      const plan = $('.wz-plan'); if (!plan) return; const picked = [];
      ['obstacles', 'platform', 'stage', 'data'].flatMap(nm => $$('input[name="' + nm + '"]:checked', wz)).forEach(inp => (inp.dataset.ch || '').split(' ').filter(Boolean).forEach(c => { if (!picked.some(p => p[0] === c)) picked.push([c, inp.closest('.opt').querySelector('.opt-t').textContent]); }));
      if (picked.length < 3) ['1', '5', '7'].forEach(c => { if (!picked.some(p => p[0] === c)) picked.push([c, '']); });
      $$('li', plan).forEach(li => li.hidden = true);
      picked.slice(0, 3).forEach(([c, why], k) => { const li = $(`li[data-ch="${c}"]`, plan); if (!li) return; li.hidden = false; li.style.order = k; $('.why', li).textContent = why; $('.why', li).hidden = !why; }); }, true);
    show(0);
  }

  /* ---------------- the name: IA and AI joined by a process line, as on a plant drawing
     The line leaves IA through a flange, runs past SUMMIT, through one valve, and arrives at AI through a flange.
     Flow arrows move slowly along it; pointing at the name opens the valve and the flow quickens. */
  const pipeT = $('.title.caps');
  if (pipeT) {
    const svg = $('.pipe', pipeT), line = $('.pipe-l', svg), fl = $('.flanges', svg), valve = $('.valve', svg), NS = 'http://www.w3.org/2000/svg';
    let L = 0, vAt = 0, t0 = performance.now(), fast = 0, seen = true, ready = false;
    const mk = (tag, a) => { const e = document.createElementNS(NS, tag); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
    const geo = () => {
      const hb = pipeT.getBoundingClientRect(), a = $('.ia', pipeT).getBoundingClientRect(), b = $('.ai', pipeT).getBoundingClientRect(), s = $('.sm', pipeT).getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(pipeT).fontSize), baseOf = el => { const pr = document.createElement('span'); pr.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; el.appendChild(pr); const y = pr.getBoundingClientRect().top; pr.remove(); return y; };
      const x1 = a.left - hb.left + a.width * .62, y1 = baseOf($('.ia', pipeT)) - hb.top + fs * .09, base = baseOf($('.ai', pipeT)) - hb.top, u = base + Math.max(12, fs * .17);
      const sx = Math.min(s.right - hb.left + Math.max(40, a.height * .55), (pipeT.parentElement.clientWidth || hb.width) - 12), x2 = b.left - hb.left + b.width / 2;
      line.setAttribute('d', `M${x1},${y1} C${sx + 20},${y1 - 6} ${sx + 26},${u} ${sx - 50},${u} L${x2 + 26},${u} Q${x2},${u} ${x2},${u - Math.max(8, b.height * .12)}`);
      L = line.getTotalLength(); pipeT.style.marginBottom = Math.max(0, u + 18 - hb.height) + 'px';
      /* flanges: two short marks across the line near each end */
      fl.innerHTML = ''; [16, 21, L - 16, L - 21].forEach(d => { const p = line.getPointAtLength(d), q = line.getPointAtLength(Math.min(L, d + 1)), dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy) || 1, r = 5.5;
        fl.appendChild(mk('path', { d: `M${p.x - dy / n * r},${p.y + dx / n * r} L${p.x + dy / n * r},${p.y - dx / n * r}` })); });
      /* the valve sits on the lower run, a little past its middle */
      const vx = x2 + 26 + (sx - 50 - x2 - 26) * .58; valve.setAttribute('transform', `translate(${vx},${u})`);
      let lo = 0, hi = L; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; line.getPointAtLength(m).x > vx ? (lo = m) : (hi = m); } vAt = lo;
      if (!ready) { line.style.strokeDasharray = L; line.style.strokeDashoffset = RM ? 0 : L; }
    };
    const tick = now => {
      requestAnimationFrame(tick); if (!seen || !L) return;
      const T = (now - t0) / 1000, draw = RM ? 1 : Math.min(1, Math.max(0, (T - .7) / 1.4)), e = 1 - Math.pow(1 - draw, 3);
      if (!ready) { line.style.strokeDashoffset = L * (1 - e); if (draw >= 1) { ready = true; line.style.strokeDasharray = 'none'; pipeT.classList.add('piped'); } }
    };
    new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(pipeT);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => { geo(); t0 = performance.now() - 600; requestAnimationFrame(tick); }, RM ? 0 : 1450));   /* measured once the name has risen into place */
    addEventListener('resize', () => { ready = true; line.style.strokeDasharray = 'none'; geo(); });
  }

  /* ---------------- the statement is read as you scroll */
  const st = $('#statement');
  if (st && !RM) {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); const parts = (window.Intl && Intl.Segmenter && /^(ja|ko)/.test(document.documentElement.lang)) ? [...new Intl.Segmenter(document.documentElement.lang, { granularity: 'word' }).segment(n.textContent)].map(s => s.segment) : n.textContent.split(/(\s+)/);
        parts.forEach(t => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(t)); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.appendChild(s); } }); n.replaceWith(f); }
      else if (n.nodeType === 1) walk(n); });
    walk(st); const ws = $$('.w', st);
    const read = () => { const r = st.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .9 - r.top) / (r.height + innerHeight * .1)));
      ws.forEach((w, i) => { const k = Math.min(1, Math.max(0, p * (ws.length + 6) - i)); w.style.opacity = (.32 + .68 * k).toFixed(3); }); };
    addEventListener('scroll', read, { passive: true }); read();
  }


  /* ---------------- speakers: filter by edition; the grid closes up smoothly */
  $$('.filters').forEach(fl => {
    const grid = $(fl.dataset.for), items = $$('li', grid);
    fl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      $$('button', fl).forEach(o => { o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', o === b); });
      const v = b.dataset.f, first = new Map(items.map(li => [li, li.getBoundingClientRect()]));
      items.forEach(li => { li.hidden = v !== 'all' && !(li.dataset.ed || '').split(' ').includes(v); });
      if (RM) return;
      items.forEach(li => { if (li.hidden) return; const a = first.get(li), z = li.getBoundingClientRect();
        if (!a.width) { li.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,.8,.2,1)' }); return; }
        li.animate([{ transform: `translate(${a.left - z.left}px, ${a.top - z.top}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,.8,.2,1)' }); });
      const c = $(fl.dataset.count); if (c) c.textContent = items.filter(li => !li.hidden).length;
    });
  });

  /* ---------------- photographs open full screen */
  const lbs = $$('[data-lb]');
  if (lbs.length) {
    const box = document.createElement('div'); box.className = 'lb'; box.hidden = true;
    box.innerHTML = '<button class="lb-x" type="button" aria-label="Close">&#215;</button><button class="lb-p" type="button" aria-label="Previous">&#8592;</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-n" type="button" aria-label="Next">&#8594;</button>';
    document.body.appendChild(box);
    let set = [], at = 0;
    const show = i => { at = (i + set.length) % set.length; const a = set[at]; $('img', box).src = a.href; $('img', box).alt = a.dataset.cap || ''; $('figcaption', box).textContent = `${a.dataset.cap || ''}   ${at + 1} / ${set.length}`; };
    const close = () => { box.hidden = true; document.body.classList.remove('lb-on'); };
    lbs.forEach(a => a.addEventListener('click', e => { e.preventDefault(); set = $$(`[data-lb="${a.dataset.lb}"]`); box.hidden = false; document.body.classList.add('lb-on'); show(set.indexOf(a)); $('.lb-x', box).focus(); }));
    $('.lb-x', box).onclick = close; $('.lb-p', box).onclick = () => show(at - 1); $('.lb-n', box).onclick = () => show(at + 1);
    box.addEventListener('click', e => { if (e.target === box) close(); });
    addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
  }

  /* ---------------- shared map data: land as dots and the industrial sites */
  let dataP = null;
  const loadData = () => dataP || (dataP = (async () => {
    while (!window.d3 || !window.topojson) await new Promise(r => setTimeout(r, 60));
    const [t, s] = await Promise.all([fetch('/industrial-ai-summit/assets/land-110m.json').then(r => r.json()), fetch('/industrial-ai-summit/assets/sites.json').then(r => r.json()).catch(() => [])]);
    return { land: topojson.feature(t, t.objects.land), sites: s };
  })());
  let fineP = null;
  const loadFine = () => fineP || (fineP = (async () => { while (!window.d3 || !window.topojson) await new Promise(r => setTimeout(r, 60)); const t = await fetch('/industrial-ai-summit/assets/land-50m.json').then(r => r.json()); return topojson.feature(t, t.objects.land); })());

  /* ---------------- a location: the land around one city as a dot field, its industry lit, the city marked */
  $$('canvas.locmap').forEach(async cv => {
    const lon = +cv.dataset.lon, lat = +cv.dataset.lat, span = +(cv.dataset.span || 9), wrap = cv.parentElement;
    const { sites } = await loadData(), land = await loadFine();
    let W, H, dpr, pts = [], ind = [], C;
    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
      const k = Math.cos(lat * D2R), sx = W / span, sy = sx / k;   /* degrees to pixels, corrected for latitude */
      const ox = +(cv.dataset.ox || 0) * W, oy = +(cv.dataset.oy || 0) * H;
      const P = (lo, la) => [W / 2 + ox + (lo - lon) * sx * k, H / 2 + oy - (la - lat) * sx];
      C = P(lon, lat);
      const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d', { willReadFrequently: true });
      const pr = d3.geoTransform({ point(lo, la) { const p = P(lo, la); this.stream.point(p[0], p[1]); } });
      mx.fillStyle = '#000'; mx.beginPath(); d3.geoPath(pr, mx)(land); mx.fill();
      const px = mx.getImageData(0, 0, W, H).data, g = 6; pts = [];
      const far = Math.hypot(W, H) * .62;
      for (let y = g / 2, row = 0; y < H; y += g * .866, row++) for (let x = g / 2 + (row % 2) * g / 2; x < W; x += g) if (px[((y | 0) * W + (x | 0)) * 4 + 3] > 128) { const d = Math.hypot(x - C[0], y - C[1]); pts.push(x, y, Math.max(.06, 1 - d / far)); }
      ind = []; sites.forEach(s => { const p = P(s[0], s[1]); if (p[0] > -4 && p[0] < W + 4 && p[1] > -4 && p[1] < H + 4) ind.push(p[0], p[1], Math.hypot(p[0] - C[0], p[1] - C[1])); });
      cv._g = g; cv._coast = new Path2D(); const cp2 = d3.geoPath(pr, { moveTo: (a, b) => cv._coast.moveTo(a, b), lineTo: (a, b) => cv._coast.lineTo(a, b), closePath: () => cv._coast.closePath(), arc() {} }); cp2(land);
      const hk = (a, b) => { const p1 = a[1] * D2R, p2 = b[1] * D2R, dp = p2 - p1, dl = (b[0] - a[0]) * D2R, q = Math.pow(Math.sin(dp / 2), 2) + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin(dl / 2), 2); return 6371 * 2 * Math.asin(Math.sqrt(q)); };
      cv._hubs = JSON.parse(cv.dataset.hubs || '[]').map(([n, hl, ha]) => { const p = P(hl, ha); return { n, x: p[0], y: p[1], km: Math.max(1, Math.round(hk([lon, lat], [hl, ha]) / 5) * 5) }; }).filter(h => h.x > 24 && h.x < W - 24 && h.y > 24 && h.y < H - 24);
    };
    build(); new ResizeObserver(() => build()).observe(wrap);
    const x = cv.getContext('2d'), t0 = performance.now();
    let seen = false; new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(cv);
    let mx = -1e4, my = -1e4, spot = 0, hot = -1;
    const host = cv.closest('.ed-panel, .next-panel') || wrap;
    host.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top;
      hot = (cv._hubs || []).findIndex(h => Math.hypot(h.x - mx, h.y - my) < 30); host.style.cursor = hot >= 0 ? 'pointer' : ''; });
    host.addEventListener('pointerleave', () => { mx = my = -1e4; hot = -1; });
    const draw = now => {
      requestAnimationFrame(draw); if (!seen && cv._drawn) return; cv._drawn = 1;
      const T = (now - t0) / 1000; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      const s = 1.6;
      if (cv._coast) { x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = .6; x.stroke(cv._coast); }
      spot += ((mx > -1e3 ? 1 : 0) - spot) * .12;
      const bins = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], lit = [new Path2D(), new Path2D(), new Path2D()], SR = 110;
      for (let i = 0; i < pts.length; i += 3) { const dx = pts[i] - mx, dy = pts[i + 1] - my, d = Math.sqrt(dx * dx + dy * dy);
        if (spot > .02 && d < SR) { const k = Math.min(2, ((1 - d / SR) * 3) | 0), s2 = s * (1.2 + k * .25); lit[k].rect(pts[i] - s2 / 2, pts[i + 1] - s2 / 2, s2, s2); continue; }
        bins[Math.min(3, (pts[i + 2] * 4) | 0)].rect(pts[i] - s / 2, pts[i + 1] - s / 2, s, s); }
      bins.forEach((pp, b) => { x.fillStyle = `rgba(226,232,240,${(.22 + b * .12).toFixed(3)})`; x.fill(pp); });
      lit.forEach((pp, k) => { x.fillStyle = `rgba(255,255,255,${((.5 + k * .22) * spot + .4 * (1 - spot)).toFixed(3)})`; x.fill(pp); });
      /* industry: a slow wave passes outward from the city and lights each site as it goes */
      const wave = RM ? -1 : ((T * .22) % 1) * Math.hypot(W, H) * .7;
      for (let i = 0; i < ind.length; i += 3) { const d = ind[i + 2], hit = wave > 0 ? Math.max(0, 1 - Math.abs(d - wave) / 60) : 0;
        x.fillStyle = `rgba(255,255,255,${(.55 + hit * .45).toFixed(3)})`; const r = 1.5 + hit * 1.3; x.beginPath(); x.arc(ind[i], ind[i + 1], r, 0, Math.PI * 2); x.fill(); }
      if (wave > 0) { x.strokeStyle = `rgba(255,255,255,${(.12 * (1 - wave / (Math.hypot(W, H) * .7))).toFixed(3)})`; x.lineWidth = 1; x.beginPath(); x.arc(C[0], C[1], wave, 0, Math.PI * 2); x.stroke(); }
      (cv._hubs || []).forEach((h, hi) => { const on = hi === hot, mxx = (C[0] + h.x) / 2, myy = (C[1] + h.y) / 2 - Math.hypot(h.x - C[0], h.y - C[1]) * .18;
        x.beginPath(); x.moveTo(C[0], C[1]); x.quadraticCurveTo(mxx, myy, h.x, h.y);
        x.lineWidth = on ? 1.5 : 1; x.strokeStyle = on ? 'rgba(255,96,48,.75)' : 'rgba(255,255,255,.14)'; x.stroke();
        { const N2 = 40, gap = 34, off = RM ? 0 : (T * 22) % gap; let acc = 0, prev = [C[0], C[1]]; x.lineWidth = on ? 1.4 : 1.1; x.strokeStyle = on ? 'rgba(255,170,130,.95)' : 'rgba(255,150,110,.6)';
          for (let k = 1; k <= N2; k++) { const t = k / N2, qx = (1 - t) * (1 - t) * C[0] + 2 * (1 - t) * t * mxx + t * t * h.x, qy = (1 - t) * (1 - t) * C[1] + 2 * (1 - t) * t * myy + t * t * h.y, dx = qx - prev[0], dy = qy - prev[1], L = Math.hypot(dx, dy);
            let u = (gap - ((acc - off) % gap + gap) % gap); while (u <= L && L) { const px = prev[0] + dx * u / L, py = prev[1] + dy * u / L, ux = dx / L, uy = dy / L, s = 4;
              if (Math.hypot(px - C[0], py - C[1]) > 18 && Math.hypot(px - h.x, py - h.y) > 14) { x.beginPath(); x.moveTo(px - ux * s - uy * s * .7, py - uy * s + ux * s * .7); x.lineTo(px, py); x.lineTo(px - ux * s + uy * s * .7, py - uy * s - ux * s * .7); x.stroke(); }
              u += gap; } acc += L; prev = [qx, qy]; } }
        if (on) { const g = x.createRadialGradient(h.x, h.y, 0, h.x, h.y, 22); g.addColorStop(0, 'rgba(255,96,40,.45)'); g.addColorStop(1, 'rgba(255,79,23,0)'); x.fillStyle = g; x.beginPath(); x.arc(h.x, h.y, 22, 0, Math.PI * 2); x.fill(); }
        x.strokeStyle = on ? '#ff4f17' : 'rgba(255,255,255,.85)'; x.fillStyle = on ? '#ff4f17' : 'rgba(10,12,16,.9)'; x.lineWidth = 1.3; x.beginPath(); x.arc(h.x, h.y, on ? 4.2 : 3.4, 0, Math.PI * 2); x.fill(); x.stroke();
        if (W < 600) return;
        x.font = '400 12.5px Switzer, Helvetica, Arial, sans-serif'; const tw = x.measureText(h.n).width, flip = h.x + 10 + tw + 56 > W - 24, tx = flip ? h.x - 10 : h.x + 10;
        x.textAlign = flip ? 'right' : 'left'; x.shadowColor = '#0a0c10'; x.shadowBlur = 8; x.fillStyle = on ? '#fff' : 'rgba(255,255,255,.82)'; x.fillText(h.n, tx, h.y + 4);
        x.font = '400 11.5px Switzer, Helvetica, Arial, sans-serif'; x.fillStyle = on ? '#ff9a70' : 'rgba(255,255,255,.58)'; x.fillText(h.km + ' km', flip ? tx - tw - 8 : tx + tw + 8, h.y + 4); x.shadowBlur = 0; x.textAlign = 'left'; });
      const k = (T * .5) % 1; x.strokeStyle = `rgba(255,79,23,${((1 - k) * .7).toFixed(3)})`; x.beginPath(); x.arc(C[0], C[1], 6 + k * 26, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#ff4f17'; x.beginPath(); x.arc(C[0], C[1], 5, 0, Math.PI * 2); x.fill();
      if (cv.dataset.name) { x.font = '400 13px Switzer, Helvetica, Arial, sans-serif'; x.fillStyle = 'rgba(255,255,255,.9)'; x.shadowColor = '#0a0c10'; x.shadowBlur = 8; x.fillText(cv.dataset.name, C[0] + 14, C[1] + 4.5); x.shadowBlur = 0; }
    };
    requestAnimationFrame(draw);
  });


  /* ---------------- the two next editions take turns on the map */
  $$('.next-map.duo').forEach(m => { if (!RM) setInterval(() => m.classList.toggle('alt'), 6000); });

  /* ---------------- the globe (home)
     A dense, even field of land dots on a softly lit sphere. The editions are joined by arcs that light flows along;
     each city is a beacon. On each city the camera moves in, the industry around it comes up, and the globe keeps
     breathing. A soft spotlight follows the pointer; pointing at a city opens its card; drag and it springs back. */
  const cv = $('#globe');
  if (!cv) return;
  const CITIES = S.cities.map(c => ({ ...c }));
  const panel = $('.globe-panel'), x = cv.getContext('2d'), tip = $('.gtip');
  let W = 0, H = 0, dpr = 1, R = 0, CX = 0, CY = 0;
  const wide = () => innerWidth > 900;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = panel.clientWidth; H = panel.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    const phone = !wide(); R = phone ? Math.min(W * .42, 190) : Math.min(H * .43, W * .27); CX = phone ? W * .5 : W * .8; CY = phone ? H - 270 : H * .54; };
  size(); addEventListener('resize', size);

  const ZMAX = 1.7, LOGO = new Image(); LOGO.src = '/industrial-ai-summit/assets/mark.svg';
  let yaw = -75 * D2R, pitch = 24 * D2R, Z = 1, vy = 0, vp = 0, layer = 'cities', layerT = 0, focus = -1, hover = -1, arriveT = 0, dragAt = -1e9;
  let tYaw = yaw, tPitch = pitch;
  const P3 = (cl, sl, lon, lift = 1) => { const a = lon + yaw, xs = cl * Math.sin(a), z = cl * Math.cos(a), cp = Math.cos(pitch), sp = Math.sin(pitch), y2 = sl * cp - z * sp, z2 = sl * sp + z * cp, r = R * Z * lift; return [CX + r * xs, CY - r * y2, z2]; };
  const cityP = c => P3(Math.cos(c.lat * D2R), Math.sin(c.lat * D2R), c.lon * D2R);
  const angTo = (c, cl, sl, lo) => cl * Math.cos(c.lat * D2R) * Math.cos(lo - c.lon * D2R) + sl * Math.sin(c.lat * D2R);   /* cosine of the angle between a point and a city */

  let dots = null, sites = null, arcs = null, dist = [];
  const build = async () => {
    const { sites: s } = await loadData(), land = wide() ? await loadFine() : (await loadData()).land;
    /* an even field: points on a Fibonacci sphere, kept where there is land */
    const mw = 2048, mh = 1024, m = document.createElement('canvas'); m.width = mw; m.height = mh;
    const mx = m.getContext('2d', { willReadFrequently: true }), ep = d3.geoEquirectangular().scale(mw / (2 * Math.PI)).translate([mw / 2, mh / 2]);
    mx.fillStyle = '#000'; mx.beginPath(); d3.geoPath(ep, mx)(land); mx.fill();
    const px = mx.getImageData(0, 0, mw, mh).data, out = [], DL = wide() ? .5 : .72;
    for (let lat = -56 + DL / 2; lat < 84; lat += DL) {
      const cl = Math.cos(lat * D2R), sl = Math.sin(lat * D2R), n = Math.max(1, Math.round(360 * cl / DL)), st = 360 / n, o = (Math.round(lat / DL) % 2) * st / 2;
      for (let k = 0; k < n; k++) { const lon = -180 + o + k * st, [u, v] = ep([lon, lat]); if (px[((v | 0) * mw + (u | 0)) * 4 + 3] > 128) out.push(cl, sl, lon * D2R); }
    }
    dots = new Float32Array(out);
    sites = new Float32Array(s.length * 4);
    s.forEach((q, i) => { sites[i * 4] = Math.cos(q[1] * D2R); sites[i * 4 + 1] = Math.sin(q[1] * D2R); sites[i * 4 + 2] = q[0] * D2R; sites[i * 4 + 3] = (Math.sin(i * 12.9898) * 43758.5453) % 1; });
    arcs = []; dist = [0];
    for (let i = 0; i < CITIES.length - 1; i++) {
      const a = CITIES[i], b = CITIES[i + 1], ip = d3.geoInterpolate([a.lon, a.lat], [b.lon, b.lat]), dd = d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]);
      const pts = []; for (let k = 0; k <= 120; k++) { const t = k / 120, [lo, la] = ip(t); pts.push([Math.cos(la * D2R), Math.sin(la * D2R), lo * D2R, 1 + Math.sin(t * Math.PI) * Math.min(.12, dd * .055)]); }
      arcs.push(pts); dist.push(Math.round(dd * 6371 / 10) * 10);
    }
  };

  const hud = $('.hud');
  const setHud = i => { if (!hud) return; const c = CITIES[i], put = (s, v) => { const el = $(s, hud); if (el) el.textContent = v; };
    put('.hud-n', c.city); put('.hud-c', coord(c)); const ht = $('.hud-t', hud); if (ht) { ht.dataset.tz = c.tz; ht.textContent = fmtTime(c.tz); }
    put('.hud-d', i > 0 ? T('{d} km from {c}').replace('{d}', (dist[i] || 0).toLocaleString('en-US')).replace('{c}', CITIES[i - 1].city) : T('Where the series began'));
    hud.classList.remove('swap'); void hud.offsetWidth; hud.classList.add('swap'); };

  const t0 = performance.now();
  let lastInteract = 0, tourAt = 0, tourI = 0, anim = null, tipI = -1;
  const goTo = (i, ms = 2000) => {
    const c = CITIES[i], prevF = focus; focus = i;
    let ty = -c.lon * D2R - (wide() ? .08 : 0); while (ty - yaw > Math.PI) ty -= 2 * Math.PI; while (yaw - ty > Math.PI) ty += 2 * Math.PI;
    const tp = Math.max(-.6, Math.min(.9, c.lat * D2R - .06));
    const far = prevF < 0 ? 0 : d3.geoDistance([CITIES[prevF].lon, CITIES[prevF].lat], [c.lon, c.lat]);
    tYaw = ty; tPitch = tp;
    anim = { y0: yaw, p0: pitch, z0: Z, y1: ty, p1: tp, z1: ZMAX, dip: Math.min(ZMAX - 1, far * .5), s: performance.now(), ms: RM ? 1 : ms };
    arriveT = performance.now() + (RM ? 0 : ms * .65);
    $$('.ch').forEach(ch => ch.classList.toggle('on', +ch.dataset.city === i));
    $$('.steps li').forEach((li, k) => { li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); if (!wide()) { const s = $('button', li).style; k === i ? s.setProperty('--fill', '100%') : s.removeProperty('--fill'); } });
    setHud(i);
  };
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

  /* the pointer, for the spotlight and the card */
  let mxp = -1e4, myp = -1e4, spot = 0;
  const pathFromRuns = (pts, alphaMin) => { const runs = []; let cur = null;
    pts.forEach(q => { const p = P3(q[0], q[1], q[2], q[3]); if (p[2] > alphaMin) { if (!cur) { cur = []; runs.push(cur); } cur.push(p); } else cur = null; });
    return runs; };

  const draw = now => {
    const Tt = (now - t0) / 1000;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (!dots) return;
    const cp = Math.cos(pitch), sp = Math.sin(pitch), RZ = R * Z, f = Math.max(0, Math.min(1, (Z - 1.1) / (ZMAX - 1.1)));
    /* atmosphere, body, limb: the light comes from the upper left */
    const atm = x.createRadialGradient(CX, CY, RZ * .96, CX, CY, RZ * 1.18); atm.addColorStop(0, 'rgba(200,214,236,.10)'); atm.addColorStop(.4, 'rgba(200,214,236,.03)'); atm.addColorStop(1, 'rgba(200,214,236,0)');
    x.fillStyle = atm; x.beginPath(); x.arc(CX, CY, RZ * 1.18, 0, Math.PI * 2); x.fill();
    const body = x.createRadialGradient(CX - RZ * .45, CY - RZ * .45, RZ * .05, CX - RZ * .1, CY - RZ * .1, RZ * 1.15); body.addColorStop(0, 'rgba(255,255,255,.06)'); body.addColorStop(.6, 'rgba(255,255,255,.015)'); body.addColorStop(1, 'rgba(0,0,0,.25)');
    x.fillStyle = body; x.beginPath(); x.arc(CX, CY, RZ, 0, Math.PI * 2); x.fill();
    const rim = x.createLinearGradient(CX - RZ * .8, CY - RZ * .8, CX + RZ * .5, CY + RZ * .5); rim.addColorStop(0, 'rgba(220,230,248,.42)'); rim.addColorStop(.5, 'rgba(220,230,248,.06)'); rim.addColorStop(1, 'rgba(220,230,248,0)');
    x.strokeStyle = rim; x.lineWidth = 1.2; x.stroke();
    /* land: six depths; the spotlight lifts what is under the pointer */
    spot += ((mxp > -1e3 ? 1 : 0) - spot) * .12;
    const sitesOn = layer === 'sites', base = sitesOn ? .42 : 1, SR = 150, SR2 = SR * SR;
    const bins = Array.from({ length: 6 }, () => new Path2D()), lit = [new Path2D(), new Path2D(), new Path2D()];
    const ds0 = Math.max(1, R / 380) * (1 + .2 * f), LX = -.52, LY = .56, LZ = .64;
    for (let i = 0; i < dots.length; i += 3) {
      const cl = dots[i], a = dots[i + 2] + yaw, z = cl * Math.cos(a), y = dots[i + 1], z2 = y * sp + z * cp; if (z2 <= 0) continue;
      const X = CX + RZ * cl * Math.sin(a), Y = CY - RZ * (y * cp - z * sp); if (X < -3 || X > W + 3 || Y < -3 || Y > H + 3) continue;
      const xs = cl * Math.sin(a), y2 = y * cp - z * sp, li = Math.max(0, xs * LX + y2 * LY + z2 * LZ), lv = .12 + .88 * Math.pow(li, .9) * Math.min(1, z2 * 3), ds = ds0 * (.7 + .4 * lv), dx = X - mxp, dy = Y - myp, d2 = dx * dx + dy * dy;
      if (spot > .02 && d2 < SR2) { const k = Math.min(2, ((1 - Math.sqrt(d2) / SR) * 3) | 0), s2 = ds * (1.15 + k * .22); lit[k].rect(X - s2 / 2, Y - s2 / 2, s2, s2); continue; }
      bins[Math.min(5, (lv * 6) | 0)].rect(X - ds / 2, Y - ds / 2, ds, ds);
    }
    for (let b = 0; b < 6; b++) { x.fillStyle = `rgba(226,232,242,${(base * (.1 + b * .15)).toFixed(3)})`; x.fill(bins[b]); }
    for (let k = 0; k < 3; k++) { x.fillStyle = `rgba(255,${236 - k * 12},${224 - k * 26},${((.5 + k * .17) * spot + (1 - spot) * .45).toFixed(3)})`; x.fill(lit[k]); }
    /* industry: twinkling plants; around the focused city they come up as the camera arrives; switching the layer on sends a ripple out */
    const fc = focus >= 0 ? CITIES[focus] : null, arr = Math.max(0, Math.min(1, (now - arriveT) / 1000)), rip = Math.min(1, (now - layerT) / 1600);
    const tw = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < sites.length; i += 4) {
      const cl = sites[i], a = sites[i + 2] + yaw, z = cl * Math.cos(a), y = sites[i + 1], z2 = y * sp + z * cp; if (z2 <= .02) continue;
      let show = 0;
      if (sitesOn) { const ang = fc ? Math.acos(Math.max(-1, Math.min(1, angTo(fc, cl, y, sites[i + 2])))) / Math.PI : 0; show = ang < rip ? 1 : 0; }
      else if (fc && angTo(fc, cl, y, sites[i + 2]) > .972 && sites[i + 3] > .55) show = arr * f;
      if (!show) continue;
      const X = CX + RZ * cl * Math.sin(a), Y = CY - RZ * (y * cp - z * sp); if (X < -3 || X > W + 3 || Y < -3 || Y > H + 3) continue;
      const k = Math.min(2, ((.5 + .5 * Math.sin(Tt * 1.4 + sites[i + 3] * 40)) * 3) | 0), s2 = 1.8;
      tw[k].rect(X - s2 / 2, Y - s2 / 2, s2, s2);
    }
    tw.forEach((pp, k) => { x.fillStyle = `rgba(255,120,72,${(.34 + k * .08).toFixed(3)})`; x.fill(pp); });
    /* the series: each arc drawn once, then light keeps flowing along it toward the next city */
    x.save(); x.beginPath(); x.arc(CX, CY, RZ * 1.25, 0, Math.PI * 2); x.clip();
    arcs.forEach((pts, ai) => {
      const prog = RM ? 1 : Math.max(0, Math.min(1, (Tt - 1.2 - ai * .5) / 1.2)); if (!prog) return;
      const touch = ai === focus || ai + 1 === focus, next = !!CITIES[ai + 1].next, strength = (touch ? 1 : .55) * (1 - .45 * f * (touch ? 0 : 1));
      const runs = pathFromRuns(pts.slice(0, Math.max(2, Math.round(prog * pts.length))), .04);
      x.lineCap = 'round';
      runs.forEach(run => { if (run.length < 2) return;
        x.beginPath(); run.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
        x.setLineDash(next ? [2, 5] : []); x.lineWidth = touch ? 1.1 : .8; x.strokeStyle = `rgba(255,110,64,${(.36 * strength).toFixed(3)})`; x.stroke();
      });
      x.setLineDash([]);
      if (prog >= 1 && !RM) { /* a bright head travels the arc, trailing light */
        const cyc = (Tt * .16 + ai * .27) % 1, k0 = Math.floor(cyc * (pts.length - 1));
        for (let t = 0; t < 22; t++) { const k = k0 - t; if (k < 0) break; const q = pts[k], p = P3(q[0], q[1], q[2], q[3]); if (p[2] < .05) break;
          const al = (1 - t / 22) * strength * .85, r = t ? 1.1 * (1 - t / 22) + .4 : 2.4;
          if (!t) { const g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2); g.addColorStop(0, `rgba(255,220,200,${al})`); g.addColorStop(.4, `rgba(255,110,60,${(al * .6).toFixed(3)})`); g.addColorStop(1, 'rgba(255,79,23,0)'); x.fillStyle = g; x.beginPath(); x.arc(p[0], p[1], r * 2, 0, Math.PI * 2); x.fill(); }
          else { x.fillStyle = `rgba(255,130,80,${(al * .7).toFixed(3)})`; x.beginPath(); x.arc(p[0], p[1], r, 0, Math.PI * 2); x.fill(); } }
      }
    });
    x.restore();
    /* close in, the edges fall away a little */
    if (f > 0) { const vg = x.createRadialGradient(CX, CY, Math.min(W, H) * .4, CX, CY, Math.max(W, H) * .56); vg.addColorStop(0, 'rgba(10,12,16,0)'); vg.addColorStop(1, `rgba(10,12,16,${(.55 * f).toFixed(3)})`); x.fillStyle = vg; x.fillRect(0, 0, W, H); }
    /* the five cities: beacons in orange; the focused one brighter, with two rings */
    CITIES.forEach((c, i) => {
      const p = cityP(c); if (p[2] <= .12) return;
      const on = i === focus, hv = i === hover, al = Math.min(1, (p[2] - .12) / .2) * (p[1] > H - 90 && !on ? 0 : 1); if (al <= .01) return;
      const glow = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 12); glow.addColorStop(0, `rgba(255,96,40,${((on || hv ? .3 : .2) * al).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,79,23,0)');
      x.fillStyle = glow; x.beginPath(); x.arc(p[0], p[1], 12, 0, Math.PI * 2); x.fill();
      for (let r = 0; r < 1; r++) { const k = ((Tt / 3.6 + i * .2) % 1); x.strokeStyle = `rgba(255,110,64,${((1 - k) * (on ? .45 : .3) * al).toFixed(3)})`; x.lineWidth = .8; x.beginPath(); x.arc(p[0], p[1], (on ? 16 : 4) + k * (on ? 20 : 10), 0, Math.PI * 2); x.stroke(); }
      const bub = on ? Math.min(1, Math.max(0, (now - arriveT + 300) / 700)) : 0;
      if (bub > 0 && LOGO.complete && LOGO.naturalWidth) { const s = 22 * (.75 + .25 * bub), r = 4;
        x.globalAlpha = al * bub; x.save(); x.shadowColor = 'rgba(255,79,23,.3)'; x.shadowBlur = 14;
        x.beginPath(); x.roundRect ? x.roundRect(p[0] - s / 2, p[1] - s / 2, s, s, r) : x.rect(p[0] - s / 2, p[1] - s / 2, s, s); x.fillStyle = '#ff4f17'; x.fill(); x.restore();
        x.save(); x.beginPath(); x.roundRect ? x.roundRect(p[0] - s / 2, p[1] - s / 2, s, s, r) : x.rect(p[0] - s / 2, p[1] - s / 2, s, s); x.clip(); x.drawImage(LOGO, p[0] - s / 2, p[1] - s / 2, s, s); x.restore(); x.globalAlpha = 1; }
      else { x.fillStyle = c.next ? `rgba(10,12,16,${al})` : `rgba(255,79,23,${al})`; x.beginPath(); x.arc(p[0], p[1], hv ? 4 : 3.2, 0, Math.PI * 2); x.fill();
        if (c.next) { x.strokeStyle = `rgba(255,79,23,${al})`; x.lineWidth = 1.5; x.stroke(); } }
      if (on || hv || f < .5) { x.save(); x.font = on ? '500 14.5px Switzer, Helvetica, Arial, sans-serif' : '400 12.5px Switzer, Helvetica, Arial, sans-serif'; x.shadowColor = '#0a0c10'; x.shadowBlur = 10;
        x.fillStyle = `rgba(255,255,255,${((on || hv ? .96 : .7) * al).toFixed(3)})`; const tw2 = x.measureText(c.city).width, gapL = on ? 26 : 14, left = (c.left && !on) || p[0] + gapL + tw2 > W - 12, tx = left ? p[0] - gapL : p[0] + gapL;
        x.textAlign = left ? 'right' : 'left'; x.fillText(c.city, tx, p[1] + 4.5); x.restore(); }
    });
    /* the card follows its city */
    if (tip && tipI >= 0 && !overTip) { const p = cityP(CITIES[tipI]), tw3 = tip.offsetWidth, th = tip.offsetHeight; let lx = p[0] + 22, ly = p[1] - th - 18; if (lx + tw3 > W - 16) lx = p[0] - tw3 - 22; if (ly < 16) ly = p[1] + 18; tip.style.transform = `translate(${lx | 0}px, ${ly | 0}px)`; }
  };

  const loop = now => {
    if (anim) { const k = Math.min(1, (now - anim.s) / anim.ms), e = ease(k);
      yaw = anim.y0 + (anim.y1 - anim.y0) * e; pitch = anim.p0 + (anim.p1 - anim.p0) * e; Z = Math.max(1, anim.z0 + (anim.z1 - anim.z0) * e - anim.dip * Math.sin(Math.PI * k)); if (k >= 1) anim = null; }
    else if (!dragging) {
      if (now - dragAt < 2600) { yaw += vy; pitch = Math.max(-.6, Math.min(.9, pitch + vp)); vy *= .94; vp *= .9; }
      else if (focus >= 0) { /* the globe breathes around its city, and drifts home after a drag */
        const b = Math.sin((now - t0) / 1000 * .18) * .045, gy = tYaw + b, gp = tPitch + Math.sin((now - t0) / 1000 * .13) * .02;
        yaw += (gy - yaw) * .03; pitch += (gp - pitch) * .03; Z += (ZMAX - Z) * .03; }
    }
    const ti = hover >= 0 ? hover : (focus >= 0 && now >= arriveT + 250 ? focus : -1); if (ti !== tipI) { tipI = ti; showTip(ti); }
    draw(now); requestAnimationFrame(loop);
  };

  const showTip = i => { if (!tip) return; if (i < 0) { tip.classList.remove('show'); return; } const c = CITIES[i];
    if (tip.dataset.i !== String(i)) { tip.dataset.i = i; const img = $('img', tip), ph = $('.gt-ph', tip);
      if (c.ph) { img.src = '/industrial-ai-summit/assets/img/photos/' + c.ph; img.style.display = ''; ph.classList.remove('nx'); } else { img.style.display = 'none'; ph.classList.add('nx'); }
      $('b', tip).textContent = c.city; $('.gt-d', tip).textContent = c.date; $('.gt-a', tip).textContent = T(c.cta || 'Read the record'); tip.href = c.href; }
    tip.hidden = false; tip.classList.add('show'); };
  let dragging = false, lx = 0, ly = 0, moved = 0, hideT = 0, overTip = false;
  cv.addEventListener('pointerdown', e => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; vy = vp = 0; anim = null; lastInteract = performance.now(); cv.setPointerCapture(e.pointerId); cv.classList.add('dragging'); });
  cv.addEventListener('pointermove', e => {
    const b = cv.getBoundingClientRect(); mxp = e.clientX - b.left; myp = e.clientY - b.top;
    if (dragging) { const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy); vy = dx / (R * Z); vp = dy / (R * Z) * .6; yaw += vy; pitch = Math.max(-.6, Math.min(.9, pitch + vp)); dragAt = performance.now(); lastInteract = dragAt; return; }
    let best = -1, bd = 22; CITIES.forEach((c, i) => { const p = cityP(c); if (p[2] <= .12) return; const d = Math.hypot(p[0] - mxp, p[1] - myp); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) { clearTimeout(hideT); hover = best; }
    else if (hover >= 0 && !hideT) hideT = setTimeout(() => { hideT = 0; if (!overTip) { hover = -1; } }, 650);
    cv.style.cursor = best >= 0 ? 'pointer' : 'grab';
  });
  const end = () => { if (!dragging) return; dragging = false; cv.classList.remove('dragging'); dragAt = performance.now(); if (moved < 6 && hover >= 0) { lastInteract = performance.now(); window.__goto(hover); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { mxp = myp = -1e4; clearTimeout(hideT); hideT = setTimeout(() => { hideT = 0; if (!overTip) { hover = -1; } }, 650); });
  if (tip) { tip.addEventListener('pointerenter', () => { overTip = true; clearTimeout(hideT); hideT = 0; });
    tip.addEventListener('pointerleave', () => { overTip = false; hideT = setTimeout(() => { hideT = 0; if (!overTip) { hover = -1; } }, 350); }); }

  /* on wide screens the scroll tells the story; the steps and the skip button move through it */
  const story = $('#story');
  const NC = CITIES.length, stepTop = i => story.offsetTop + (story.offsetHeight - innerHeight) * (i + .5) / NC;
  const storyScroll = () => {
    if (!wide() || !dots) return;
    const r = story.getBoundingClientRect(), span = story.offsetHeight - innerHeight, p = Math.min(.9999, Math.max(0, -r.top / Math.max(1, span)));
    const step = Math.min(NC - 1, Math.floor(p * NC)), fr = p * NC - step;
    $$('.steps li').forEach((li, k) => { const b = $('button', li); k === step ? b.style.setProperty('--fill', (fr * 100).toFixed(1) + '%') : b.style.removeProperty('--fill'); });
    const sk = $('.skip'); if (sk) sk.classList.toggle('show', r.top < innerHeight * .2 && r.bottom > innerHeight * .9);
    if (step !== focus) goTo(step);
  };
  addEventListener('scroll', storyScroll, { passive: true });
  window.__goto = i => { lastInteract = performance.now(); if (wide() && story) scrollTo({ top: stepTop(i), behavior: RM ? 'auto' : 'smooth' }); else { goTo(i); panel.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); } };
  $$('.steps li').forEach(li => $('button', li).addEventListener('click', () => { const i = +li.dataset.city; if (wide()) window.__goto(i); else { lastInteract = performance.now(); goTo(i); } }));
  const skip = $('.skip');
  if (skip) skip.addEventListener('click', () => scrollTo({ top: story.offsetTop + story.offsetHeight - 40, behavior: RM ? 'auto' : 'smooth' }));
  $$('.seg button').forEach(b => b.addEventListener('click', () => { if (layer !== b.dataset.layer) { layer = b.dataset.layer; layerT = performance.now(); } $$('.seg button').forEach(o => { o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', o === b); }); }));

  (async () => { await build(); goTo(0, 1); storyScroll(); tourAt = performance.now() + 5000; requestAnimationFrame(loop); })();
})();
