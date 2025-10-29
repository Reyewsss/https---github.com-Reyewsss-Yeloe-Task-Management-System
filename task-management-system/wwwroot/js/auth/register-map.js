let map;
let marker;
let selectedLat = null;
let selectedLng = null;
let searchTimeout = null;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeAddressSearch();
});

function initializeMap() {
    // Default to Manila, Philippines coordinates
    const defaultLat = 14.5995;
    const defaultLng = 120.9842;

    // Initialize the map
    map = L.map('map').setView([defaultLat, defaultLng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                map.setView([userLat, userLng], 16);
                
                // Set initial marker at user's location
                selectedLat = userLat;
                selectedLng = userLng;
                
                if (marker) {
                    marker.setLatLng([userLat, userLng]);
                } else {
                    marker = L.marker([userLat, userLng], {
                        draggable: true
                    }).addTo(map);
                    
                    marker.on('dragend', function(e) {
                        const pos = marker.getLatLng();
                        selectedLat = pos.lat;
                        selectedLng = pos.lng;
                        document.getElementById('latitude').value = selectedLat;
                        document.getElementById('longitude').value = selectedLng;
                        updateAddressFromCoordinates();
                    });
                }
                
                document.getElementById('latitude').value = userLat;
                document.getElementById('longitude').value = userLng;
                updateAddressFromCoordinates();
            },
            (error) => {
                console.log('Geolocation error:', error);
            }
        );
    }

    // Add click event to map
    map.on('click', function(e) {
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;

        // Remove existing marker if any
        if (marker) {
            map.removeLayer(marker);
        }

        // Add new marker at clicked location
        marker = L.marker([selectedLat, selectedLng], {
            draggable: true
        }).addTo(map);
        
        // Update coordinates when marker is dragged
        marker.on('dragend', function(e) {
            const pos = marker.getLatLng();
            selectedLat = pos.lat;
            selectedLng = pos.lng;
            document.getElementById('latitude').value = selectedLat;
            document.getElementById('longitude').value = selectedLng;
            updateAddressFromCoordinates();
        });

        document.getElementById('latitude').value = selectedLat;
        document.getElementById('longitude').value = selectedLng;
        
        // Automatically get address
        updateAddressFromCoordinates();
    });
    
    // Listen for zipcode input changes
    document.getElementById('zipCodeInput').addEventListener('input', function() {
        if (selectedLat && selectedLng) {
            updateAddressFromZipCode();
        }
    });
}

function initializeAddressSearch() {
    const addressInput = document.getElementById('addressSearchInput');
    const suggestionsDiv = document.getElementById('addressSuggestions');

    // Handle address input
    addressInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();

        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Clear suggestions if query is too short
        if (query.length < 3) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }

        // Debounce the search
        searchTimeout = setTimeout(() => {
            searchAddress(query);
        }, 500);
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!addressInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

async function searchAddress(query) {
    const suggestionsDiv = document.getElementById('addressSuggestions');

    try {
        // Show loading state
        suggestionsDiv.innerHTML = '<div class="suggestion-item loading">Searching...</div>';
        suggestionsDiv.style.display = 'block';

        // Use Nominatim search API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const results = await response.json();

        if (results.length === 0) {
            suggestionsDiv.innerHTML = '<div class="suggestion-item no-results">No addresses found</div>';
            return;
        }

        // Display suggestions
        suggestionsDiv.innerHTML = results.map(result => {
            return `<div class="suggestion-item" data-lat="${result.lat}" data-lon="${result.lon}" data-display="${result.display_name}">
                <i class="fas fa-map-marker-alt"></i>
                <span>${result.display_name}</span>
            </div>`;
        }).join('');

        // Add click handlers to suggestions
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
            if (!item.classList.contains('loading') && !item.classList.contains('no-results')) {
                item.addEventListener('click', function() {
                    const lat = parseFloat(this.dataset.lat);
                    const lon = parseFloat(this.dataset.lon);
                    const displayName = this.dataset.display;

                    // Update address field
                    document.getElementById('addressSearchInput').value = displayName;
                    document.getElementById('Address').value = displayName;

                    // Update coordinates
                    selectedLat = lat;
                    selectedLng = lon;
                    document.getElementById('latitude').value = lat;
                    document.getElementById('longitude').value = lon;

                    // Update map
                    map.setView([lat, lon], 16);

                    // Remove existing marker if any
                    if (marker) {
                        map.removeLayer(marker);
                    }

                    // Add new marker
                    marker = L.marker([lat, lon], {
                        draggable: true
                    }).addTo(map);

                    marker.on('dragend', function(e) {
                        const pos = marker.getLatLng();
                        selectedLat = pos.lat;
                        selectedLng = pos.lng;
                        document.getElementById('latitude').value = selectedLat;
                        document.getElementById('longitude').value = selectedLng;
                        updateAddressFromCoordinates();
                    });

                    // Hide suggestions
                    suggestionsDiv.style.display = 'none';
                });
            }
        });

    } catch (error) {
        console.error('Error searching address:', error);
        suggestionsDiv.innerHTML = '<div class="suggestion-item error">Error searching address</div>';
    }
}

async function updateAddressFromCoordinates() {
    const lat = selectedLat;
    const lng = selectedLng;

    if (!lat || !lng) {
        return;
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get address');
        }

        const data = await response.json();
        
        if (data && data.display_name) {
            document.getElementById('addressSearchInput').value = data.display_name;
            document.getElementById('Address').value = data.display_name;
        }
    } catch (error) {
        console.error('Error getting address:', error);
    }
}
