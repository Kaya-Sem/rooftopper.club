// Initialize the map
const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([40.7128, -74.0060], 13); // Default to New York City

// Add zoom control to bottom right
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Dark tile layer (CartoDB Dark Matter)
const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20
});

darkTiles.addTo(map);

// Try to get user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 14);
        },
        (error) => {
            console.log('Geolocation error:', error.message);
            // Keep default location if geolocation fails
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

