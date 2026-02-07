import { createClient } from "@supabase/supabase-js";
import {
  type LocationDetail,
  type User,
  type LocationComment,
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

function toUser(row: { id: string; username: string | null } | null): User | null {
  if (row == null) return null;
  return { id: row.id, username: row.username };
}

// Fetch location by UUID with author and comments
async function getLocationWithDetails(uuid: string): Promise<LocationDetail | null> {
  const { data: locationRow, error: locationError } = await supabase
    .from("locations")
    .select("*, author:users(*)")
    .eq("id", uuid)
    .single();

  if (locationError || !locationRow) {
    if (locationError) console.error("Error fetching location:", locationError);
    return null;
  }

  const { data: commentRows, error: commentsError } = await supabase
    .from("location_comments")
    .select("id, created_at, comment, location, users(id, username)")
    .eq("location", uuid)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("Error fetching location comments:", commentsError);
  } else if ((commentRows ?? []).length === 0 && process.env.NODE_ENV !== "production") {
    console.warn("Location comments query returned 0 rows for location", uuid, "- check RLS policies on location_comments if you expect comments.");
  }

  // Supabase returns the referenced table under its table name ("users"); may be object or array
  type CommentRow = {
    id: string;
    created_at: string;
    comment: string | null;
    location: string | null;
    submitter?: { id: string; username: string | null } | null;
    users?: { id: string; username: string | null } | { id: string; username: string | null }[] | null;
  };
  const comments: LocationComment[] = (commentRows ?? []).map((row: CommentRow) => {
    const raw = row.submitter ?? row.users ?? null;
    const submitterUser = Array.isArray(raw) ? raw[0] ?? null : raw;
    return {
      id: row.id,
      created_at: row.created_at,
      comment: row.comment,
      submitter: toUser(submitterUser),
    };
  });

  const author = locationRow.author != null
    ? toUser(Array.isArray(locationRow.author) ? locationRow.author[0] : locationRow.author)
    : null;

  return {
    id: locationRow.id,
    name: locationRow.name,
    coordinate: locationRow.coordinate,
    created_at: locationRow.created_at,
    description: locationRow.description ?? null,
    author,
    comments,
  };
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

      const location = await getLocationWithDetails(uuid);

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
