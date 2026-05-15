type NumberItem = {
  number: number;
  status: 'available' | 'reserved' | 'sold';
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function exportGridAsImage(
  numbers: NumberItem[],
  coverIcon: string,
  fileName = 'grilla.png'
) {
  const COLS = 10;
  const total = numbers.length;
  const CELL = total > 500 ? 28 : total > 200 ? 36 : 44;
  const GAP = total > 500 ? 3 : 4;
  const PAD = 20;
  const SCALE = 2;
  const rows = Math.ceil(total / COLS);

  const W = PAD * 2 + COLS * CELL + (COLS - 1) * GAP;
  const H = PAD * 2 + rows * CELL + (rows - 1) * GAP;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, W, H);

  numbers.forEach(({ number, status }, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CELL + GAP);
    const y = PAD + row * (CELL + GAP);

    ctx.fillStyle =
      status === 'sold' ? '#052e16' :
      status === 'reserved' ? '#1c1200' :
      '#18181b';
    roundRect(ctx, x, y, CELL, CELL, 5);
    ctx.fill();

    ctx.strokeStyle =
      status === 'sold' ? 'rgba(21,128,61,0.6)' :
      status === 'reserved' ? 'rgba(180,83,9,0.6)' :
      '#3f3f46';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, CELL, CELL, 5);
    ctx.stroke();

    const cx = x + CELL / 2;
    const cy = y + CELL / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (status === 'sold') {
      ctx.font = `${Math.floor(CELL * 0.48)}px sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(coverIcon, cx, cy);
    } else {
      ctx.font = `600 ${Math.max(9, Math.floor(CELL * 0.27))}px ui-monospace, monospace`;
      ctx.fillStyle = status === 'reserved' ? '#fbbf24' : '#71717a';
      ctx.fillText(String(number), cx, cy);
    }
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
