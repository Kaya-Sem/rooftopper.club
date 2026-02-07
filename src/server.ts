import { createClient } from "@supabase/supabase-js";
import {
  type Location,
  locationTemplate,
  authTemplate,
  userSettingsTemplate,
  addLocationTemplate,
} from "./templates.ts";
import process from "node:process";
import path from "node:path";

// Get project root directory (one level up from src/)
const PROJECT_ROOT = path.resolve(import.meta.dir, "..");

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

    // Auth page: /auth
    if (pathname === "/auth") {
      return new Response(authTemplate(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Add location page: /add-location
    if (pathname === "/add-location") {
      const lat = url.searchParams.get("lat") || "0";
      const lng = url.searchParams.get("lng") || "0";

      return new Response(addLocationTemplate(lat, lng), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // User settings page: /user/:uuid
    if (pathname.startsWith("/user/")) {
      const uuid = pathname.split("/")[2];

      if (!uuid) {
        return new Response("Not Found", { status: 404 });
      }

      // Render settings page - user info is fetched client-side
      return new Response(userSettingsTemplate(uuid), {
        headers: { "Content-Type": "text/html" },
      });
    }

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

    // Serve assets from /assets/
    if (pathname.startsWith("/assets/")) {
      const file = Bun.file(path.join(PROJECT_ROOT, pathname));
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": getContentType(pathname) },
        });
      }
      return new Response("Not Found", { status: 404 });
    }

    // Serve public files (html, css, js)
    const filePath = pathname === "/" ? "/index.html" : pathname;
    const file = Bun.file(path.join(PROJECT_ROOT, "public", filePath));

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
