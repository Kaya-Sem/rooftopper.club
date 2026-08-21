// Supabase configuration
const SUPABASE_URL = "https://nmgkxaltewyumrtmdort.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Bx1d3NFiA4l36A4UUz7dzA_pxJU2Uou";

// Initialize Supabase client (using CDN global)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
}

// Parse coordinate string "(lat,lng)" to [lat, lng] array
function parseCoordinate(coordStr) {
    const match = coordStr && coordStr.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
}

// Location types (public enum); unknown DB values normalize to "unspecified"
const LOCATION_TYPES = [
    "highrise", "midrise", "crane", "smokestack", "antenna",
    "construction", "industrial", "bridge", "tower", "unspecified",
];

// Client-side Location model: typed fields + parsed coordinates
class Location {
    constructor({ id, name, coordinate, created_at, description, type, latLng, confidence_score, last_event_at, confirm_count, negative_count }) {
        this.id = id;
        this.name = name;
        this.coordinate = coordinate;
        this.created_at = created_at;
        this.description = description ?? null;
        this.type = type;
        this.latLng = latLng;
        this.confidence_score = confidence_score;
        this.last_event_at = last_event_at;
        this.confirm_count = confirm_count;
        this.negative_count = negative_count;
    }

    static fromSupabase(row) {
        const latLng = parseCoordinate(row.coordinate);
        const type = LOCATION_TYPES.includes(row.type) ? row.type : "unspecified";
        return new Location({
            id: row.id,
            name: row.name,
            coordinate: row.coordinate,
            created_at: row.created_at,
            description: row.description ?? null,
            type,
            latLng,
            confidence_score: row.confidence_score,
            last_event_at: row.last_event_at,
            confirm_count: row.confirm_count,
            negative_count: row.negative_count,
        });
    }
}

const LOCATION_TYPE_MARKERS = {
    highrise: "🏢",
    midrise: "🏬",
    crane: "🏗️",
    smokestack: "🏭",
    antenna: "📡",
    construction: "🚧",
    industrial: "🏭",
    bridge: "🌉",
    tower: "🗼",
    unspecified: "📍",
};

function getMarkerEmoji(location) {
    const type = location && location.type;
    return LOCATION_TYPE_MARKERS[type] ?? LOCATION_TYPE_MARKERS.unspecified;
}

// Parse lat, lng, z from URL; return { lat, lng, z } if valid, else null
function getMapViewFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get("lat"));
    const lng = parseFloat(params.get("lng"));
    const z = parseInt(params.get("z"), 10);
    if (
        Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
        Number.isFinite(lng) && lng >= -180 && lng <= 180 &&
        Number.isFinite(z) && z >= 0 && z <= 20
    ) {
        return { lat, lng, z };
    }
    return null;
}

// Update URL to reflect current map center and zoom (no new history entry)
function updateUrlFromMap() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const params = new URLSearchParams();
    params.set("lat", center.lat.toFixed(5));
    params.set("lng", center.lng.toFixed(5));
    params.set("z", String(zoom));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl);
}

// Initialize the map (only on main page; location detail page has no #map and does not load Leaflet)
let map;
if (document.getElementById("map")) {
map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
}).setView([51.0543, 3.7174], 9);

const RecenterControl = L.Control.extend({
    options: { position: "bottomright" },
    onAdd: function () {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-recenter");
        const link = L.DomUtil.create("a", "leaflet-control-recenter-btn", container);
        link.href = "#";
        link.title = "Recenter to my location";
        link.setAttribute("role", "button");
        link.setAttribute("aria-label", "Recenter to my location");
        link.innerHTML = '<img src="/assets/locate-fixed.svg" alt="" width="18" height="18" />';
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(link, "click", L.DomEvent.stop).on(link, "click", recenterOnUserLocation);
        return container;
    },
});
new RecenterControl().addTo(map);

L.control.zoom({
    position: "bottomright",
}).addTo(map);

// Dark tile layer (CartoDB Dark Matter)
const darkTiles = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
        subdomains: "abcd",
        maxZoom: 20,
    },
);

darkTiles.addTo(map);

// Apply URL view if valid; otherwise keep default (NYC)
const urlView = getMapViewFromUrl();
const hasUrlMapPosition = urlView !== null;
if (urlView) {
    map.setView([urlView.lat, urlView.lng], urlView.z);
}

// Keep URL in sync with map view on pan/zoom
map.on("moveend", updateUrlFromMap);
updateUrlFromMap();

let userLocationMarker = null;

function updateUserLocationMarker(lat, lng) {
    const latlng = [lat, lng];
    if (!userLocationMarker) {
        const icon = L.divIcon({
            className: "user-location-marker",
            html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        });
        userLocationMarker = L.marker(latlng, {
            icon,
            zIndexOffset: 1000,
            interactive: false,
            keyboard: false,
        }).addTo(map);
    } else {
        userLocationMarker.setLatLng(latlng);
    }
}

function recenterOnUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            updateUserLocationMarker(latitude, longitude);
            map.setView([latitude, longitude], map.getZoom());
            updateUrlFromMap();
        },
        (error) => {
            console.log("Geolocation error:", error.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        },
    );
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            updateUserLocationMarker(latitude, longitude);
            if (!hasUrlMapPosition) {
                map.setView([latitude, longitude], 14);
                updateUrlFromMap();
            }
        },
        (error) => {
            console.log("Geolocation error:", error.message);
            // Keep default location if geolocation fails
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
        },
    );
}

// Profile button elements
const profileIcon = document.getElementById("profileIcon");
const profileBtn = document.getElementById("profileBtn");

// Add location button elements
const addLocationBtn = document.getElementById("addLocationBtn");
const mapContainer = document.getElementById("map");

// Selection mode state
let isSelectingLocation = false;

// Update profile button based on auth state
function updateProfileButton(user) {
    if (user) {
        profileIcon.src = "/assets/user.svg";
        profileIcon.alt = "Settings";
    } else {
        profileIcon.src = "/assets/log-in.svg";
        profileIcon.alt = "Login";
    }
}

// Profile button click handler
profileBtn.addEventListener("click", async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        window.location.href = `/user/${user.id}`;
    } else {
        window.location.href = "/auth";
    }
});

// Toggle selection mode
function setSelectionMode(enabled) {
    isSelectingLocation = enabled;
    if (enabled) {
        mapContainer.classList.add("map-selecting");
        addLocationBtn.classList.add("active");
        showSelectionHint();
    } else {
        mapContainer.classList.remove("map-selecting");
        addLocationBtn.classList.remove("active");
        hideSelectionHint();
    }
}

// Selection hint element
let selectionHint = null;

function showSelectionHint() {
    if (!selectionHint) {
        selectionHint = document.createElement("div");
        selectionHint.className = "selection-hint";
        selectionHint.textContent = "Click on the map to select a location";
        document.body.appendChild(selectionHint);
    }
    selectionHint.classList.add("visible");
}

function hideSelectionHint() {
    if (selectionHint) {
        selectionHint.classList.remove("visible");
    }
}

// Add location button click handler
addLocationBtn.addEventListener("click", async () => {
    // Check if user is logged in
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        // Redirect to auth page if not logged in
        window.location.href = "/auth";
        return;
    }
    
    // Toggle selection mode
    setSelectionMode(!isSelectingLocation);
});

// Map click handler for location selection
map.on("click", (e) => {
    if (!isSelectingLocation) return;
    
    const { lat, lng } = e.latlng;
    
    // Disable selection mode
    setSelectionMode(false);
    
    // Navigate to add location page with coordinates
    window.location.href = `/add-location?lat=${lat}&lng=${lng}`;
});

// Cancel selection mode with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isSelectingLocation) {
        setSelectionMode(false);
    }
});

// Check current user and update UI
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    updateProfileButton(user);

    if (user) {
        console.debug("User is logged in:", user.email);
    } else {
        console.debug("User is not logged in");
    }
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateProfileButton(session?.user || null);
});

async function fetchLocations() {
    const { data, error } = await supabaseClient
        .from("locations")
        .select("*");

    if (error) {
        console.error("Error fetching locations:", error);
        return [];
    }

    console.info(data);
    return data;
}

// Add markers from database
async function loadMarkers() {
    const rows = await fetchLocations();

    rows.forEach((row) => {
        const location = Location.fromSupabase(row);
        if (!location.latLng) {
            console.warn("Invalid coordinate for location:", location.id);
            return;
        }

        const emoji = getMarkerEmoji(location);
        const title = location.name.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const icon = L.divIcon({
            html: `<span class="location-marker-emoji" title="${title}">${emoji}</span>`,
            className: "location-emoji-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });

        const score = liveConfidence(location.confidence_score, location.last_event_at);
        const opacity = CONFIDENCE_BUCKET_OPACITY[confidenceBucket(score)];

        L.marker(location.latLng, { icon, opacity })
            .addTo(map)
            .on("click", () => {
                window.location.href = `/location/${location.id}`;
            });
    });
}

// Uncomment to load markers when ready:
loadMarkers();
checkUser();
}
// Location detail page: comment form for logged-in users
if (document.getElementById("comment-form-container")) {
    initLocationCommentForm();
}

// Location detail page: photo upload for logged-in users
if (document.getElementById("location-image-upload")) {
    initLocationImageUpload();
}

async function initLocationImageUpload() {
    const uploadBlock = document.getElementById("location-image-upload");
    const section = document.querySelector(".location-photos-section[data-location-id]");
    const locationId = section ? section.getAttribute("data-location-id") : null;
    const fileInput = document.getElementById("locationImageInput");
    if (!locationId || !uploadBlock || !fileInput) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        uploadBlock.style.display = "none";
        return;
    }

    uploadBlock.style.display = "flex";
    const emptyEl = document.getElementById("locationPhotosEmpty");
    if (emptyEl) emptyEl.style.display = "none";

    const errorEl = document.getElementById("locationImageError");
    const MAX_SIZE_BYTES = 6 * 1024 * 1024; // 6MB
    const ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = "block";
        }
    }

    function hideError() {
        if (errorEl) errorEl.style.display = "none";
    }

    fileInput.addEventListener("change", async () => {
        hideError();
        const files = fileInput.files ? Array.from(fileInput.files) : [];
        if (files.length === 0) return;

        uploadBlock.classList.add("is-uploading");
        fileInput.disabled = true;

        try {
            for (const file of files) {
                const ext = ALLOWED_TYPES[file.type];
                if (!ext) {
                    showError("Invalid file type. Use JPEG, PNG, or WebP.");
                    break;
                }
                if (file.size > MAX_SIZE_BYTES) {
                    showError("Each file must be under 6MB.");
                    break;
                }
                const path = `locations/${locationId}/${crypto.randomUUID()}.${ext}`;
                const { error: uploadError } = await supabaseClient.storage
                    .from("images")
                    .upload(path, file, { contentType: file.type, upsert: false });
                if (uploadError) {
                    showError(uploadError.message || "Upload failed.");
                    break;
                }
                const { error: insertError } = await supabaseClient
                    .from("location_images")
                    .insert({ location: locationId, storage_path: path, uploaded_by: user.id });
                if (insertError) {
                    showError(insertError.message || "Failed to save image.");
                    break;
                }
            }
            const hadError = errorEl && errorEl.style.display === "block";
            if (!hadError) {
                window.location.reload();
            }
        } finally {
            uploadBlock.classList.remove("is-uploading");
            fileInput.disabled = false;
            fileInput.value = "";
        }
    });
}

async function initLocationCommentForm() {
    const container = document.getElementById("comment-form-container");
    const form = document.getElementById("commentForm");
    const section = document.querySelector(".comments-section[data-location-id]");
    const locationId = section ? section.getAttribute("data-location-id") : null;
    if (!locationId || !form) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    const errorEl = document.getElementById("commentFormError");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const textarea = form.querySelector("#commentBody");
        const text = (textarea && textarea.value || "").trim();
        if (!text) {
            if (errorEl) {
                errorEl.textContent = "Please enter a comment.";
                errorEl.style.display = "block";
            }
            return;
        }
        if (errorEl) errorEl.style.display = "none";

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Posting...";
        }

        const { error } = await supabaseClient
            .from("location_comments")
            .insert({ location: locationId, comment: text, submitter: user.id });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Post comment";
        }

        if (error) {
            if (errorEl) {
                errorEl.textContent = error.message || "Failed to post comment.";
                errorEl.style.display = "block";
            }
            return;
        }
        window.location.reload();
    });
}

// Auth functions (to be called from UI)
async function signup(email, password, username) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
            },
        },
    });
    return { data, error };
}

async function login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
}
