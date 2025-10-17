const resolveSupabaseFunctionUrl = (): string => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL');
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  const base = new URL(supabaseUrl);
  base.pathname = '/functions/v1/vision-intake';
  base.search = '';
  return base.toString();
};

const forwardRequest = async (req: Request, targetBase: string) => {
  const originalUrl = new URL(req.url);
  const targetUrl = new URL(targetBase);
  targetUrl.search = originalUrl.search;

  const headers = new Headers(req.headers);
  headers.set('x-forwarded-host', originalUrl.host);

  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    redirect: 'manual',
  });

  return response;
};

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': req.headers.get('access-control-request-headers') ?? '*',
      },
    });
  }

  try {
    const target = resolveSupabaseFunctionUrl();
    const proxied = await forwardRequest(req, target);
    const headers = new Headers(proxied.headers);
    headers.set('Access-Control-Allow-Origin', req.headers.get('origin') ?? '*');
    headers.set('Access-Control-Expose-Headers', headers.get('Access-Control-Expose-Headers') ?? '*');
    return new Response(proxied.body, {
      status: proxied.status,
      headers,
    });
  } catch (error) {
    console.error('[api/vision-intake] Proxy error', error);
    return new Response(JSON.stringify({ error: 'Vision proxy error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
      },
    });
  }
};
