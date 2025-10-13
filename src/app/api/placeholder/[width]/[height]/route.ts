import { NextRequest, NextResponse } from 'next/server';

// Simple dynamic placeholder image generator using SVG (no external deps)
// Next.js 15 requires awaiting the params when using dynamic API segments
// https://nextjs.org/docs/messages/sync-dynamic-apis
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ width: string; height: string }> }
) {
  const { width, height } = await context.params;
  const w = Math.min(Math.max(parseInt(width, 10) || 100, 1), 1600);
  const h = Math.min(Math.max(parseInt(height, 10) || 100, 1), 1600);
  const text = `${w}x${h}`;
  const fontSize = Math.round(Math.min(w, h) / 5);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#00acee"/>
      <stop offset="100%" stop-color="#3dca00"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" dominant-baseline="central" opacity="0.9">${text}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable'
    }
  });
}
