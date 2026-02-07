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

export interface LocationDetail extends Location {
  author?: User | null;
  comments?: LocationComment[];
}

export function locationTemplate(location: LocationDetail): string {
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
    <section class="comments-section">
      <h2 class="comments-title">Comments</h2>
      <div class="comments-list">${commentsHtml}</div>
    </section>
    <a href="#" id="locationBackLink">← Back</a>
  </main>
  <script>
    document.getElementById("locationBackLink").addEventListener("click", function (e) {
      e.preventDefault();
      history.back();
    });
  </script>`;

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
    
    <a href="/">← Back</a>
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

// User settings page template
export function userSettingsTemplate(userId: string): string {
  const content = `
  <main class="page-content">
    <h1>Settings</h1>
    
    <div class="user-info">
      <div class="info-row">
        <span class="info-label">Username</span>
        <span class="info-value" id="usernameValue">...</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value" id="emailValue">...</span>
      </div>
    </div>
    
    <button id="logoutBtn" class="btn btn-danger">Logout</button>
    
    <a href="/" style="margin-top: 16px;">← Back</a>
  </main>
  
  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script>
    const SUPABASE_URL = "https://nmgkxaltewyumrtmdort.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_Bx1d3NFiA4l36A4UUz7dzA_pxJU2Uou";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const expectedUserId = "${escapeHtml(userId)}";
    
    const usernameValue = document.getElementById("usernameValue");
    const emailValue = document.getElementById("emailValue");
    const logoutBtn = document.getElementById("logoutBtn");
    
    // Fetch and display user info
    async function loadUserInfo() {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      
      if (error || !user) {
        // Not logged in, redirect to auth
        window.location.href = "/auth";
        return;
      }
      
      // Verify user is viewing their own settings
      if (user.id !== expectedUserId) {
        window.location.href = "/user/" + user.id;
        return;
      }
      
      usernameValue.textContent = user.user_metadata?.username || "No username set";
      emailValue.textContent = user.email || "No email";
    }
    
    loadUserInfo();
    
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

  return baseTemplate("Settings", content);
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
    
    <a href="/" style="margin-top: 16px;">← Cancel</a>
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
            coordinate: coordinate
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
