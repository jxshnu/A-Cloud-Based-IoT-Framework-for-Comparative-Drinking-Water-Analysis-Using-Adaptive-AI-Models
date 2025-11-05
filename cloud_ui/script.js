// Wait for the HTML document to be fully loaded before running code
document.addEventListener("DOMContentLoaded", () => {
    
    // This is the base URL for your API
    const apiUrl = "https://epim79rryi.execute-api.us-east-1.amazonaws.com/v1/readings";
    let map;
    let isAdminMode = false;

    // --- 1. INITIALIZATION ---

    function initMap() {
      map = L.map("map").setView([12.9716, 77.5946], 7); // Bengaluru region
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
    }

    // --- 2. CORE DATA FETCHING & RENDERING ---

    async function fetchReadings() {
      try {
        const response = await fetch(apiUrl); 
        
        if (!response.ok) {
            console.error("HTTP Error:", response.status, response.statusText); 
            alert(`Failed to load data. HTTP Error: ${response.status} ${response.statusText}.`);
            return; 
        }
        
        const apiResponse = await response.json(); 

        let data;
        try {
            data = JSON.parse(apiResponse.body); 
        } catch (e) {
            data = apiResponse; 
        }
        
        if (!Array.isArray(data)) {
          alert("Failed to load data. Check permissions.");
          console.log("Fetched API Response (Error):", apiResponse);
          return;
        }

        // --- ADMIN MODE FILTER ---
        let readingsToDisplay = [];
        const listContainer = document.getElementById("admin-list-container");
        listContainer.innerHTML = ""; // Clear list

        if (isAdminMode) {
            // Admin Mode: Filter for untagged readings
            const untaggedReadings = data.filter(reading => !reading.latitude || !reading.longitude);
            console.log(`Admin Mode ON. Found ${untaggedReadings.length} untagged readings.`);
            
            // Populate the admin list
            populateAdminList(untaggedReadings);
            
        } else {
            // Standard Mode: Filter for tagged readings
            readingsToDisplay = data.filter(reading => reading.latitude && reading.longitude);
            console.log(`Admin Mode OFF. Showing ${readingsToDisplay.length} tagged readings.`);
        }

        // Clear old markers
        map.eachLayer((layer) => {
          if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
          }
        });

        // Add new markers (will only be tagged items)
        renderMarkers(readingsToDisplay);

      } catch (err) {
        console.error("Fatal Error fetching data:", err); 
        alert("Failed to load water quality data. Check network connection or console.");
      }
    }

    function renderMarkers(readings) {
        // This function will now ONLY render items that have lat/lon
        readings.forEach((reading) => {
            const { latitude, longitude, ph, solids, turbidity, is_potable } = reading;
            
            if (latitude && longitude) { 
                const color = is_potable === 1 || is_potable === "1" ? "green" : "red";
                
                const marker = L.circleMarker([latitude, longitude], {
                    color,
                    radius: 8,
                    fillOpacity: 0.8,
                }).addTo(map);

                const status = is_potable === 1 || is_potable === "1" ? "✅ Safe" : "⚠️ Not Safe";
                marker.bindPopup(
                    `<b>${status}</b><br>
                    <b>pH:</b> ${ph}<br>
                    <b>Solids:</b> ${solids}<br>
                    <b>Turbidity:</b> ${turbidity}`
                );
            }
        });
    }

    // --- 3. ADMIN MODE FUNCTIONS ---

    function populateAdminList(readings) {
        const listContainer = document.getElementById("admin-list-container");
        listContainer.innerHTML = ""; // Clear previous list

        if (readings.length === 0) {
            listContainer.innerHTML = "<p>No untagged readings found.</p>";
            return;
        }

        readings.forEach((reading) => {
            const item = document.createElement("div");
            item.className = "admin-list-item";
            
            const id = reading.reading_id || `TS: ${reading.timestamp_utc}`;
            item.innerHTML = `<b>ID:</b> ${id} | <b>pH:</b> ${reading.ph} | <b>Solids:</b> ${reading.solids}`;
            
            // Add click event to tag this item
            item.onclick = () => {
                handleTagging(reading);
            };
            
            listContainer.appendChild(item);
        });
    }

    // --- THIS IS THE FUNCTION THAT SAVES DATA ---
    async function handleTagging(reading) {
        const newLat = prompt(`Enter Latitude for reading ${reading.reading_id}:`);
        if (newLat === null) return; // User pressed cancel

        const newLon = prompt(`Enter Longitude for reading ${reading.reading_id}:`);
        if (newLon === null) return; // User pressed cancel

        if (!reading.reading_id) {
            alert("Error: Cannot tag an item with a missing 'reading_id'.");
            return;
        }

        if (newLat && newLon) {
            // Construct the full URL for the PUT request
            // e.g., https://.../v1/readings/a98bce63-5edc-423f...
            const updateUrl = `${apiUrl}/${reading.reading_id}`;
            
            console.log(`Sending PUT request to: ${updateUrl}`);
            
            try {
                const response = await fetch(updateUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        latitude: parseFloat(newLat),
                        longitude: parseFloat(newLon)
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    // Show error from Lambda if something went wrong
                    throw new Error(result.error || 'Failed to update coordinates');
                }

                alert(`✅ Success! Reading ${reading.reading_id} was updated.`);
                
                // Refresh the admin list to remove the item you just tagged
                fetchReadings(); 

            } catch (err) {
                console.error("Error updating coordinates:", err);
                alert(`Error: ${err.message}`);
            }
            
        } else {
            alert("Both latitude and longitude are required.");
        }
    }
    
    function toggleAdminMode() {
        isAdminMode = !isAdminMode;
        
        // Toggle the button's appearance
        const toggleBtn = document.getElementById("adminToggleBtn");
        if (toggleBtn) {
            toggleBtn.textContent = isAdminMode ? "Exit Admin Mode" : "Admin Mode";
            toggleBtn.classList.toggle("admin-active", isAdminMode);
        }
        
        // Toggle the body class to show/hide the admin list
        document.body.classList.toggle("admin-mode-active", isAdminMode);
        
        fetchReadings(); // Re-fetch data to apply the new filter
        
        alert(`Admin Mode is now ${isAdminMode ? 'ON' : 'OFF'}.`);
    }

    // --- 4. INITIALIZE ON LOAD ---
    
    // Attach all event listeners
    document.getElementById("adminToggleBtn").addEventListener("click", toggleAdminMode);
    document.getElementById("refreshBtn").addEventListener("click", fetchReadings);
    
    initMap();
    fetchReadings(); // Initial fetch (will be in standard mode)
    
});