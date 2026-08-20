// HTML escape helper to prevent XSS
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Base HTML template wrapper
export function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${escapeHtml(title)} - rooftopper.club</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  ${content}
</body>
</html>`;
}

// Location page template
export interface User {
  id: string;
  username: string | null;
}

export interface LocationComment {
  id: string;
  created_at: string;
  comment: string | null;
  submitter: User | null;
}

export interface Location {
  id: string;
  name: string;
  coordinate: string;
  created_at: string;
  description?: string | null;
}

export interface LocationImage {
  id: string;
  storage_path: string;
  created_at: string;
}

export interface LocationDetail extends Location {
  author?: User | null;
  comments?: LocationComment[];
  images?: LocationImage[];
}

export interface UserProfileLocation {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  locations: UserProfileLocation[];
}

/** Base URL for the images bucket public URLs (e.g. https://xxx.supabase.co/storage/v1/object/public/images). */
export function locationTemplate(
  location: LocationDetail,
  storagePublicBaseUrl?: string,
): string {
  const description = location.description?.trim() ?? "";
  const authorLine =
    location.author != null
      ? `<div class="info-row">
        <span class="info-label">Added by</span>
        <span class="info-value"><a href="/user/${escapeHtml(location.author.id)}">${escapeHtml(location.author.username ?? "Unknown user")}</a></span>
      </div>`
      : "";

  const comments = location.comments ?? [];
  const commentsHtml =
    comments.length === 0
      ? "<p class=\"comments-empty\">No comments yet.</p>"
      : comments
          .map(
            (c) => {
              const submitterLabel =
                c.submitter != null
                  ? escapeHtml(c.submitter.username ?? "Unknown user")
                  : "Anonymous";
              const submitterLink =
                c.submitter != null
                  ? `<a href="/user/${escapeHtml(c.submitter.id)}">${submitterLabel}</a>`
                  : submitterLabel;
              const dateStr = new Date(c.created_at).toLocaleDateString();
              const body = escapeHtml(c.comment ?? "");
              return `<div class="comment-block">
                <div class="comment-meta">${submitterLink} · ${dateStr}</div>
                <div class="comment-body">${body}</div>
              </div>`;
            }
          )
          .join("\n");

  const images = location.images ?? [];
  const imagesHtml =
    storagePublicBaseUrl && images.length > 0
      ? images
          .map(
            (img, i) => {
              const url = storagePublicBaseUrl + "/" + img.storage_path;
              const alt = `Photo ${i + 1} for ${escapeHtml(location.name)}`;
              return `<a href="${escapeHtml(url)}" class="location-photo-link" target="_blank" rel="noopener"><img src="${escapeHtml(url)}" alt="${alt}" class="location-photo-img" loading="lazy" /></a>`;
            },
          )
          .join("\n")
      : "";
  const photosSectionHtml =
    images.length === 0
      ? "<p class=\"location-photos-empty\">No photos yet.</p>"
      : `<div class="location-photos-grid">${imagesHtml}</div>`;

  const content = `
  <main class="page-content page-content--left">
    <h1>${escapeHtml(location.name)}</h1>
    <div class="user-info">
      <div class="info-row">
        <span class="info-label">Coordinates</span>
        <span class="info-value">${escapeHtml(location.coordinate)}</span>
      </div>
      ${description ? `<div class="info-row">
        <span class="info-label">Description</span>
        <span class="info-value">${escapeHtml(description)}</span>
      </div>` : ""}
      <div class="info-row">
        <span class="info-label">Date added</span>
        <span class="info-value">${new Date(location.created_at).toLocaleDateString()}</span>
      </div>
      ${authorLine}
    </div>
    <section class="location-photos-section" data-location-id="${escapeHtml(location.id)}">
      <h2 class="location-photos-title">Photos</h2>
      <div class="location-photos-list">${photosSectionHtml}</div>
      <div id="location-image-upload" class="location-image-upload" style="display: none;">
        <form id="locationImageForm">
          <div class="form-group">
            <label for="locationImageInput">Add photos</label>
            <input type="file" id="locationImageInput" name="images" accept="image/jpeg,image/png,image/webp" multiple />
          </div>
          <button type="submit" class="btn">Upload</button>
        </form>
        <div id="locationImageError" class="error-message" style="display: none;"></div>
      </div>
    </section>
    <section class="comments-section" data-location-id="${escapeHtml(location.id)}">
      <h2 class="comments-title">Comments</h2>
      <div class="comments-list">${commentsHtml}</div>
      <div id="comment-form-container" class="comment-form-container" style="display: none;">
        <form id="commentForm">
          <div class="form-group">
            <label for="commentBody">Add a comment</label>
            <textarea id="commentBody" name="comment" rows="3" placeholder="Write a comment..." required></textarea>
          </div>
          <button type="submit" class="btn">Post comment</button>
        </form>
        <div id="commentFormError" class="error-message" style="display: none;"></div>
      </div>
    </section>
    <a href="/" onclick="event.preventDefault(); history.back();">← Back</a>
  </main>
  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script src="/script.js"></script>`;

  return baseTemplate(location.name, content);
}

// Auth page template (login/register)
export function authTemplate(): string {
  const content = `
  <main class="page-content">
    <h1 id="authTitle">Login</h1>
    
    <div id="errorMessage" class="error-message" style="display: none;"></div>
    <div id="successMessage" class="success-message" style="display: none;"></div>
    
    <form id="authForm" style="width: 100%;">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com" />
      </div>
      
      <div class="form-group" id="usernameGroup" style="display: none;">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="username" />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="password" />
      </div>
      
      <div class="form-group" id="confirmPasswordGroup" style="display: none;">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="confirm password" />
      </div>
      
      <button type="submit" class="btn" id="submitBtn">Login</button>
    </form>
    
    <p class="toggle-text">
      <span id="toggleText">No account?</span>
      <a href="#" id="toggleLink">Sign up</a>
    </p>
    
    <a href="/" onclick="event.preventDefault(); history.back();">← Back</a>
  </main>

  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script>
    const SUPABASE_URL = "https://nmgkxaltewyumrtmdort.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_Bx1d3NFiA4l36A4UUz7dzA_pxJU2Uou";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let isLoginMode = true;
    
    const authTitle = document.getElementById("authTitle");
    const authForm = document.getElementById("authForm");
    const submitBtn = document.getElementById("submitBtn");
    const toggleText = document.getElementById("toggleText");
    const toggleLink = document.getElementById("toggleLink");
    const usernameGroup = document.getElementById("usernameGroup");
    const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
    const usernameInput = document.getElementById("username");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");
    
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
      successMessage.style.display = "none";
    }
    
    function showSuccess(message) {
      successMessage.textContent = message;
      successMessage.style.display = "block";
      errorMessage.style.display = "none";
    }
    
    function hideMessages() {
      errorMessage.style.display = "none";
      successMessage.style.display = "none";
    }
    
    function toggleMode() {
      isLoginMode = !isLoginMode;
      hideMessages();
      
      if (isLoginMode) {
        authTitle.textContent = "Login";
        submitBtn.textContent = "Login";
        toggleText.textContent = "No account?";
        toggleLink.textContent = "Sign up";
        usernameGroup.style.display = "none";
        confirmPasswordGroup.style.display = "none";
        usernameInput.removeAttribute("required");
        confirmPasswordInput.removeAttribute("required");
      } else {
        authTitle.textContent = "Sign Up";
        submitBtn.textContent = "Sign Up";
        toggleText.textContent = "Have an account?";
        toggleLink.textContent = "Login";
        usernameGroup.style.display = "block";
        confirmPasswordGroup.style.display = "block";
        usernameInput.setAttribute("required", "");
        confirmPasswordInput.setAttribute("required", "");
      }
    }
    
    toggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMode();
    });
    
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMessages();
      
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      
      submitBtn.disabled = true;
      submitBtn.textContent = isLoginMode ? "Logging in..." : "Signing up...";
      
      try {
        if (isLoginMode) {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          window.location.href = "/";
        } else {
          const username = document.getElementById("username").value;
          const confirmPassword = document.getElementById("confirmPassword").value;
          
          if (password !== confirmPassword) {
            throw new Error("Passwords do not match");
          }
          
          if (!username.trim()) {
            throw new Error("Username is required");
          }
          
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
              },
            },
          });
          
          if (error) throw error;
          
          showSuccess("Check your email for the confirmation link!");
          authForm.reset();
        }
      } catch (error) {
        showError(error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
      }
    });
  </script>`;

  return baseTemplate("Login", content);
}

// User profile page template (public profile + owner-only settings)
export function userProfileTemplate(profile: UserProfile): string {
  const displayName = profile.username ?? "Unknown user";

  const locations = profile.locations;
  const locationsHtml =
    locations.length === 0
      ? "<p class=\"location-photos-empty\">No locations added yet.</p>"
      : `<div class="user-locations-grid">${locations
          .map(
            (loc) =>
              `<a href="/location/${escapeHtml(loc.id)}" class="user-location-card">
                <div class="user-location-name">${escapeHtml(loc.name)}</div>
                <div class="user-location-type">${escapeHtml(loc.type)}</div>
              </a>`,
          )
          .join("\n")}</div>`;

  const content = `
  <main class="page-content page-content--left">
    <div class="profile-header">
      <img src="/assets/user.svg" alt="" class="avatar" />
      <h1>${escapeHtml(displayName)}</h1>
    </div>

    <section class="user-locations-section">
      <h2 class="location-photos-title">Locations added</h2>
      ${locationsHtml}
    </section>

    <section id="ownerSettings" class="user-info" style="display: none; margin-top: 24px;">
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value" id="emailValue">...</span>
      </div>
      <button id="logoutBtn" class="btn btn-danger" style="margin-top: 12px;">Logout</button>
    </section>

    <a href="/" style="margin-top: 16px;" onclick="event.preventDefault(); history.back();">← Back</a>
  </main>

  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script>
    const SUPABASE_URL = "https://nmgkxaltewyumrtmdort.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_Bx1d3NFiA4l36A4UUz7dzA_pxJU2Uou";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const profileUserId = "${escapeHtml(profile.id)}";

    const ownerSettings = document.getElementById("ownerSettings");
    const emailValue = document.getElementById("emailValue");
    const logoutBtn = document.getElementById("logoutBtn");

    async function loadOwnerSettings() {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user || user.id !== profileUserId) return;

      emailValue.textContent = user.email || "No email";
      ownerSettings.style.display = "block";
    }

    loadOwnerSettings();

    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Logging out...";

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";
      } else {
        window.location.href = "/";
      }
    });
  </script>`;

  return baseTemplate(displayName, content);
}

// Location types (must match script.js / DB enum)
const LOCATION_TYPES = [
  "highrise",
  "midrise",
  "crane",
  "smokestack",
  "antenna",
  "construction",
  "industrial",
  "bridge",
  "tower",
  "unspecified",
];

// Add location page template
export function addLocationTemplate(lat: string, lng: string): string {
  const typeOptions = LOCATION_TYPES.map(
    (t) =>
      `<option value="${escapeHtml(t)}"${t === "unspecified" ? " selected" : ""}>${escapeHtml(t)}</option>`
  ).join("\n      ");
  const content = `
  <main class="page-content page-content--left">
    <h1>Add Location</h1>
    
    <div id="errorMessage" class="error-message" style="display: none;"></div>
    
    <div class="user-info">
      <div class="info-row">
        <span class="info-label">Coordinates</span>
        <span class="info-value">${escapeHtml(lat)}, ${escapeHtml(lng)}</span>
      </div>
    </div>
    
    <form id="addLocationForm" style="width: 100%;">
      <input type="hidden" id="latitude" value="${escapeHtml(lat)}" />
      <input type="hidden" id="longitude" value="${escapeHtml(lng)}" />
      
      <div class="form-group">
        <label for="name">Name *</label>
        <input type="text" id="name" name="name" required placeholder="Location name" />
      </div>
      
      <div class="form-group">
        <label for="type">Type</label>
        <select id="type" name="type">
      ${typeOptions}
        </select>
      </div>
      
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" placeholder="Optional description" rows="3"></textarea>
      </div>
      
      <button type="submit" class="btn" id="submitBtn">Save Location</button>
    </form>
    
    <a href="/" style="margin-top: 16px;" onclick="event.preventDefault(); history.back();">← Cancel</a>
  </main>

  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script>
    const SUPABASE_URL = "https://nmgkxaltewyumrtmdort.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_Bx1d3NFiA4l36A4UUz7dzA_pxJU2Uou";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const addLocationForm = document.getElementById("addLocationForm");
    const submitBtn = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("errorMessage");
    
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
    }
    
    function hideError() {
      errorMessage.style.display = "none";
    }
    
    // Check if user is logged in
    async function checkAuth() {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
      }
    }
    
    checkAuth();
    
    addLocationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();
      
      const name = document.getElementById("name").value.trim();
      const type = document.getElementById("type").value;
      const description = document.getElementById("description").value.trim();
      const lat = document.getElementById("latitude").value;
      const lng = document.getElementById("longitude").value;
      
      if (!name) {
        showError("Name is required");
        return;
      }

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        showError("You must be logged in to add a location");
        window.location.href = "/auth";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        // Format coordinate as PostgreSQL point: (lat,lng)
        const coordinate = "(" + lat + "," + lng + ")";

        const { data, error } = await supabaseClient
          .from("locations")
          .insert({
            name: name,
            type: type,
            description: description || null,
            coordinate: coordinate,
            author: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Redirect to home page on success
        window.location.href = "/";
      } catch (error) {
        showError(error.message || "Failed to save location");
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Location";
      }
    });
  </script>`;

  return baseTemplate("Add Location", content);
}
