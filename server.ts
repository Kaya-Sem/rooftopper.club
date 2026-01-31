import { createClient } from "@supabase/supabase-js";
import { type Location, locationTemplate } from "./templates.ts";
import process from "node:process";

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables",
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch location by UUID
async function getLocation(uuid: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", uuid)
    .single();

  if (error) {
    console.error("Error fetching location:", error);
    return null;
  }

  return data;
}

// Content type mapping
const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function getContentType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."));
  return contentTypes[ext] || "application/octet-stream";
}

// Start the server
const server = Bun.serve({
  port: process.env.PORT || 3000,

  async fetch(req: { url: string | URL }) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Location pages: /location/:uuid
    if (pathname.startsWith("/location/")) {
      const uuid = pathname.split("/")[2];

      if (!uuid) {
        return new Response("Not Found", { status: 404 });
      }

      const location = await getLocation(uuid);

      if (!location) {
        return new Response("Not Found", { status: 404 });
      }

      return new Response(locationTemplate(location), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Static files
    const filePath = pathname === "/" ? "/index.html" : pathname;
    const file = Bun.file("." + filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: { "Content-Type": getContentType(filePath) },
      });
    }

    // 404 for unknown routes
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
