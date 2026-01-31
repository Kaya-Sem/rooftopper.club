// Supabase configuration
const SUPABASE_URL = "https://nmgkxaltewyumrtmdort.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Bx1d3NFiA4l36A4UUz7dzA_pxJU2Uou";

// Initialize Supabase client (using CDN global)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize the map
const map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
}).setView([40.7128, -74.0060], 13); // Default to New York City

// Add zoom control to bottom right
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

// Try to get user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 14);
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

// Parse coordinate string "(lat,lng)" to [lat, lng] array
function parseCoordinate(coordStr) {
    const match = coordStr.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
}

// Add markers from database
async function loadMarkers() {
    const locations = await fetchLocations();

    locations.forEach((location) => {
        const coords = parseCoordinate(location.coordinate);
        if (!coords) {
            console.warn("Invalid coordinate for location:", location.id);
            return;
        }

        const popupContent = `
            <div class="location-popup">
                <strong>${location.name || "Unknown location"}</strong>
                <br>
                <a href="/location/${location.id}">View details →</a>
            </div>
        `;

        L.marker(coords)
            .addTo(map)
            .bindPopup(popupContent);
    });
}

// Uncomment to load markers when ready:
loadMarkers();
checkUser();

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
