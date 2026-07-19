// Squarified treemap layout algorithm.
// Given a rectangle {x, y, w, h} and an array of weighted items,
// returns items with computed {x, y, w, h}.
//
// Reference: Bruls, Huijsen & van Wijk (2000)

function worst(row, w, sumRow) {
  const rMax = Math.max(...row.map((r) => r.value));
  const rMin = Math.min(...row.map((r) => r.value));
  const s2 = sumRow * sumRow;
  const w2 = w * w;
  return Math.max((w2 * rMax) / s2, s2 / (w2 * rMin));
}

function layoutRow(row, rect, horizontal) {
  const total = row.reduce((s, x) => s + x.value, 0);
  if (horizontal) {
    // row along the top, spans rect.w, height = total / w
    const rowH = total / rect.w;
    let x = rect.x;
    row.forEach((item) => {
      const w = item.value / rowH;
      item.rect = { x, y: rect.y, w, h: rowH };
      x += w;
    });
    return { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH };
  } else {
    // row along the left, spans rect.h, width = total / h
    const rowW = total / rect.h;
    let y = rect.y;
    row.forEach((item) => {
      const h = item.value / rowW;
      item.rect = { x: rect.x, y, w: rowW, h };
      y += h;
    });
    return { x: rect.x + rowW, y: rect.y, w: rect.w - rowW, h: rect.h };
  }
}

export function squarify(items, rect) {
  // items: [{ value, ...anything }]
  // Normalize values to the rect area
  const totalValue = items.reduce((s, x) => s + x.value, 0);
  if (totalValue <= 0 || rect.w <= 0 || rect.h <= 0) return items.map((i) => ({ ...i, rect: { x: rect.x, y: rect.y, w: 0, h: 0 } }));
  const scale = (rect.w * rect.h) / totalValue;

  // Work on a copy sorted desc; keep original data
  const scaled = items
    .map((it) => ({ ...it, value: it.value * scale }))
    .sort((a, b) => b.value - a.value);

  let remaining = { ...rect };
  const done = [];

  let row = [];
  let horizontal = remaining.w >= remaining.h; // lay out along the shorter side
  let shortSide = Math.min(remaining.w, remaining.h);

  const commitRow = () => {
    const newRect = layoutRow(row, remaining, horizontal);
    done.push(...row);
    remaining = newRect;
    row = [];
    horizontal = remaining.w >= remaining.h;
    shortSide = Math.min(remaining.w, remaining.h);
  };

  for (const item of scaled) {
    const test = [...row, item];
    const sumTest = test.reduce((s, x) => s + x.value, 0);
    const sumRow = row.reduce((s, x) => s + x.value, 0);
    if (row.length === 0) {
      row.push(item);
      continue;
    }
    const worstWith = worst(test, shortSide, sumTest);
    const worstWithout = worst(row, shortSide, sumRow);
    if (worstWith <= worstWithout) {
      row.push(item);
    } else {
      commitRow();
      // recompute orientation now that remaining changed
      horizontal = remaining.w >= remaining.h;
      shortSide = Math.min(remaining.w, remaining.h);
      row.push(item);
    }
  }
  if (row.length) commitRow();

  return done;
}
