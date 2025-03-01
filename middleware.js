export const config = {
  matcher: ['/'],
};

export default async function middleware(req, _context) {
  if (
    req?.headers?.get('X-Vercel-IP-Country') === 'US' &&
    req?.headers?.get('X-Vercel-IP-Country-Region') === 'NY'
  ) {
    // eslint-disable-next-line no-console
    console.log({
      country: req?.headers?.get('X-Vercel-IP-Country'),
      region: req?.headers?.get('X-Vercel-IP-Country-Region'),
      city: req?.headers?.get('X-Vercel-IP-City'),
    });
    // Turn off blocking for now
    // return new Response('Not available', { status: 451 });
  }
}
