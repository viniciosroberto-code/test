(function (global) {
  "use strict";

  const W = 1000, H = 620, ROWS = 5, COLS = 9;
  const GX = 90, GY = 112, CW = 88, CH = 96, GROUND = 38;
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const cx = (c) => GX + c * CW + CW / 2;
  const cy = (r) => GY + r * CH + CH / 2;
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const PLANTS = [
    { id: "sun", name: "Girassol", cost: 50, cd: 4.5, hp: 300, hint: "Cria sol" },
    { id: "pea", name: "Atiradora", cost: 100, cd: 3, hp: 300, hint: "Atira ervilhas" },
    { id: "snow", name: "Gelada", cost: 150, cd: 4.5, hp: 300, hint: "Congela zumbis" },
    { id: "dual", name: "Dupla", cost: 200, cd: 5.5, hp: 320, hint: "Dois tiros" },
    { id: "nut", name: "Noz", cost: 50, cd: 12, hp: 4000, hint: "Muito resistente" },
    { id: "bomb", name: "Cereja", cost: 150, cd: 20, hp: 120, hint: "Explosao" }
  ];

  const ZOMBIES = {
    basic: { name: "Zumbi", hp: 200, armor: 0, sp: 24, dps: 90, points: 100, cost: 1, min: 1, weight: 10, color: "#9cc58a" },
    cone: { name: "Cone", hp: 200, armor: 370, sp: 24, dps: 90, points: 200, cost: 2.2, min: 2, weight: 6, color: "#9cc58a" },
    runner: { name: "Corredor", hp: 150, armor: 0, sp: 48, dps: 80, points: 150, cost: 1.9, min: 3, weight: 4, color: "#a8d17d" },
    bucket: { name: "Balde", hp: 200, armor: 1100, sp: 22, dps: 90, points: 400, cost: 4.6, min: 5, weight: 4, color: "#9cc58a" },
    brute: { name: "Brutamontes", hp: 2600, armor: 0, sp: 14, dps: 0, points: 1500, cost: 14, min: 8, weight: 1, color: "#7fa6a0", big: true }
  };

  const STYLE = `
    .jz-root{position:fixed;inset:0;display:grid;place-items:center;overflow:hidden;background:radial-gradient(ellipse,#1d4a1c,#091609);font-family:Trebuchet MS,Arial,sans-serif;color:#fff6dc;touch-action:none;user-select:none}
    .jz-root *{box-sizing:border-box}.jz-root canvas{display:block;touch-action:none}.jz-layer{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(4,12,3,.72);overflow:auto;touch-action:pan-y}
    .jz-panel{width:min(940px,100%);padding:22px;border:4px solid #211306;border-radius:24px;background:linear-gradient(#7a4b27,#4a2c15);box-shadow:0 8px #1d1208,0 24px 55px #0009,inset 0 3px #ffdca044;text-align:center}
    .jz-title{margin:0;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:2px;font-size:clamp(48px,9vw,90px);line-height:.9;color:#a6ec62;text-shadow:-3px -3px #1d1208,3px -3px #1d1208,-3px 3px #1d1208,3px 3px #1d1208,0 7px #1d1208}.jz-title b{display:inline-block;color:#d6a6ff;transform:rotate(-8deg)}
    .jz-sub{display:inline-block;margin:11px 0 17px;padding:4px 15px;border:3px solid #1d1208;border-radius:20px;background:#ffd23a;color:#3b2412;font-weight:900;letter-spacing:2px}.jz-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;align-items:center}.jz-copy{font-size:18px;line-height:1.35;color:#fff4db}.jz-btn{border:3px solid #1d1208;border-bottom-width:7px;border-radius:16px;padding:10px 22px;background:linear-gradient(#a6ec62,#6fc23b);color:#1d1208;font:900 24px Impact,Arial,sans-serif;letter-spacing:1px;cursor:pointer;box-shadow:inset 0 3px #ffffff77}.jz-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.jz-btn:active{transform:translateY(4px);border-bottom-width:3px}.jz-btn.alt{background:linear-gradient(#fff1c4,#e6d09a);font-size:17px}.jz-btn.sun{background:linear-gradient(#ffe566,#ffb81f)}
    .jz-actions{display:flex;flex-direction:column;gap:10px;align-items:stretch}.jz-scorebox{padding:12px;border-radius:15px;background:#160d06aa;box-shadow:inset 0 2px 7px #0008;text-align:left}.jz-scorebox h2{margin:0 0 8px;color:#ffd23a;font:28px Impact,Arial,sans-serif;letter-spacing:1px}.jz-scoreline{display:flex;gap:8px;align-items:center;padding:5px 6px;border-radius:9px;background:#0004;font-weight:bold}.jz-scoreline+i{display:none}.jz-rank{display:grid;place-items:center;flex:0 0 25px;width:25px;height:25px;border-radius:50%;background:#0008;color:#ffe9a0;font-size:12px}.jz-scoreline:nth-child(2) .jz-rank{background:#ffd23a;color:#3b2412}.jz-scoreline:nth-child(3) .jz-rank{background:#d9dfe6;color:#29313b}.jz-scoreline:nth-child(4) .jz-rank{background:#d99a5b;color:#4a2400}.jz-score-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1}.jz-score-val{font-family:Impact,Arial,sans-serif;letter-spacing:.5px}.jz-help{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;text-align:left;font-size:13px;line-height:1.4}.jz-help>div{padding:9px;border-radius:12px;background:#160d0688}.jz-help strong{color:#ffd23a}.jz-key{display:inline-block;padding:0 5px;border:1px solid #1d1208;border-bottom:3px solid #1d1208;border-radius:5px;background:#fff1c4;color:#3b2412;font:bold 11px monospace}
    .jz-pause{max-width:420px}.jz-over{max-width:850px}.jz-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.jz-stat{padding:8px;border-radius:12px;background:#160d0688}.jz-stat small{display:block;color:#ffe9a0;font-weight:bold;text-transform:uppercase}.jz-stat b{font:30px Impact,Arial,sans-serif;letter-spacing:1px}.jz-total{grid-column:span 3}.jz-total b{font-size:48px}.jz-input{width:100%;border:3px solid #1d1208;border-radius:12px;background:#fff1c4;padding:9px;color:#3b2412;font:900 21px Impact,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase}.jz-badge{display:inline-block;border:3px solid #1d1208;border-radius:20px;padding:4px 14px;background:#ffd23a;color:#3b2412;font:22px Impact,Arial,sans-serif;letter-spacing:1px}
    .jz-sound{position:absolute;right:12px;top:12px;z-index:5;border:3px solid #1d1208;border-radius:11px;background:#fff1c4;padding:7px 10px;color:#3b2412;font-weight:900;cursor:pointer}.jz-muted{filter:grayscale(1);opacity:.8}
    @media(max-width:700px){.jz-grid{grid-template-columns:1fr}.jz-scorebox{max-width:420px;margin:auto}.jz-help{font-size:11px}.jz-panel{padding:16px}.jz-layer{align-items:flex-start;padding-top:18px}.jz-title{font-size:56px}}@media(max-height:600px){.jz-panel{padding:12px}.jz-sub{margin:5px}.jz-copy{display:none}.jz-help{display:none}.jz-title{font-size:48px}.jz-btn{padding:7px 16px;font-size:20px}.jz-scorebox h2{font-size:21px}.jz-scoreline{padding:2px 5px}.jz-layer{padding:7px;align-items:center}}
  `;

  function injectStyle() {
    if (document.getElementById("jz-style")) return;
    const s = document.createElement("style");
    s.id = "jz-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (_) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function getScores() { return load("jardimz-js-scores", []).filter((x) => x && typeof x.score === "number").sort((a, b) => b.score - a.score).slice(0, 10); }

  class Sound {
    constructor() { this.ctx = null; this.muted = load("jardimz-js-muted", false); this.last = {}; }
    unlock() {
      if (!this.ctx) {
        const A = global.AudioContext || global.webkitAudioContext;
        if (!A) return;
        try { this.ctx = new A(); } catch (_) { return; }
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    }
    toggle() { this.muted = !this.muted; save("jardimz-js-muted", this.muted); }
    tone(f, d, type, v, end, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0), o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (end) o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .1, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + .03);
    }
    play(name) {
      if (!this.ctx || this.muted) return;
      const n = performance.now(), gap = { shot: 55, hit: 45, bite: 130, dead: 70 }[name] || 0;
      if (gap && n - (this.last[name] || 0) < gap) return; this.last[name] = n;
      if (name === "shot") this.tone(520, .08, "square", .06, 270);
      else if (name === "snow") { this.tone(880, .11, "triangle", .08, 430); this.tone(1500, .04, "sine", .04, 1000, .04); }
      else if (name === "hit") this.tone(150, .07, "triangle", .16, 70);
      else if (name === "plant") { this.tone(200, .14, "sine", .2, 90); this.tone(650, .1, "triangle", .07, 900, .04); }
      else if (name === "sun") { this.tone(700, .09, "triangle", .12, 1100); this.tone(1100, .13, "sine", .08, 1500, .06); }
      else if (name === "bite") this.tone(90, .08, "sawtooth", .1, 55);
      else if (name === "dead") this.tone(180, .25, "sawtooth", .1, 55);
      else if (name === "boom") { this.tone(105, .55, "sine", .55, 35); this.tone(60, .45, "square", .1, 28); }
      else if (name === "wave") { this.tone(330, .16, "square", .08); this.tone(500, .2, "square", .08, null, .13); this.tone(700, .3, "square", .08, null, .26); }
      else if (name === "over") { this.tone(330, .3, "sawtooth", .14, 240); this.tone(210, .4, "sawtooth", .14, 150, .28); this.tone(110, .8, "sawtooth", .18, 45, .65); }
      else if (name === "mower") { this.tone(90, .5, "sawtooth", .18, 160); this.tone(155, .3, "square", .05, 90); }
      else if (name === "no") this.tone(160, .12, "square", .1, 100);
      else this.tone(600, .05, "square", .06, 820);
    }
  }

  function rr(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = stroke === true ? 3 : stroke; ctx.strokeStyle = "#1d2b15"; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = stroke === true ? 3 : stroke; ctx.strokeStyle = "#1d2b15"; ctx.stroke(); }
  }
  function text(ctx, s, x, y, size, color, align, outline) {
    ctx.font = `900 ${size}px Impact,Arial,sans-serif`; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
    if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = Math.max(3, size * .16); ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }

  class Game {
    constructor(root) {
      injectStyle();
      this.root = typeof root === "string" ? document.querySelector(root) : root;
      if (!this.root) throw new Error("JardimZ: elemento de montagem nao encontrado.");
      this.root.innerHTML = "";
      this.root.className = "jz-root";
      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("aria-label", "Jogo Jardim Z"); this.root.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      this.layer = document.createElement("div"); this.layer.className = "jz-layer"; this.root.appendChild(this.layer);
      this.soundButton = document.createElement("button"); this.soundButton.className = "jz-sound"; this.root.appendChild(this.soundButton);
      this.sound = new Sound(); this.audio = this.sound;
      this.status = "menu"; this.t = 0; this.last = performance.now(); this.scaleX = 1; this.scaleY = 1;
      this.pointer = { x: -99, y: -99, down: false, drag: -1, sx: 0, sy: 0, moved: false, type: "mouse" };
      this.scores = getScores(); this.playerName = load("jardimz-js-name", "JOGADOR") || "JOGADOR";
      this.bind(); this.resize(); this.reset(); this.showMenu();
      this.frame = this.frame.bind(this); requestAnimationFrame(this.frame);
    }

    bind() {
      this.soundButton.onclick = () => { this.sound.unlock(); this.sound.toggle(); this.updateSoundButton(); };
      this.canvas.addEventListener("pointerdown", (e) => this.pointerDown(e));
      this.canvas.addEventListener("pointermove", (e) => this.pointerMove(e));
      this.canvas.addEventListener("pointerup", (e) => this.pointerUp(e));
      this.canvas.addEventListener("pointercancel", (e) => this.pointerUp(e));
      this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      global.addEventListener("resize", () => this.resize());
      global.addEventListener("keydown", (e) => this.key(e));
      global.addEventListener("blur", () => { if (this.status === "playing") this.pause(); });
      document.addEventListener("visibilitychange", () => { if (document.hidden && this.status === "playing") this.pause(); });
      this.updateSoundButton();
    }

    updateSoundButton() { this.soundButton.textContent = this.sound.muted ? "Som: off" : "Som: on"; this.soundButton.classList.toggle("jz-muted", this.sound.muted); }
    resize() {
      const s = Math.min(this.root.clientWidth / W, this.root.clientHeight / H), w = Math.max(160, Math.floor(W * s)), h = Math.max(99, Math.floor(H * s));
      const d = Math.min(global.devicePixelRatio || 1, 2); this.canvas.style.width = w + "px"; this.canvas.style.height = h + "px";
      this.canvas.width = Math.floor(w * d); this.canvas.height = Math.floor(h * d); this.scaleX = this.canvas.width / W; this.scaleY = this.canvas.height / H;
    }
    logical(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    reset() {
      this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); this.plants = []; this.zombies = []; this.peas = []; this.suns = []; this.particles = [];
      this.mowers = Array.from({ length: ROWS }, (_, row) => ({ row, x: 46, used: false, active: false, spin: 0 }));
      this.sun = 150; this.score = 0; this.shownScore = 0; this.kills = 0; this.combo = 0; this.comboTimer = 0; this.maxCombo = 0; this.wave = 0;
      this.cool = PLANTS.map(() => 0); this.selected = 1; this.shovel = false; this.cursor = { c: 2, r: 2 }; this.spawns = []; this.spawnIndex = 0; this.waveTime = 0; this.waitWave = 0;
      this.skyTimer = .9; this.trauma = 0; this.flash = 0; this.banner = null; this.danger = 0; this.time = 0; this.uid = 0;
    }
    start() { this.sound.unlock(); this.reset(); this.status = "playing"; this.hideLayer(); this.startWave(1); }
    startWave(n) {
      this.wave = n; this.waveTime = 0; this.waitWave = 0; this.spawnIndex = 0;
      let budget = 4 + n * 2.4 + n * n * .12, kinds = [], available = Object.keys(ZOMBIES).filter((k) => ZOMBIES[k].min <= n);
      if (n >= 10 && n % 10 === 0 && budget >= 14) { kinds.push("brute"); budget -= 14; }
      while (budget > .8 && kinds.length < 150) {
        const opts = available.filter((k) => ZOMBIES[k].cost <= budget + .6); if (!opts.length) break;
        let total = opts.reduce((a, k) => a + ZOMBIES[k].weight * (ZOMBIES[k].cost > 2 ? 1 + n * .04 : 1), 0), q = Math.random() * total, chose = opts[0];
        for (const k of opts) { q -= ZOMBIES[k].weight * (ZOMBIES[k].cost > 2 ? 1 + n * .04 : 1); if (q <= 0) { chose = k; break; } }
        kinds.push(chose); budget -= ZOMBIES[chose].cost;
      }
      const dur = Math.max(15, 26 - n * .3); const rows = [0, 1, 2, 3, 4];
      for (let i = rows.length - 1; i; i--) { const j = (Math.random() * (i + 1)) | 0; [rows[i], rows[j]] = [rows[j], rows[i]]; }
      this.spawns = kinds.map((kind, i) => ({ kind, row: i === 0 && n === 1 ? 2 : rows[i % rows.length], at: n === 1 ? 1.25 + i * 2.1 : .6 + Math.random() * (dur - .6) })).sort((a, b) => a.at - b.at);
      if (this.spawns[0] && n === 1) { this.spawns[0].kind = "basic"; this.spawns[0].at = 1.25; }
      const newKinds = Object.keys(ZOMBIES).filter((k) => ZOMBIES[k].min === n).map((k) => ZOMBIES[k].name).join(", ");
      const horde = n % 5 === 0; this.banner = { title: horde ? `ONDA ${n} - HORDA!` : `ONDA ${n}`, sub: horde ? "Uma horda enorme se aproxima!" : (newKinds ? `Novo: ${newKinds}` : n === 1 ? "Defenda o jardim!" : "Eles estao mais fortes..."), color: horde ? "#ff6b5a" : newKinds ? "#d6a6ff" : "#ffd23a", age: 0, life: horde ? 2.6 : 2 };
      this.sound.play("wave"); if (horde) { this.trauma = .45; this.flash = .2; }
    }
    spawn(kind, row) {
      const d = ZOMBIES[kind], w = this.wave, ease = w === 1 ? .62 : w === 2 ? .85 : 1, hpM = (1 + Math.max(0, w - 6) * .045 + Math.max(0, w - 20) * .02) * ease;
      this.zombies.push({ id: ++this.uid, kind, d, row, x: W + 36 + Math.random() * 30, hp: d.hp * hpM, maxHp: d.hp * hpM, armor: d.armor * hpM, maxArmor: d.armor * hpM, sp: d.sp * Math.min(1.65, 1 + (w - 1) * .014) * rand(.92, 1.08), slow: 0, bite: .2, smash: 1.6, phase: Math.random() * TAU, flash: 0, dead: false });
    }
    addPlant(i, c, r) {
      const d = PLANTS[i]; if (!d || this.grid[r][c] || this.cool[i] > 0 || this.sun < d.cost) { this.sound.play("no"); return false; }
      this.sun -= d.cost; this.cool[i] = d.cd; const p = { id: ++this.uid, type: d.id, col: c, row: r, x: cx(c), y: cy(r), hp: d.hp, maxHp: d.hp, age: 0, timer: d.id === "sun" ? 4.2 : .35, burst: 0, fuse: 1.05, flash: 0, recoil: 0, wobble: 0 };
      this.grid[r][c] = p; this.plants.push(p); this.burst(p.x, p.y + 32, 11, ["#9a7b4f", "#c2a371", "#58bd33"], 40, 170, .25, .5, 2, 5, "gib", 500); this.ring(p.x, p.y + 34, "#e8d4a8", 8, 190, .3); this.sound.play("plant"); return true;
    }
    removePlant(p, eaten) {
      if (this.grid[p.row][p.col] !== p) return; this.grid[p.row][p.col] = null; const i = this.plants.indexOf(p); if (i >= 0) this.plants.splice(i, 1);
      const colors = p.type === "nut" ? ["#c78b46", "#dba466"] : p.type === "bomb" ? ["#e2272f", "#4aa02c"] : ["#58bd33", "#8ee05a"];
      this.burst(p.x, p.y + 5, 15, colors, 70, 250, .4, .9, 3, 7, "gib", 700); if (eaten) this.trauma = Math.min(1, this.trauma + .1);
    }
    fire(p) {
      const snow = p.type === "snow"; this.peas.push({ x: p.x + 32, y: p.y - 9, row: p.row, snow, damage: 20, age: 0 }); p.recoil = 1; this.sound.play(snow ? "snow" : "shot");
      this.burst(p.x + 34, p.y - 9, 3, snow ? ["#bfeaff", "#fff"] : ["#d8ff9a", "#fff7b0"], 40, 110, .12, .22, 1, 3, "dot");
    }
    explode(p) {
      this.removePlant(p); this.sound.play("boom"); this.trauma = 1; this.flash = .55;
      for (const z of this.zombies) if (!z.dead && ((z.x - p.x) / (CW * 1.7)) ** 2 + ((cy(z.row) - p.y) / (CH * 1.55)) ** 2 < 1) this.damage(z, 1800, "boom");
      this.ring(p.x, p.y, "#ffe27a", 10, 520, .45); this.ring(p.x, p.y, "#ff7a32", 4, 340, .55);
      this.burst(p.x, p.y, 48, ["#ffd23a", "#ff9a2e", "#ff5a2e", "#fff3b0"], 120, 570, .35, .9, 2, 6, "dot", 260);
      this.burst(p.x, p.y, 16, ["#444", "#777", "#999"], 40, 220, .7, 1.4, 16, 35, "smoke", -40);
    }
    damage(z, amount, how) {
      if (z.dead) return; let left = amount;
      if (z.armor > 0) { const a = Math.min(z.armor, left); z.armor -= a; left -= a; if (z.armor <= 0) { this.burst(z.x, cy(z.row) - 45, 11, z.kind === "cone" ? ["#e8832a", "#f4f1e6"] : ["#a9b3bb", "#d9e4ea"], 80, 280, .4, .8, 3, 6, "gib", 700); } }
      z.hp -= left; z.flash = 1; if (z.hp <= 0) this.kill(z, how);
    }
    kill(z, how) {
      if (z.dead) return; z.dead = true; this.kills++; this.combo++; this.comboTimer = 2.8; this.maxCombo = Math.max(this.maxCombo, this.combo);
      const mult = 1 + Math.min(30, this.combo - 1) * .1, points = Math.round(z.d.points * mult); this.score += points;
      this.particles.push({ k: "text", x: z.x, y: cy(z.row) - 65, vy: -68, life: 1, max: 1, size: 21 + Math.min(9, this.combo), color: mult >= 2 ? "#ffb02e" : "#fff", text: "+" + fmt(points), top: true });
      this.burst(z.x, cy(z.row) - 25, z.d.big ? 24 : 13, ["#9cc58a", "#7a6b93", "#6a8a5a", "#b23a48"], 70, 310, .35, .85, 3, 7, "gib", 800);
      this.particles.push({ k: "head", x: z.x - 3, y: cy(z.row) - 65, vx: rand(-120, 150), vy: rand(-380, -240), g: 1100, life: 1.1, max: 1.1, rot: 0, vr: rand(-10, 10), runner: z.kind === "runner" });
      this.sound.play("dead"); this.trauma = Math.min(1, this.trauma + (z.d.big ? .7 : .09)); if (z.d.big) this.flash = .2;
      if (this.combo >= 5 && this.combo % 5 === 0) { this.particles.push({ k: "text", x: W / 2, y: 270, vy: -25, life: 1.2, max: 1.2, size: 54, color: "#ffd23a", text: "COMBO " + this.combo + "!", top: true }); this.sound.play("wave"); }
    }
    ring(x, y, color, size, grow, life) { this.particles.push({ k: "ring", x, y, color, size, grow, life, max: life }); }
    burst(x, y, n, colors, lo, hi, l0, l1, s0, s1, k, g) {
      for (let i = 0; i < n && this.particles.length < 500; i++) { const a = Math.random() * TAU, v = rand(lo, hi), life = rand(l0, l1); this.particles.push({ k: k || "dot", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: g || 0, rot: Math.random() * TAU, vr: rand(-10, 10), size: rand(s0, s1), color: pick(colors), life, max: life }); }
    }
    sunAt(x, y, value) { this.suns.push({ x, y, vx: rand(-45, 45), vy: -180, g: 560, target: y + rand(8, 28), landed: false, life: 11, collect: false, age: 0, value: value || 25, sx: 0, sy: 0 }); }
    collect(s) { if (s.collect) return; s.collect = true; s.sx = s.x; s.sy = s.y; s.age = 0; this.sound.play("sun"); }
    collectAll() { let n = 0; for (const s of this.suns) if (!s.collect) { this.collect(s); n++; } if (!n) this.sound.play("click"); }
    update(dt) {
      this.t += dt; this.trauma = Math.max(0, this.trauma - dt * 1.55); this.flash = Math.max(0, this.flash - dt * 2.5); this.shownScore += (this.score - this.shownScore) * Math.min(1, dt * 9);
      if (this.status !== "playing") return;
      this.time += dt; if (this.banner) { this.banner.age += dt; if (this.banner.age > this.banner.life) this.banner = null; }
      for (let i = 0; i < this.cool.length; i++) this.cool[i] = Math.max(0, this.cool[i] - dt);
      this.updateWave(dt); this.updateSky(dt); this.updatePlants(dt); this.updateZombies(dt); this.updatePeas(dt); this.updateMowers(dt); this.updateSuns(dt); this.updateParticles(dt);
      this.zombies = this.zombies.filter((z) => !z.dead); this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0;
      const near = this.zombies.some((z) => z.x < GX + CW * 1.6); this.danger += ((near ? 1 : 0) - this.danger) * Math.min(1, dt * 5);
    }
    updateWave(dt) {
      this.waveTime += dt; while (this.spawnIndex < this.spawns.length && this.spawns[this.spawnIndex].at <= this.waveTime) { const s = this.spawns[this.spawnIndex++]; this.spawn(s.kind, s.row); }
      if (this.spawnIndex === this.spawns.length && this.zombies.length === 0) { this.waitWave += dt; if (this.waitWave === 0 || this.waitWave < dt * 1.1) { const bonus = this.wave * 100, sun = Math.min(100, 25 + this.wave * 5); this.score += bonus; this.sun += sun; this.banner = { title: `ONDA ${this.wave} LIMPA!`, sub: `+${fmt(bonus)} pontos  +${sun} sol`, color: "#8dff6b", age: 0, life: 2.3 }; this.sound.play("sun"); }
        if (this.waitWave > 2.8) this.startWave(this.wave + 1); }
      else if (this.waveTime > 38) this.startWave(this.wave + 1);
    }
    updateSky(dt) { this.skyTimer -= dt; if (this.skyTimer <= 0) { this.skyTimer = this.time < 15 ? 3.3 : rand(5.5, 7.5); this.sunAt(rand(GX + 40, GX + CW * COLS - 40), GY - 24); } }
    updatePlants(dt) {
      for (const p of this.plants.slice()) {
        p.age += dt; p.flash = Math.max(0, p.flash - dt * 5); p.recoil = Math.max(0, p.recoil - dt * 7); p.wobble *= Math.max(0, 1 - dt * 8);
        if (p.type === "sun") { p.timer -= dt; if (p.timer <= 0) { p.timer = 8.5; this.sunAt(p.x, p.y - 8); this.burst(p.x, p.y - 8, 6, ["#ffe566", "#fff7b0"], 40, 120, .2, .4, 2, 4, "dot"); } }
        else if (p.type === "bomb") { p.fuse -= dt; if (p.fuse <= 0) this.explode(p); }
        else if (p.type !== "nut") { p.timer -= dt; if (p.burst > 0) { p.burst -= dt; if (p.burst <= 0) this.fire(p); }
          const has = this.zombies.some((z) => !z.dead && z.row === p.row && z.x > p.x); if (has && p.timer <= 0) { this.fire(p); p.timer = 1.4; if (p.type === "dual") p.burst = .14; } }
      }
    }
    updateZombies(dt) {
      for (const z of this.zombies) {
        z.flash = Math.max(0, z.flash - dt * 7); z.slow = Math.max(0, z.slow - dt); z.phase += dt * 3;
        const col = Math.floor((z.x - GX - 26) / CW), target = col >= 0 && col < COLS ? this.grid[z.row][col] : null, slow = z.slow ? .5 : 1;
        if (target) {
          if (z.kind === "brute") { z.smash -= dt * slow; if (z.smash <= 0) { z.smash = 1.6; target.hp -= 520; target.flash = 1; target.wobble = .35; this.trauma = Math.min(1, this.trauma + .35); this.sound.play("boom"); this.burst(target.x, target.y + 25, 10, ["#9a7b4f", "#c2a371"], 60, 240, .3, .65, 3, 6, "gib", 700); } }
          else { target.hp -= z.dps * slow * dt; z.bite -= dt; if (z.bite <= 0) { z.bite = .5 / slow; target.flash = .6; target.wobble = (Math.random() < .5 ? -1 : 1) * .23; this.sound.play("bite"); } }
          if (target.hp <= 0) this.removePlant(target, true);
        } else z.x -= z.sp * slow * dt;
        if (z.x < GX - 8) { const m = this.mowers[z.row]; if (!m.used) { m.used = true; m.active = true; this.sound.play("mower"); this.trauma = Math.min(1, this.trauma + .3); } else if (!m.active && z.x < 22) this.gameOver(); }
      }
    }
    updatePeas(dt) {
      for (let i = this.peas.length - 1; i >= 0; i--) { const p = this.peas[i]; p.x += 440 * dt; p.age += dt; const z = this.zombies.find((q) => !q.dead && q.row === p.row && p.x > q.x - 27 && p.x < q.x + 15);
        if (z) { this.damage(z, p.damage, "pea"); if (p.snow) z.slow = 4.5; this.sound.play("hit"); this.burst(p.x, p.y, p.snow ? 7 : 6, p.snow ? ["#bfeaff", "#fff", "#7fd8ff"] : ["#8ee05a", "#c9ff8a"], 50, 190, .2, .4, 2, 4, "dot", 500); this.peas.splice(i, 1); } else if (p.x > W + 20) this.peas.splice(i, 1); }
    }
    updateMowers(dt) { for (const m of this.mowers) if (m.active) { m.x += 600 * dt; m.spin += 44 * dt; for (const z of this.zombies) if (!z.dead && z.row === m.row && Math.abs(z.x - m.x) < 48) this.kill(z, "mower"); if (m.x > W + 80) m.active = false; } }
    updateSuns(dt) {
      for (let i = this.suns.length - 1; i >= 0; i--) { const s = this.suns[i]; s.age += dt; let gone = false;
        if (s.collect) { const q = Math.min(1, s.age / .48), e = q * q; s.x = s.sx + (62 - s.sx) * e; s.y = s.sy + (38 - s.sy) * e - Math.sin(q * Math.PI) * 46; if (q >= 1) { this.sun = Math.min(9990, this.sun + s.value); this.score += 5; this.sound.play("sun"); gone = true; } }
        else if (!s.landed) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += s.g * dt; if (s.vy > 0 && s.y >= s.target) { s.y = s.target; s.landed = true; s.vx = 0; } }
        else { s.life -= dt; if (s.life <= 0) gone = true; }
        if (gone) this.suns.splice(i, 1);
      }
    }
    updateParticles(dt) { for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.life -= dt; if (p.life <= 0) { this.particles.splice(i, 1); continue; } p.vy = (p.vy || 0) + (p.g || 0) * dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; p.rot = (p.rot || 0) + (p.vr || 0) * dt; if (p.grow) p.size += p.grow * dt; } }
    gameOver() {
      if (this.status !== "playing") return; this.status = "over"; this.sound.play("over"); const recordBefore = this.scores.length ? this.scores[0].score : 0;
      const entry = { id: Date.now().toString(36), name: this.playerName, score: Math.round(this.score), wave: this.wave, kills: this.kills, time: Date.now() }; let rank = -1;
      if (entry.score > 0 && (this.scores.length < 10 || entry.score > this.scores[this.scores.length - 1].score)) { this.scores.push(entry); this.scores.sort((a, b) => b.score - a.score); this.scores = this.scores.slice(0, 10); rank = this.scores.findIndex((x) => x.id === entry.id); save("jardimz-js-scores", this.scores); }
      this.showOver(entry, rank, entry.score > recordBefore);
    }
    pause() { if (this.status !== "playing") return; this.status = "paused"; this.showPause(); }
    resume() { if (this.status !== "paused") return; this.status = "playing"; this.hideLayer(); this.sound.play("click"); }
    hideLayer() { this.layer.innerHTML = ""; this.layer.style.display = "none"; }
    showMenu() {
      this.status = "menu"; this.layer.style.display = "flex";
      this.layer.innerHTML = `<div class="jz-panel"><div class="jz-grid"><section><h1 class="jz-title">JARDIM <b>Z</b></h1><div class="jz-sub">ONDAS INFINITAS</div><p class="jz-copy">Plante, colete sol e segure a horda. Cada onda fica mais forte. Ate onde voce aguenta?</p><div class="jz-actions"><button class="jz-btn" data-play>JOGAR</button><span>ou pressione <span class="jz-key">Enter</span></span></div><div class="jz-help"><div><strong>TECLADO</strong><br><span class="jz-key">WASD</span> ou setas move<br><span class="jz-key">1-6</span> planta, <span class="jz-key">Espaco</span> coloca<br><span class="jz-key">C</span> coleta, <span class="jz-key">X</span> pa</div><div><strong>TOQUE / MOUSE</strong><br>Toque na carta e no gramado.<br>Ou arraste a carta ate a casa.<br>Toque nos sois dourados.</div></div></section><aside class="jz-scorebox"><h2>RECORDES</h2>${this.scoreHTML()}</aside></div></div>`;
      this.layer.querySelector("[data-play]").onclick = () => this.start();
    }
    showPause() {
      this.layer.style.display = "flex"; this.layer.innerHTML = `<div class="jz-panel jz-pause"><h2 class="jz-title" style="font-size:58px">PAUSADO</h2><div class="jz-actions"><button class="jz-btn" data-resume>CONTINUAR</button><button class="jz-btn sun" data-restart>REINICIAR</button><button class="jz-btn alt" data-menu>MENU</button></div></div>`;
      this.layer.querySelector("[data-resume]").onclick = () => this.resume(); this.layer.querySelector("[data-restart]").onclick = () => this.start(); this.layer.querySelector("[data-menu]").onclick = () => { this.reset(); this.showMenu(); };
    }
    showOver(entry, rank, record) {
      this.layer.style.display = "flex"; const qual = rank >= 0;
      this.layer.innerHTML = `<div class="jz-panel jz-over"><div class="jz-grid"><section><h2 class="jz-title" style="font-size:50px;color:#ff6b5a">O JARDIM CAIU!</h2>${record ? '<div class="jz-badge">NOVO RECORDE!</div>' : qual ? `<div class="jz-badge" style="background:#8dff6b">POSICAO #${rank + 1}</div>` : ""}<div class="jz-stats"><div class="jz-stat jz-total"><small>Pontos</small><b>${fmt(entry.score)}</b></div><div class="jz-stat"><small>Onda</small><b>${entry.wave}</b></div><div class="jz-stat"><small>Zumbis</small><b>${entry.kills}</b></div><div class="jz-stat"><small>Combo max.</small><b>x${this.maxCombo}</b></div></div>${qual ? '<input class="jz-input" maxlength="12" value="' + this.escape(this.playerName) + '" aria-label="Seu nome no ranking">' : ""}<div class="jz-actions" style="margin-top:12px"><button class="jz-btn" data-restart>JOGAR DE NOVO</button><button class="jz-btn alt" data-menu>MENU PRINCIPAL</button></div></section><aside class="jz-scorebox"><h2>TOP 10</h2>${this.scoreHTML(entry.id)}</aside></div></div>`;
      const input = this.layer.querySelector(".jz-input"); if (input) input.oninput = () => { this.playerName = (input.value || "JOGADOR").toUpperCase(); entry.name = this.playerName; const e = this.scores.find((x) => x.id === entry.id); if (e) e.name = this.playerName; save("jardimz-js-name", this.playerName); save("jardimz-js-scores", this.scores); this.layer.querySelector(".jz-scorebox").innerHTML = `<h2>TOP 10</h2>${this.scoreHTML(entry.id)}`; };
      this.layer.querySelector("[data-restart]").onclick = () => this.start(); this.layer.querySelector("[data-menu]").onclick = () => { this.reset(); this.showMenu(); };
    }
    escape(s) { return String(s).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]); }
    scoreHTML(hi) { if (!this.scores.length) return '<p style="color:#ffe9a0">Nenhum recorde ainda.<br>Seja o primeiro!</p>'; return this.scores.map((s, i) => `<div class="jz-scoreline" style="${s.id === hi ? "background:#ffe566;color:#3b2412" : ""}"><span class="jz-rank">${i + 1}</span><span class="jz-score-name">${this.escape(s.name)}</span><small>O${s.wave}</small><span class="jz-score-val">${fmt(s.score)}</span></div>`).join(""); }
    pointerDown(e) {
      if (this.status !== "playing") return; e.preventDefault(); this.sound.unlock(); const p = this.logical(e); this.pointer = { x: p.x, y: p.y, down: true, drag: -1, sx: p.x, sy: p.y, moved: false, type: e.pointerType };
      if (p.x > 930 && p.y < 52) { this.pause(); return; } if (p.x > 930 && p.y < 95) { this.sound.toggle(); this.updateSoundButton(); return; }
      for (let i = 0; i < PLANTS.length; i++) if (p.x >= 124 + i * 84 && p.x <= 202 + i * 84 && p.y <= 90) { this.selected = i; this.shovel = false; this.pointer.drag = i; this.sound.play("click"); try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {} return; }
      if (p.x >= 634 && p.x <= 698 && p.y <= 90) { this.shovel = !this.shovel; this.sound.play("click"); return; }
      for (const s of this.suns) if (!s.collect && Math.hypot(s.x - p.x, s.y - p.y) < (e.pointerType === "mouse" ? 40 : 55)) this.collect(s);
      const cell = this.cell(p.x, p.y); if (cell) { this.cursor = cell; this.action(cell.c, cell.r); }
    }
    pointerMove(e) {
      const p = this.logical(e); this.pointer.x = p.x; this.pointer.y = p.y; if (e.pointerType === "mouse") this.pointer.type = "mouse";
      if (this.pointer.down && Math.hypot(p.x - this.pointer.sx, p.y - this.pointer.sy) > 12) this.pointer.moved = true;
      if (this.status === "playing" && e.pointerType === "mouse") for (const s of this.suns) if (!s.collect && Math.hypot(s.x - p.x, s.y - p.y) < 38) this.collect(s);
    }
    pointerUp(e) { if (this.pointer.drag >= 0 && this.pointer.moved && this.status === "playing") { const p = this.logical(e), cell = this.cell(p.x, p.y - (e.pointerType === "mouse" ? 0 : 46)); if (cell) this.addPlant(this.pointer.drag, cell.c, cell.r); } this.pointer.down = false; this.pointer.drag = -1; try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {} }
    cell(x, y) { const c = Math.floor((x - GX) / CW), r = Math.floor((y - GY) / CH); return c >= 0 && c < COLS && r >= 0 && r < ROWS ? { c, r } : null; }
    action(c, r) { if (this.shovel) { const p = this.grid[r][c]; if (!p) { this.sound.play("no"); return; } const d = PLANTS.find((q) => q.id === p.type); this.sun += Math.floor(d.cost / 2); this.removePlant(p); this.shovel = false; this.sound.play("click"); } else this.addPlant(this.selected, c, r); }
    key(e) {
      const tag = (e.target && e.target.tagName) || ""; if (tag === "INPUT" || tag === "TEXTAREA") return; const k = e.key;
      if ((k === "m" || k === "M") && !e.repeat) { this.sound.unlock(); this.sound.toggle(); this.updateSoundButton(); return; }
      if (this.status === "menu") { if (k === "Enter" || k === " ") { e.preventDefault(); this.start(); } return; }
      if (this.status === "paused") { if (k === "p" || k === "P" || k === "Escape" || k === "Enter") { e.preventDefault(); this.resume(); } else if (k === "r" || k === "R") this.start(); return; }
      if (this.status === "over") { if (k === "r" || k === "R" || k === "Enter") this.start(); else if (k === "Escape") { this.reset(); this.showMenu(); } return; }
      if (k === "p" || k === "P" || k === "Escape") { e.preventDefault(); this.pause(); return; }
      const move = (a, b) => { this.cursor.c = clamp(this.cursor.c + a, 0, COLS - 1); this.cursor.r = clamp(this.cursor.r + b, 0, ROWS - 1); this.pointer.type = "key"; e.preventDefault(); };
      if (k === "ArrowLeft" || k === "a" || k === "A") move(-1, 0); else if (k === "ArrowRight" || k === "d" || k === "D") move(1, 0); else if (k === "ArrowUp" || k === "w" || k === "W") move(0, -1); else if (k === "ArrowDown" || k === "s" || k === "S") move(0, 1);
      else if (k >= "1" && k <= "6") { this.selected = +k - 1; this.shovel = false; this.sound.play("click"); }
      else if (k === " " || k === "Enter") { e.preventDefault(); this.action(this.cursor.c, this.cursor.r); }
      else if (k === "x" || k === "X" || k === "Backspace") { this.shovel = !this.shovel; this.sound.play("click"); }
      else if (k === "c" || k === "C") this.collectAll();
    }
    frame(now) { let dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.update(dt); this.draw(); requestAnimationFrame(this.frame); }
    draw() {
      const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#153815"; c.fillRect(0, 0, this.canvas.width, this.canvas.height); c.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
      c.save(); if (this.trauma) { const a = this.trauma * this.trauma * 18; c.translate(W / 2 + rand(-a, a), H / 2 + rand(-a, a)); c.rotate(rand(-.018, .018) * this.trauma); c.translate(-W / 2, -H / 2); }
      this.drawLawn(c); this.drawWorld(c); if (this.danger > .02) { const g = c.createLinearGradient(0, 0, 220, 0); g.addColorStop(0, `rgba(255,30,30,${this.danger * .3})`); g.addColorStop(1, "rgba(255,30,30,0)"); c.fillStyle = g; c.fillRect(0, GY, 220, H - GY); } if (this.flash) { c.globalAlpha = this.flash; c.fillStyle = "#fff3d0"; c.fillRect(0, 0, W, H); c.globalAlpha = 1; } c.restore();
      this.drawHud(c); this.drawTop(c);
    }
    drawLawn(c) {
      c.fillStyle = "#245c23"; c.fillRect(0, 0, W, H); for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) { c.fillStyle = (r + q) % 2 ? "#7ccf47" : "#6fc23b"; c.fillRect(GX + q * CW, GY + r * CH, CW, CH); }
      c.fillStyle = "#c9b58a"; c.fillRect(0, GY, GX, ROWS * CH); c.fillStyle = "#63391f"; c.fillRect(0, GY, 14, ROWS * CH); c.fillStyle = "#285f28"; c.fillRect(0, 100, W, 12); c.fillStyle = "#255824"; c.fillRect(0, GY + ROWS * CH, W, H - (GY + ROWS * CH));
      c.strokeStyle = "rgba(0,50,0,.12)"; c.lineWidth = 1; for (let r = 0; r <= ROWS; r++) { c.beginPath(); c.moveTo(GX, GY + r * CH); c.lineTo(GX + COLS * CW, GY + r * CH); c.stroke(); }
      c.fillStyle = "#4e2f18"; c.fillRect(0, 0, W, 100); c.fillStyle = "#7a4b27"; c.fillRect(0, 0, W, 4); c.fillStyle = "#211306"; c.fillRect(0, 96, W, 5);
    }
    drawWorld(c) {
      let target = this.pointer.type === "key" ? this.cursor : this.cell(this.pointer.x, this.pointer.y); if (target && this.status === "playing") { const valid = this.shovel ? !!this.grid[target.r][target.c] : !this.grid[target.r][target.c]; c.fillStyle = valid ? "rgba(255,255,255,.18)" : "rgba(255,50,30,.22)"; c.fillRect(GX + target.c * CW, GY + target.r * CH, CW, CH); c.strokeStyle = valid ? "#fff" : "#ff6b5a"; c.lineWidth = 3; c.strokeRect(GX + target.c * CW + 3, GY + target.r * CH + 3, CW - 6, CH - 6); }
      for (let r = 0; r < ROWS; r++) { const m = this.mowers[r]; if (!m.used || m.active) this.drawMower(c, m); for (const p of this.plants.filter((x) => x.row === r)) this.drawPlant(c, p); for (const z of this.zombies.filter((x) => x.row === r && !x.dead)) this.drawZombie(c, z); }
      for (const p of this.peas) { c.fillStyle = p.snow ? "#9fe6ff" : "#7ddc3c"; ellipse(c, p.x, p.y, 8, 8, p.snow ? "#9fe6ff" : "#7ddc3c", 2); c.fillStyle = "#fff"; c.beginPath(); c.arc(p.x - 2, p.y - 3, 2, 0, TAU); c.fill(); }
      for (const s of this.suns) if (!s.collect) this.drawSun(c, s); for (const p of this.particles) if (!p.top && p.k !== "text") this.drawParticle(c, p);
    }
    drawHud(c) {
      rr(c, 12, 10, 104, 80, 14, "#f7edc2", 3); this.sunIcon(c, 63, 39, .65); text(c, fmt(this.sun), 64, 84, 27, "#5a3a10", "center");
      for (let i = 0; i < PLANTS.length; i++) { const d = PLANTS[i], x = 124 + i * 84, ready = this.cool[i] <= 0, active = this.selected === i && !this.shovel, afford = this.sun >= d.cost; rr(c, x, 10 + (active ? -4 : 0), 78, 80, 11, ready && afford ? "#f6efd2" : "#d4cba8", 3); c.save(); c.beginPath(); c.roundRect(x, 10 + (active ? -4 : 0), 78, 58, 11); c.clip(); c.translate(x + 39, 43 + (active ? -4 : 0)); c.scale(.5, .5); this.drawPlantIcon(c, d.id); c.restore(); c.fillStyle = "#3b2412"; c.fillRect(x + 2, 68 + (active ? -4 : 0), 74, 19); text(c, d.cost, x + 39, 84 + (active ? -4 : 0), 17, afford ? "#ffd23a" : "#ff7b6b", "center"); if (!ready) { c.fillStyle = "rgba(15,10,5,.62)"; c.fillRect(x + 2, 12 + (active ? -4 : 0), 74, 56 * (this.cool[i] / d.cd)); } text(c, String(i + 1), x + 10, 22 + (active ? -4 : 0), 12, "#fff", "center", "#1d1208"); }
      rr(c, 634, 10 + (this.shovel ? -4 : 0), 64, 80, 11, this.shovel ? "#ffe9a0" : "#e6d9b8", 3); c.save(); c.translate(666, 43 + (this.shovel ? -4 : 0)); c.rotate(.6); rr(c, -3, -25, 6, 35, 2, "#8a5a2b", 2); c.fillStyle = "#b8c2c8"; c.beginPath(); c.moveTo(-10, 6); c.lineTo(10, 6); c.lineTo(8, 27); c.quadraticCurveTo(0, 33, -8, 27); c.fill(); c.strokeStyle = "#1d2b15"; c.lineWidth = 2; c.stroke(); c.restore(); text(c, "PA", 666, 84 + (this.shovel ? -4 : 0), 14, "#3b2412", "center");
      text(c, "PONTOS", 716, 25, 14, "#e7c58a"); text(c, fmt(this.shownScore), 716, 61, 35, "#fff", "left", "#211306"); text(c, "ONDA", 916, 25, 14, "#e7c58a", "right"); text(c, this.wave || 1, 916, 61, 35, "#ffd23a", "right", "#211306"); text(c, `${this.zombies.length + this.spawns.length - this.spawnIndex} zumbis`, 916, 84, 13, "#e7c58a", "right");
      rr(c, 930, 12, 60, 38, 10, "#e6d9b8", 3); c.fillStyle = "#3b2412"; c.fillRect(948, 22, 6, 17); c.fillRect(960, 22, 6, 17); rr(c, 930, 54, 60, 38, 10, "#e6d9b8", 3); text(c, this.sound.muted ? "X" : "SOM", 960, 79, this.sound.muted ? 24 : 14, this.sound.muted ? "#c0392b" : "#3b2412", "center");
    }
    drawTop(c) { for (const s of this.suns) if (s.collect) this.drawSun(c, s); for (const p of this.particles) if (p.top || p.k === "text") this.drawParticle(c, p); if (this.combo >= 2) { const f = clamp(this.comboTimer / 2.8, 0, 1); text(c, `COMBO ${this.combo}`, 980, 140, 22, "#fff", "right", "#211306"); text(c, "x" + (1 + Math.min(30, this.combo - 1) * .1).toFixed(1), 980, 172, 32, this.combo >= 11 ? "#ff5ac8" : "#ffb02e", "right", "#211306"); c.fillStyle = "#0008"; c.fillRect(870, 181, 110, 7); c.fillStyle = f > .3 ? "#ffd23a" : "#ff6b5a"; c.fillRect(871, 182, 108 * f, 5); }
      if (this.banner) { const b = this.banner, a = Math.min(1, b.age / .25, (b.life - b.age) / .35); c.globalAlpha = Math.max(0, a); c.fillStyle = "#0009"; c.fillRect(0, 266, W, 102); text(c, b.title, W / 2, 326, 60, b.color, "center", "#211306"); text(c, b.sub, W / 2, 359, 25, "#fff", "center", "#211306"); c.globalAlpha = 1; }
    }
    sunIcon(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); for (let i = 0; i < 12; i++) { c.save(); c.rotate(i * TAU / 12); c.fillStyle = "#ffb300"; c.beginPath(); c.moveTo(-5, -20); c.lineTo(0, -35); c.lineTo(5, -20); c.fill(); c.restore(); } ellipse(c, 0, 0, 21, 21, "#ffd426", 3); ellipse(c, -6, -7, 7, 4, "#fff8", 0); c.restore(); }
    drawSun(c, s) { let a = 1; if (s.landed && s.life < 3) a = .45 + .55 * Math.abs(Math.sin(s.age * 9)); c.save(); c.globalAlpha = a; c.translate(s.x, s.y); c.rotate(s.age); this.sunIcon(c, 0, 0, .8 * (s.collect ? 1 - Math.min(.3, s.age * .5) : 1)); c.restore(); }
    drawPlantIcon(c, type) { this.drawPlantGraphic(c, { type, hp: 1, maxHp: 1, age: this.t, flash: 0, recoil: 0, wobble: 0, fuse: 1 }, false); }
    drawPlant(c, p) { c.save(); c.translate(p.x, p.y); const k = p.age < .3 ? p.age / .3 : 1; c.scale(k, k); c.rotate(p.wobble); this.drawPlantGraphic(c, p, true); c.restore(); }
    drawPlantGraphic(c, p, shadow) {
      const type = p.type, blink = ((this.t + (p.id || 0)) % 4.2) < .12; if (shadow) ellipse(c, 0, 37, 27, 7, "#0004", 0);
      const stem = () => { c.lineCap = "round"; c.strokeStyle = "#1d2b15"; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 37); c.quadraticCurveTo(-5, 22, 0, 0); c.stroke(); c.strokeStyle = "#4cae2a"; c.lineWidth = 5; c.stroke(); ellipse(c, -16, 26, 14, 6, "#58bd33", 2, -.45); ellipse(c, 16, 25, 14, 6, "#58bd33", 2, .45); };
      if (type === "sun") { stem(); c.save(); c.translate(0, -14); c.scale(.8, .8); for (let i = 0; i < 11; i++) { const a = i * TAU / 11 + this.t * .3; ellipse(c, Math.cos(a) * 24, Math.sin(a) * 24, 12, 7, i % 2 ? "#ffb21a" : "#ffd93b", 2, a); } ellipse(c, 0, 0, 17, 17, "#a8622a", 3); this.face(c, 0, 0, blink, false); c.restore(); return; }
      if (type === "nut") { ellipse(c, 0, 4, 29, 35, "#c78b46", 3); ellipse(c, -9, -8, 10, 16, "#dba466", 0, .25); const hurt = p.hp / p.maxHp < .5; this.face(c, 0, -4, blink, hurt); c.strokeStyle = "#2a160a"; c.lineWidth = 3; c.beginPath(); c.arc(0, hurt ? 18 : 10, 8, hurt ? Math.PI * 1.15 : Math.PI * .15, hurt ? Math.PI * 1.85 : Math.PI * .85); c.stroke(); if (p.hp / p.maxHp < .7) { c.beginPath(); c.moveTo(-20, -22); c.lineTo(-13, -13); c.lineTo(-18, -6); c.stroke(); } return; }
      if (type === "bomb") { const f = clamp(1 - p.fuse / 1.05, 0, 1), k = 1 + f * .4 + Math.sin(this.t * 32) * f * .03; c.save(); c.translate(0, 25); c.scale(k, k); c.translate(0, -25); c.strokeStyle = "#1d2b15"; c.lineWidth = 7; c.beginPath(); c.moveTo(-15, 8); c.quadraticCurveTo(-12, -24, 1, -34); c.moveTo(15, 10); c.quadraticCurveTo(15, -20, 1, -34); c.stroke(); c.strokeStyle = "#4aa02c"; c.lineWidth = 3.5; c.stroke(); ellipse(c, 10, -36, 12, 5, "#58bd33", 2, -.4); for (const q of [-16, 16]) { ellipse(c, q, 12, 20, 20, f > .65 && Math.sin(this.t * 30) > 0 ? "#fff" : "#e2272f", 3); this.face(c, q, 10, false, f > .3); } c.restore(); return; }
      stem(); const cfg = type === "snow" ? ["#8fe0ff", "#62c3ee"] : type === "dual" ? ["#4fb532", "#3a9a26"] : ["#74d63f", "#5fba2e"]; c.save(); c.translate(-2 - p.recoil * 6, -12); ellipse(c, 0, 0, 23, 21, p.flash ? "#fff" : cfg[0], 3); ellipse(c, 22, 3, type === "dual" ? 13 : 11, 10, cfg[1], 3); ellipse(c, 30, 3, 4, 6, "#17300d", 0); if (type === "dual") { c.save(); c.beginPath(); c.ellipse(0, 0, 23, 21, 0, 0, TAU); c.clip(); c.fillStyle = "#c0392b"; c.fillRect(-25, -15, 50, 6); c.restore(); } this.face(c, 1, -4, blink, type === "dual"); c.restore();
    }
    face(c, x, y, blink, angry) { if (blink) { c.strokeStyle = "#1d2b15"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 10, y - 2); c.lineTo(x - 3, y - 2); c.moveTo(x + 3, y - 2); c.lineTo(x + 10, y - 2); c.stroke(); } else { ellipse(c, x - 6, y - 3, 5.8, 6.8, "#fff", 2); ellipse(c, x + 7, y - 3, 5.5, 6.4, "#fff", 2); ellipse(c, x - 4.5, y - 3, 2.8, 3.4, "#111", 0); ellipse(c, x + 8.2, y - 3, 2.7, 3.2, "#111", 0); } c.strokeStyle = "#1d2b15"; c.lineWidth = 2.5; c.beginPath(); if (angry) { c.moveTo(x - 12, y - 14); c.lineTo(x - 2, y - 10); c.moveTo(x + 3, y - 10); c.lineTo(x + 13, y - 14); } else c.arc(x, y + 4, 6, Math.PI * .15, Math.PI * .85); c.stroke(); }
    drawZombie(c, z) {
      const big = z.d.big, s = big ? 1.3 : 1, y = cy(z.row) + GROUND; c.save(); c.translate(z.x, y); c.scale(s, s); const step = Math.sin(z.phase) * 5, slow = z.slow > 0;
      ellipse(c, 0, 0, 24, 6, "#0004", 0); c.strokeStyle = "#1d2b15"; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(-5, -25); c.lineTo(-8 + step, -2); c.moveTo(6, -25); c.lineTo(8 - step, -2); c.stroke(); c.strokeStyle = "#4f566e"; c.lineWidth = 5; c.stroke(); ellipse(c, -9 + step, -1, 10, 4.7, "#292622", 2); ellipse(c, 10 - step, -1, 10, 4.7, "#292622", 2);
      rr(c, -14, -61, 28, 37, 9, slow ? "#6587a0" : z.kind === "runner" ? "#c44a36" : big ? "#8a6a4a" : "#7a6b93", 3); c.strokeStyle = "#1d2b15"; c.lineWidth = big ? 11 : 8; c.beginPath(); c.moveTo(-9, -54); c.lineTo(-25, -37); c.moveTo(9, -54); c.lineTo(23, -38); c.stroke(); c.strokeStyle = z.d.color; c.lineWidth = big ? 6 : 4.5; c.stroke();
      if (big) { c.save(); c.translate(-24, -36); c.rotate(.5 + Math.max(0, 1 - z.smash / .5) * 2.5); rr(c, -5, 8, 10, 38, 3, "#8a5a2b", 2); ellipse(c, 0, 46, 11, 13, "#9a6a35", 2); c.restore(); }
      ellipse(c, -3, -79, 16, 18, z.flash ? "#fff" : slow ? "#82bdd2" : z.d.color, 3); ellipse(c, -11, -82, 5, 6, "#f4f2d6", 2); ellipse(c, 2, -84, 4, 5, "#f4f2d6", 2); ellipse(c, -12, -82, 2, 2.5, "#b01e1e", 0); ellipse(c, 1, -84, 1.8, 2, "#111", 0); rr(c, -15, -72, 17, 5, 2, "#3b1a1a", 2);
      if (z.kind === "cone" && z.armor > 0) { c.fillStyle = "#e8832a"; c.beginPath(); c.moveTo(-18, -92); c.lineTo(7, -92); c.lineTo(-5, -120); c.fill(); c.strokeStyle = "#1d2b15"; c.lineWidth = 3; c.stroke(); c.fillStyle = "#f4f1e6"; c.fillRect(-15, -101, 20, 4); }
      if (z.kind === "bucket" && z.armor > 0) { rr(c, -19, -108, 30, 26, 3, "#a9b3bb", 3); c.fillStyle = "#d9e4ea"; c.fillRect(-17, -109, 26, 4); }
      if (z.kind === "runner") { c.fillStyle = "#e04b3a"; c.fillRect(-20, -90, 33, 7); } c.restore();
    }
    drawMower(c, m) { c.save(); c.translate(m.x, cy(m.row) + GROUND - 4); ellipse(c, 0, 0, 26, 6, "#0004", 0); c.strokeStyle = "#1d2b15"; c.lineWidth = 5; c.beginPath(); c.moveTo(12, -26); c.lineTo(30, -46); c.stroke(); ellipse(c, -12, -8, 8, 8, "#2f2f33", 2); ellipse(c, 14, -8, 8, 8, "#2f2f33", 2); rr(c, -22, -28, 44, 22, 7, "#d63d2f", 3); rr(c, -9, -37, 21, 11, 4, "#f1f1f1", 2); c.restore(); }
    drawParticle(c, p) { const a = clamp(p.life / p.max, 0, 1); c.globalAlpha = Math.min(1, a * 1.8); if (p.k === "ring") { c.strokeStyle = p.color; c.lineWidth = 1 + 5 * a; c.beginPath(); c.arc(p.x, p.y, p.size, 0, TAU); c.stroke(); } else if (p.k === "text") text(c, p.text, p.x, p.y, p.size, p.color, "center", "#211306"); else if (p.k === "head") { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); ellipse(c, 0, 0, 14, 15, p.runner ? "#a8d17d" : "#9cc58a", 2); ellipse(c, -5, -3, 4, 5, "#f4f2d6", 1); ellipse(c, 3, -4, 3.5, 4, "#f4f2d6", 1); c.restore(); } else if (p.k === "smoke") { c.globalAlpha = a * .45; ellipse(c, p.x, p.y, p.size, p.size, p.color, 0); } else { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color; c.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .65); c.restore(); } c.globalAlpha = 1; }
  }

  global.JardimZ = {
    mount(root) { return new Game(root || "#root"); },
    Game
  };
})(window);