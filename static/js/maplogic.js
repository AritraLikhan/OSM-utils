let map = L.map('map').setView([33.659541, -118.1552947], 9);
let currentMarker = null;
let routingControl = null;

// Initialize the map layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Function to search for a location
async function searchLocation(searchTerm) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchTerm)}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('Error searching location:', error);
        return null;
    }
}

// Function to update map with marker
function updateMap(location) {
    if (!location) {
        alert("Location not found.");
        return;
    }

    // Remove existing marker if any
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    // Add new marker
    currentMarker = L.marker([lat, lon]).addTo(map);
    
    // Set view to new location
    map.setView([lat, lon], 13);

    // Add popup with location name
    currentMarker.bindPopup(location.display_name).openPopup();
}

// Function to calculate and display route
async function calculateRoute(startLocation, endLocation) {
    try {
        // Remove existing route if any
        if (routingControl) {
            map.removeControl(routingControl);
        }

        // Search for start and end locations
        const startPoint = await searchLocation(startLocation);
        const endPoint = await searchLocation(endLocation);

        if (!startPoint || !endPoint) {
            alert("Couldn't find one or both locations. Please try again.");
            return;
        }

        // Create routing control
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(startPoint.lat, startPoint.lon),
                L.latLng(endPoint.lat, endPoint.lon)
            ],
            routeWhileDragging: true,
            lineOptions: {
                styles: [{ color: '#3737d4', weight: 6 }]
            },
            createMarker: function(i, waypoint, n) {
                const marker = L.marker(waypoint.latLng);
                marker.bindPopup(i === 0 ? "Start" : "Destination");
                return marker;
            }
        }).addTo(map);

        // Remove existing marker if any
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
    } catch (error) {
        console.error('Error calculating route:', error);
        alert('Error calculating route. Please try again.');
    }
}

// Event Listeners
document.getElementById("search-form").addEventListener('submit', async (event) => {
    event.preventDefault();
    const searchTerm = event.target.searchTerm.value;
    const location = await searchLocation(searchTerm);
    updateMap(location);
});

document.getElementById("route-btn").addEventListener('click', () => {
    document.getElementById("directions-container").classList.toggle("hidden");
});

document.getElementById("cancel-route").addEventListener('click', () => {
    document.getElementById("directions-container").classList.add("hidden");
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
});

document.getElementById("directions-form").addEventListener('submit', async (event) => {
    event.preventDefault();
    const startLocation = document.getElementById("start-location").value;
    const endLocation = document.getElementById("end-location").value;
    await calculateRoute(startLocation, endLocation);
});