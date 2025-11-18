export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response('Deprecated endpoint', { status: 410 });
}
