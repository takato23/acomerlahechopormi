import { createRequire as VPV_createRequire } from "node:module";
import { fileURLToPath as VPV_fileURLToPath } from "node:url";
import { dirname as VPV_dirname } from "node:path";
const require = VPV_createRequire(import.meta.url);
const __filename = VPV_fileURLToPath(import.meta.url);
const __dirname = VPV_dirname(__filename);


// api/vision-intake.ts
var resolveSupabaseFunctionUrl = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not configured");
  }
  const base = new URL(supabaseUrl);
  base.pathname = "/functions/v1/vision-intake";
  base.search = "";
  return base.toString();
};
var forwardRequest = async (req, targetBase) => {
  const originalUrl = new URL(req.url);
  const targetUrl = new URL(targetBase);
  targetUrl.search = originalUrl.search;
  const headers = new Headers(req.headers);
  headers.set("x-forwarded-host", originalUrl.host);
  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? void 0 : req.body,
    redirect: "manual"
  });
  return response;
};
var vision_intake_default = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": req.headers.get("origin") ?? "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": req.headers.get("access-control-request-headers") ?? "*"
      }
    });
  }
  try {
    const target = resolveSupabaseFunctionUrl();
    const proxied = await forwardRequest(req, target);
    const headers = new Headers(proxied.headers);
    headers.set("Access-Control-Allow-Origin", req.headers.get("origin") ?? "*");
    headers.set("Access-Control-Expose-Headers", headers.get("Access-Control-Expose-Headers") ?? "*");
    return new Response(proxied.body, {
      status: proxied.status,
      headers
    });
  } catch (error) {
    console.error("[api/vision-intake] Proxy error", error);
    return new Response(JSON.stringify({ error: "Vision proxy error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.get("origin") ?? "*"
      }
    });
  }
};
export {
  vision_intake_default as default
};
