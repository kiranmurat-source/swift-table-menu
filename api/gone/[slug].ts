export const config = {
  runtime: 'edge',
};

export function GET() {
  return new Response('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
