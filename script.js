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

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        console.log("User is logged in:", user.email);
    } else {
        console.log("User is not logged in");
    }
}

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

// Example: Add markers from database
async function loadMarkers() {
    const locations = await fetchLocations();

    locations.forEach((location) => {
        L.marker([location.lat, location.lng])
            .addTo(map)
            .bindPopup(location.name || "Unknown location");
    });
}

// Uncomment to load markers when ready:
loadMarkers();
checkUser();
