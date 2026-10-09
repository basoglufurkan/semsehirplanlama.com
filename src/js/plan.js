// Prosedürel imar planı üreticisi.
// Yapı adaları, parseller, bina oturumları (çekme mesafeli), dere, bulvar,
// meydan, ağaçlar ve plan notasyonları (E=1.50 gibi) içeren bir SVG çizer.

const NS = 'http://www.w3.org/2000/svg';

export const ZONES = ['konut', 'ticaret', 'yesil', 'donati'];

// mulberry32: aynı seed her seferinde aynı planı üretir
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

const round = (n) => Math.round(n * 10) / 10;

export function buildPlan(svg, opts = {}) {
  const {
    seed = 7,
    size = 1000,
    cols = 7,
    street = 16,
    river = true,
    avenue = true,
    buildings = true,
    trees = true,
    labels = false,
    macro = false,
    blockFill = false,
  } = opts;

  const r = rng(seed);
  const B = size / cols;
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.classList.add('plan');

  const root = el('g', { class: 'plan-root' }, svg);
  const g = {
    root,
    blocks: el('g', { class: 'plan-blocks' }, root),
    parcels: el('g', { class: 'plan-parcels' }, root),
    buildings: el('g', { class: 'plan-buildings' }, root),
    water: el('g', { class: 'plan-water' }, root),
    roads: el('g', { class: 'plan-roads' }, root),
    trees: el('g', { class: 'plan-trees' }, root),
    labels: el('g', { class: 'plan-labels' }, root),
    macro: el('g', { class: 'plan-macro' }, root),
  };

  // --- Dere -------------------------------------------------------------
  const ph1 = r() * Math.PI * 2;
  const ph2 = r() * Math.PI * 2;
  const riverBase = size * (0.62 + r() * 0.1);
  const rw = size * 0.032;
  const riverY = (x) =>
    riverBase +
    size * 0.07 * Math.sin((x / size) * Math.PI * 1.8 + ph1) +
    size * 0.025 * Math.sin((x / size) * Math.PI * 4.6 + ph2);

  // --- Bulvar ve meydan -----------------------------------------------
  const a0 = { x: -size * 0.05, y: size * (0.12 + r() * 0.12) };
  const a1 = { x: size * 1.05, y: size * (0.38 + r() * 0.14) };
  const plazaT = 0.42 + r() * 0.12;
  const plaza = {
    x: a0.x + (a1.x - a0.x) * plazaT,
    y: a0.y + (a1.y - a0.y) * plazaT,
    r: size * 0.06,
  };
  const park = { x: size * (0.15 + r() * 0.7), y: size * (0.08 + r() * 0.3) };

  // --- Yapı adaları ----------------------------------------------------
  const colsX = [];
  for (let x = -B * 0.45; x < size + B * 0.2; ) {
    const w = B * (0.72 + r() * 0.56);
    colsX.push([x, w]);
    x += w + street;
  }
  const rowsY = [];
  for (let y = -B * 0.4; y < size + B * 0.2; ) {
    const h = B * (0.66 + r() * 0.5);
    rowsY.push([y, h]);
    y += h + street;
  }

  const parcels = [];
  const blocks = [];

  // Dereyi kesen adalar, dere kıyısında kalan parçalara bölünür
  const cells = [];
  for (const [x, w] of colsX) {
    for (const [y, h] of rowsY) {
      if (!river) {
        cells.push({ x, y, w, h, riverside: false });
        continue;
      }
      let top = Infinity;
      let bot = -Infinity;
      for (let k = 0; k <= 6; k++) {
        const ry = riverY(x + (w * k) / 6);
        top = Math.min(top, ry - rw - street * 0.7);
        bot = Math.max(bot, ry + rw + street * 0.7);
      }
      if (y + h <= top || y >= bot) {
        const gap = y + h <= top ? top - (y + h) : y - bot;
        cells.push({ x, y, w, h, riverside: gap < B * 0.35 });
        continue;
      }
      if (top - y > B * 0.22) cells.push({ x, y, w, h: top - y, riverside: true });
      if (y + h - bot > B * 0.22) cells.push({ x, y: bot, w, h: y + h - bot, riverside: true });
    }
  }

  for (const { x: bx, y: by, w: bw, h: bh, riverside } of cells) {
    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    const dPlaza = Math.hypot(cx - plaza.x, cy - plaza.y) / size;
    const dPark = Math.hypot(cx - park.x, cy - park.y) / size;

    let zone = 'konut';
    const roll = r();
    if ((riverside && roll < 0.65) || dPark < 0.09) zone = 'yesil';
    else if (dPlaza < 0.17) zone = roll < 0.72 ? 'ticaret' : 'konut';
    else if (roll < 0.1) zone = 'donati';
    else if (roll < 0.15) zone = 'yesil';
    else if (roll < 0.2) zone = 'ticaret';

    const block = { x: bx, y: by, w: bw, h: bh, zone, d: dPlaza };
    blocks.push(block);

    el(
      'rect',
      {
        x: round(bx), y: round(by), width: round(bw), height: round(bh),
        class: `block z-${zone}`, 'data-zone': zone,
      },
      g.blocks,
    );

    // Parsellere bölme
    const gap = street * 0.2;
    let cells = [{ x: bx, y: by, w: bw, h: bh }];
    if (zone !== 'yesil') {
      const horizontal = bw >= bh;
      const n = 1 + Math.floor(r() * 3);
      const split = [];
      let rest = 1;
      for (let i = 0; i < n; i++) {
        const part = i === n - 1 ? rest : rest * (0.35 + r() * 0.3);
        split.push(part);
        rest -= part;
      }
      cells = [];
      let off = 0;
      for (const part of split) {
        if (horizontal) cells.push({ x: bx + off * bw, y: by, w: part * bw, h: bh });
        else cells.push({ x: bx, y: by + off * bh, w: bw, h: part * bh });
        off += part;
      }
      if (r() < 0.55) {
        cells = cells.flatMap((c) =>
          horizontal
            ? [{ ...c, h: c.h / 2 }, { ...c, y: c.y + c.h / 2, h: c.h / 2 }]
            : [{ ...c, w: c.w / 2 }, { ...c, x: c.x + c.w / 2, w: c.w / 2 }],
        );
      }
    }

    for (const c of cells) {
      const p = {
        x: c.x + gap / 2, y: c.y + gap / 2,
        w: Math.max(c.w - gap, 1), h: Math.max(c.h - gap, 1),
        zone, d: dPlaza,
      };
      parcels.push(p);
      p.node = el(
        'rect',
        {
          x: round(p.x), y: round(p.y), width: round(p.w), height: round(p.h),
          class: `parcel z-${zone}`, 'data-zone': zone,
        },
        g.parcels,
      );
      p.node.__d = dPlaza;

      if (buildings && zone !== 'yesil') {
        // Çekme mesafeleri: ön/yan bahçe boşlukları
        const s = Math.min(p.w, p.h) * (0.16 + r() * 0.08);
        const bwid = p.w - s * 2;
        const bhei = p.h - s * 2;
        if (bwid > 4 && bhei > 4) {
          const bNode = el(
            'rect',
            {
              x: round(p.x + s), y: round(p.y + s),
              width: round(bwid), height: round(bhei),
              class: `bldg z-${zone}`, 'data-zone': zone,
            },
            g.buildings,
          );
          bNode.__d = dPlaza;
        }
      }

      if (labels && r() < 0.45 && p.w > B * 0.28 && p.h > B * 0.22) {
        const txt =
          zone === 'konut' ? ['E=1.50', 'E=1.20', 'E=2.00'][Math.floor(r() * 3)]
          : zone === 'ticaret' ? ['TİCK E=2.50', 'T E=2.00'][Math.floor(r() * 2)]
          : zone === 'donati' ? ['Eğitim', 'Sağlık', 'Kültür', 'Spor'][Math.floor(r() * 4)]
          : '';
        if (txt) {
          el('text', { x: round(p.x + p.w / 2), y: round(p.y + p.h / 2 + 1.6), class: 'plan-label' }, g.labels)
            .textContent = txt;
        }
      }
    }

    if (trees && zone === 'yesil') {
      const count = Math.round((bw * bh) / (B * B) * 9);
      for (let i = 0; i < count; i++) {
        const tr = B * (0.03 + r() * 0.035);
        el(
          'circle',
          {
            cx: round(bx + tr + r() * (bw - tr * 2)),
            cy: round(by + tr + r() * (bh - tr * 2)),
            r: round(tr), class: 'tree',
          },
          g.trees,
        );
      }
      if (labels && bw > B * 0.6) {
        el('text', { x: round(cx), y: round(cy + 1.6), class: 'plan-label plan-label--park' }, g.labels)
          .textContent = 'Park';
      }
    }
  }

  // --- Dere çizimi -------------------------------------------------------
  if (river) {
    const top = [];
    const bottom = [];
    for (let x = -40; x <= size + 40; x += 10) {
      const y = riverY(x);
      top.push(`${x},${round(y - rw)}`);
      bottom.unshift(`${x},${round(y + rw)}`);
    }
    el('path', { d: `M${top.join('L')}L${bottom.join('L')}Z`, class: 'water' }, g.water);
    el('path', { d: `M${top.join('L')}`, class: 'bank', 'vector-effect': 'non-scaling-stroke' }, g.roads);
    el('path', { d: `M${bottom.reverse().join('L')}`, class: 'bank', 'vector-effect': 'non-scaling-stroke' }, g.roads);
  }

  // --- Bulvar ----------------------------------------------------------
  if (avenue) {
    const dx = a1.x - a0.x;
    const dy = a1.y - a0.y;
    const len = Math.hypot(dx, dy);
    const nx = (-dy / len) * street * 1.25;
    const ny = (dx / len) * street * 1.25;
    el('line', {
      x1: a0.x, y1: a0.y, x2: a1.x, y2: a1.y,
      class: 'avenue', 'stroke-width': street * 2.5,
    }, g.roads);
    for (const s of [1, -1]) {
      el('line', {
        x1: round(a0.x + nx * s), y1: round(a0.y + ny * s),
        x2: round(a1.x + nx * s), y2: round(a1.y + ny * s),
        class: 'road-edge', 'vector-effect': 'non-scaling-stroke',
      }, g.roads);
    }
    el('line', {
      x1: a0.x, y1: a0.y, x2: a1.x, y2: a1.y,
      class: 'road-axis', 'vector-effect': 'non-scaling-stroke',
    }, g.roads);

    if (trees) {
      const step = street * 3;
      for (let t = 0; t < len; t += step) {
        const px = a0.x + (dx / len) * t;
        const py = a0.y + (dy / len) * t;
        if (Math.hypot(px - plaza.x, py - plaza.y) < plaza.r * 1.15) continue;
        for (const s of [0.62, -0.62]) {
          el('circle', { cx: round(px + nx * s), cy: round(py + ny * s), r: street * 0.38, class: 'tree tree--street' }, g.trees);
        }
      }
    }

    // Meydan
    el('circle', { cx: round(plaza.x), cy: round(plaza.y), r: round(plaza.r), class: 'plaza' }, g.roads);
    el('circle', { cx: round(plaza.x), cy: round(plaza.y), r: round(plaza.r * 0.55), class: 'plaza-inner' }, g.roads);
    el('circle', { cx: round(plaza.x), cy: round(plaza.y), r: round(plaza.r * 0.12), class: 'plaza-core' }, g.roads);
  }

  // --- Üst ölçek (çevre düzeni) katmanı ----------------------------------
  if (macro) {
    const blob = (cx, cy, rad, wobble, cls) => {
      const pts = [];
      const k = 3 + Math.floor(r() * 3);
      const ph = r() * 6;
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const rr = rad * (1 + wobble * Math.sin(a * k + ph) + wobble * 0.5 * Math.cos(a * (k + 2)));
        pts.push(`${round(cx + Math.cos(a) * rr)},${round(cy + Math.sin(a) * rr)}`);
      }
      return el('path', { d: `M${pts.join('L')}Z`, class: cls }, g.macro);
    };
    el('rect', { x: -size, y: -size, width: size * 3, height: size * 3, class: 'macro-tarim' }, g.macro);
    blob(size * 0.12, size * 0.12, size * 0.32, 0.12, 'macro-orman');
    blob(size * 0.92, size * 0.9, size * 0.3, 0.14, 'macro-orman');
    blob(plaza.x, plaza.y + size * 0.08, size * 0.36, 0.1, 'macro-kent');
    blob(plaza.x - size * 0.02, plaza.y, size * 0.1, 0.12, 'macro-merkez');
    if (river) {
      const pts = [];
      for (let x = -40; x <= size + 40; x += 20) pts.push(`${x},${round(riverY(x))}`);
      el('path', { d: `M${pts.join('L')}`, class: 'macro-dere', 'stroke-width': rw * 1.3 }, g.macro);
    }
  }

  if (!blockFill) g.blocks.style.display = 'none';

  return { ...g, plaza, size, parcelList: parcels, blockList: blocks };
}

// Topoğrafik eşyükselti eğrileri (portre çerçevesi için)
export function buildContours(svg, { seed = 3, size = 600, count = 14 } = {}) {
  const r = rng(seed);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const g = el('g', { class: 'contours' }, svg);
  const cx = size * (0.45 + r() * 0.1);
  const cy = size * (0.45 + r() * 0.1);
  const phases = [r() * 6, r() * 6, r() * 6];
  for (let i = 1; i <= count; i++) {
    const base = (i / count) * size * 0.78;
    const pts = [];
    for (let s = 0; s <= 120; s++) {
      const a = (s / 120) * Math.PI * 2;
      const rr =
        base *
        (1 +
          0.12 * Math.sin(a * 3 + phases[0] + i * 0.15) +
          0.07 * Math.sin(a * 5 + phases[1] - i * 0.1) +
          0.04 * Math.cos(a * 7 + phases[2]));
      pts.push(`${round(cx + Math.cos(a) * rr)},${round(cy + Math.sin(a) * rr * 0.86)}`);
    }
    el('path', { d: `M${pts.join('L')}Z`, class: i % 5 === 0 ? 'contour contour--major' : 'contour' }, g);
  }
  return g;
}
