// Smart Student Mobility Planner - Frontend Application

class MobilityPlanner {
   constructor() {
      this.map = null;
      this.graphData = null;
      this.nodeMarkers = new Map();
      this.routePolylines = [];
      this.meetingPointMarker = null;
      this.selectedPeople = new Set();
      this.currentMeetingPoint = null;
      this.currentRoutes = [];
      this.currentStep = new Map();

      this.init();
   }

   async init() {
      try {
         await this.loadGraphData();
         this.initializeMap();
         this.setupEventListeners();
         this.populateNodeSelections();
      } catch (error) {
         this.showError("Failed to initialize application: " + error.message);
      }
   }

   async loadGraphData() {
      try {
         const response = await fetch("http://127.0.0.1:8000/api/graph");
         if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
         }
         this.graphData = await response.json();
      } catch (error) {
         throw new Error("Failed to load graph data: " + error.message);
      }
   }

   initializeMap() {
      if (!this.graphData || !this.graphData.nodes) {
         throw new Error("Graph data with nodes not available");
      }

      // Calculate center point from all coordinates
      const coords = Object.values(this.graphData.nodes)
         .map((node) => node.coords)
         .filter((coord) => coord && coord.length === 2);
      const centerLat =
         coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
      const centerLng =
         coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

      // Initialize map
      this.map = L.map("map").setView([centerLat, centerLng], 14);

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
         attribution: "© OpenStreetMap contributors",
      }).addTo(this.map);

      // Add all nodes as markers
      this.addNodeMarkers();
   }

   addNodeMarkers() {
      Object.keys(this.graphData.nodes).forEach((nodeId) => {
         const node = this.graphData.nodes[nodeId];
         if (!node || !node.coords) return;

         const [lat, lng] = node.coords;
         const description = node.description || nodeId;

         // Check if any person is at this node
         const peopleAtNode = Object.entries(this.graphData.people)
            .filter(([personId, personData]) => personData.home === nodeId)
            .map(([personId]) => personId);

         // Marker label: show person name(s) if present, otherwise nodeId
         const labelText =
            peopleAtNode.length > 0 ? peopleAtNode.join(", ") : nodeId;

         // Set marker color: red for people, blue for regular nodes
         const markerColor = peopleAtNode.length > 0 ? "#e74c3c" : "#3498db";

         // Simple marker with letter or person name
         const marker = L.marker([lat, lng], {
            icon: L.divIcon({
               className: "simple-letter-marker",
               html: `
               <div style="
                  background: ${markerColor};
                  color: #fff;
                  border-radius: 50%;
                  width: 35px; height: 35px;
                  display:flex; align-items:center; justify-content:center;
                  font-weight:bold; font-size:12px;">
                  ${labelText}
               </div>`,
               iconSize: [35, 35],
               iconAnchor: [17, 17],
            }),
         }).addTo(this.map);

         // Popup
         marker.bindPopup(`<b>${labelText}</b><br>${description}`);

         this.nodeMarkers.set(nodeId, marker);
      });
   }

   setupEventListeners() {
      // Compute button
      document.getElementById("compute-btn").addEventListener("click", () => {
         this.computeOptimalMeeting();
      });

      // Clear button
      document.getElementById("clear-btn").addEventListener("click", () => {
         this.clearAll();
      });

      // Error banner close button
      document.getElementById("close-error").addEventListener("click", () => {
         this.hideError();
      });

      document.getElementById("step-btn").addEventListener("click", () => {
         this.moveOneStep();
      });
   }

   populateNodeSelections() {
      const peopleContainer = document.getElementById("people-selection");

      // Clear existing content
      peopleContainer.innerHTML = "";

      // Add checkboxes for each person
      Object.keys(this.graphData.people).forEach((personId) => {
         const personItem = this.createCheckboxItem(personId, "people");
         peopleContainer.appendChild(personItem);
      });
   }

   createCheckboxItem(nodeId, type) {
      const item = document.createElement("div");
      item.className = "checkbox-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `${type}-${nodeId}`;
      checkbox.value = nodeId;

      const label = document.createElement("label");
      label.htmlFor = `${type}-${nodeId}`;
      label.textContent = nodeId; // show the letter

      item.appendChild(checkbox);
      item.appendChild(label);

      // Add change event listener
      checkbox.addEventListener("change", (e) => {
         this.handleSelectionChange(nodeId, type, e.target.checked);
      });

      return item;
   }

   setMarkerColorByNode(nodeId, color) {
      const marker = this.nodeMarkers.get(nodeId);
      if (!marker) return;

      // Keep marker size consistent
      const html = marker.options.icon.options.html.replace(
         /background:\s*#[0-9a-fA-F]+/,
         `background: ${color}`
      );

      marker.setIcon(
         L.divIcon({
            className: "simple-letter-marker",
            html,
            iconSize: [35, 35],
            iconAnchor: [17, 17],
         })
      );
   }

   handleSelectionChange(personId, type, isSelected) {
      if (type === "people") {
         const person = this.graphData.people[personId];
         if (!person) return;

         const nodeId = person.home; // Get the node the person belongs to

         if (isSelected) {
            this.selectedPeople.add(personId);
            this.setMarkerColorByNode(nodeId, "#7f2a2aff"); // green highlight
         } else {
            this.selectedPeople.delete(personId);
            this.setMarkerColorByNode(nodeId, "#e74c3c"); // red default
         }
      }

      this.updateComputeButton();
   }

   updateComputeButton() {
      const computeBtn = document.getElementById("compute-btn");
      computeBtn.disabled = this.selectedPeople.size === 0;
   }

   async computeOptimalMeeting() {
      if (this.selectedPeople.size === 0) {
         this.showError("Please select at least one person");
         return;
      }

      const computeBtn = document.getElementById("compute-btn");
      const originalText = computeBtn.textContent;

      try {
         // Show loading state
         computeBtn.disabled = true;
         computeBtn.textContent = "Computing...";
         computeBtn.classList.add("loading");

         // Clear previous results
         this.clearMapResults();

         // Prepare request data
         const requestData = {
            people: Array.from(this.selectedPeople),
         };

         // Call API
         const response = await fetch("http://127.0.0.1:8000/api/f2", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}`);
         }

         const result = await response.json();

         if (result.status === "success") {
            this.currentRoutes = result.routes.map((r) => ({
               ...r,
               fullPath: [...r.path],
               fullRouteText: r.route_text,
            }));
            this.currentStep = new Map();
            this.currentMeetingPoint = result.meeting_point;

            this.displayResults(result);
            this.visualizeRoutes(result);
         } else {
            this.showError(
               result.message || "Failed to compute optimal meeting point"
            );
         }
      } catch (error) {
         this.showError("Error computing routes: " + error.message);
      } finally {
         // Reset button state
         computeBtn.disabled = false;
         computeBtn.textContent = originalText;
         computeBtn.classList.remove("loading");
      }
   }

   displayResults(result) {
      const resultsPanel = document.getElementById("results-panel");
      const resultsContent = document.getElementById("results-content");

      const stepBtn = document.getElementById("step-btn");
      stepBtn.disabled = this.currentMeetingPoint == null;

      let html = `
        <div class="meeting-info">
            <h4>Meeting Point: ${result.meeting_point}</h4>
            
        </div>
        <div class="routes-list">
            <h5>Individual Routes:</h5>
    `;

      result.routes.forEach((route) => {
         // Get person's name if available
         const personData = this.graphData.people[route.person];
         const personName =
            personData && personData.name ? personData.name : route.person;

         // Full path display (A → B → C → D)
         const fullPath = route.path
            ? route.path.join(" → ")
            : `${route.from} → ${route.to}`;

         html += `
            <div class="route-item">
                <strong>${personName}</strong><br>
                <div class="full-path">${fullPath}</div>
                <span class="route-time"> ${route.time.toFixed(
                   1
                )} min</span><br>
                <small>${route.route_text}</small>
            </div>
        `;
      });

      html += "</div>";
      resultsContent.innerHTML = html;
      resultsPanel.style.display = "block";
   }

   visualizeRoutes(result) {
      // Highlight meeting point
      this.highlightMeetingPoint(result.meeting_point);

      // Draw routes
      result.routes.forEach((route, index) => {
         this.drawRoute(route, index);
      });
   }

   highlightMeetingPoint(meetingPoint) {
      const node = this.graphData.nodes[meetingPoint];
      if (!node || !node.coords) return;
      const [lat, lng] = node.coords;

      // Change existing node marker color to green
      const marker = this.nodeMarkers.get(meetingPoint);
      if (marker) {
         marker.setIcon(
            L.divIcon({
               className: "simple-letter-marker",
               html: `<div style="
                    background: green;
                    color: white;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-weight:bold;
                    font-size:14px;
                ">M</div>`,
               iconSize: [35, 35],
               iconAnchor: [17, 17],
            })
         );
         marker
            .bindPopup(
               `
            <div class="meeting-popup">
                <h4>🎯 Meeting Point: ${meetingPoint}</h4>
                <p><strong>${node.description || ""}</strong></p>
                <small>This is the optimal meeting location!</small>
            </div>
        `
            )
            .openPopup();
      }
   }

   drawRoute(route, routeIndex) {
      if (!route.path || route.path.length < 2) return;

      // Get coordinates for each waypoint
      const waypoints = route.path.map((nodeId) => {
         const coord = this.graphData.nodes[nodeId]?.coords;
         return [coord[0], coord[1]];
      });

      // Add waypoint markers for intermediate stops
      this.addWaypointMarkers(route.path, routeIndex);

      // Create polyline with thicker, more visible styling
      const polyline = L.polyline(waypoints, {
         color: this.getRouteColor(routeIndex),
         weight: 8,
         opacity: 0.9,
         dashArray: routeIndex % 2 === 0 ? "8, 8" : "15, 8",
         lineCap: "round",
         lineJoin: "round",
      }).addTo(this.map);

      // Add a shadow/outline effect for better visibility
      const shadowPolyline = L.polyline(waypoints, {
         color: "#000000",
         weight: 12,
         opacity: 0.3,
         dashArray: routeIndex % 2 === 0 ? "8, 8" : "15, 8",
      }).addTo(this.map);

      // Bring the main route to front
      this.map.addLayer(polyline);
      this.routePolylines.push(polyline, shadowPolyline);

      // Add popup to polyline with full path
      const fullPath = route.path.join(" → ");
      polyline.bindPopup(`
        <div class="route-popup">
            <h4>Route: ${fullPath}</h4>
            <p><strong>Time:</strong> ${route.time.toFixed(1)} minutes</p>
            <p><strong>Instructions:</strong> ${route.route_text}</p>
        </div>
    `);

      const startNode = route.path[0];
      const startCoord = this.graphData.nodes[startNode]?.coords;
      const personData = this.graphData.people[route.person];
      const personName =
         personData && personData.name ? personData.name : route.person;

      if (startCoord) {
         L.marker([startCoord[0], startCoord[1]], {
            icon: L.divIcon({
               className: "person-marker",
               html: `<div style="background:red;color:white;border-radius:50%;width:25px;height:25px;display:flex;align-items:center;justify-content:center;font-weight:bold;">${personName}</div>`,
               iconSize: [25, 25],
               iconAnchor: [12, 12],
            }),
         })
            .addTo(this.map)
            .bindPopup(`<b>${personName}</b>`);
      }

      // Fit map to show all routes
      if (this.routePolylines.length === 2) {
         this.map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
      }
   }

   addWaypointMarkers(path, routeIndex) {
      const routeColor = this.getRouteColor(routeIndex);

      const selectedHomes = new Set(
         Array.from(this.selectedPeople).map(
            (p) => this.graphData.people[p].home
         )
      );

      // Add markers for intermediate waypoints (not start/end)
      for (let i = 1; i < path.length - 1; i++) {
         const nodeId = path[i];

         // Skip if this node is a selected person's home
         if (selectedHomes.has(nodeId)) continue;

         const coord = this.graphData.nodes[nodeId]?.coords;
         if (!coord) continue;

         const waypointMarker = L.marker([coord[0], coord[1]], {
            icon: L.divIcon({
               className: "waypoint-marker",
               html: `
                    <div class="waypoint-pin">
                        <div class="waypoint-number">${i}</div>
                    </div>
                `,
               iconSize: [25, 25],
               iconAnchor: [12, 12],
            }),
         }).addTo(this.map);

         waypointMarker.bindPopup(`
            <div class="waypoint-popup">
                <h4>Waypoint ${i}: ${nodeId}</h4>
                <p><strong>${
                   this.graphData.nodes[nodeId]?.description || nodeId
                }</strong></p>
                <small>Stop ${i} of ${path.length - 1} on this route</small>
            </div>
        `);

         this.routePolylines.push(waypointMarker);
      }
   }

   getRouteColor(index) {
      const colors = [
         "#e74c3c",
         "#3498db",
         "#2ecc71",
         "#f39c12",
         "#9b59b6",
         "#1abc9c",
      ];
      return colors[index % colors.length];
   }

   getStepResult() {
      if (!this.currentRoutes || this.currentRoutes.length === 0) return null;

      return this.currentRoutes.map((route) => {
         const currentIndex = this.currentStep.get(route.person) || 0;

         // Stop if already reached meeting point
         if (currentIndex >= route.fullPath.length - 1) {
            return {
               ...route,
               path: [route.fullPath[route.fullPath.length - 1]],
               time: 0,
               route_text: "Reached meeting point",
            };
         }

         // Slice path from current step to the end
         const partialPath = route.fullPath.slice(currentIndex);

         // Slice route_text if it contains steps (assume | separator)
         let partialText = route.fullRouteText;
         if (typeof partialText === "string" && partialText.includes("|")) {
            const texts = partialText.split("|").map((t) => t.trim());
            partialText = texts.slice(currentIndex).join(" | ");
         }

         const stepTime = route.segment_times
            ? route.segment_times[currentIndex]
            : 0;

         return {
            ...route,
            path: partialPath,
            time: stepTime,
            route_text: partialText,
         };
      });
   }

   moveOneStep() {
      if (!this.currentRoutes || this.currentRoutes.length === 0) return;

      // Increment step for each person unless reached meeting point
      this.currentRoutes.forEach((route) => {
         const currentIndex = this.currentStep.get(route.person) || 0;
         if (currentIndex < route.fullPath.length - 1) {
            this.currentStep.set(route.person, currentIndex + 1);
         }
      });

      const stepRoutes = this.getStepResult();
      if (!stepRoutes || stepRoutes.length === 0) return;

      // Clear previous routes
      this.clearMapResults();

      const stepResult = {
         meeting_point: this.currentMeetingPoint,
         routes: stepRoutes,
      };

      this.displayResults(stepResult);
      this.visualizeRoutes(stepResult);
   }

   clearMapResults() {
      // Remove route polylines
      this.routePolylines.forEach((polyline) => {
         this.map.removeLayer(polyline);
      });
      this.routePolylines = [];

      // Remove meeting point marker
      if (this.meetingPointMarker) {
         this.map.removeLayer(this.meetingPointMarker);
         this.meetingPointMarker = null;
      }

      // Hide results panel
      document.getElementById("results-panel").style.display = "none";
   }

   clearAll() {
      // Clear selections
      this.selectedPeople.clear();

      // Reset step button
      const stepBtn = document.getElementById("step-btn");
      stepBtn.disabled = true;

      // Reset marker colors for all nodes
      Object.keys(this.graphData.nodes).forEach((nodeId) => {
         const peopleAtNode = Object.values(this.graphData.people).filter(
            (p) => p.home === nodeId
         );
         const color = peopleAtNode.length > 0 ? "#e74c3c" : "#3498db";
         this.setMarkerColorByNode(nodeId, color);
      });

      // Clear checkboxes
      document
         .querySelectorAll('input[type="checkbox"]')
         .forEach((cb) => (cb.checked = false));

      // Clear routes and map results
      this.clearMapResults();

      // Reset app state
      this.currentRoutes = [];
      this.currentStep = new Map();
      this.currentMeetingPoint = null;

      // Reset compute button
      this.updateComputeButton();
   }

   showError(message) {
      const errorBanner = document.getElementById("error-banner");
      const errorMessage = document.getElementById("error-message");

      errorMessage.textContent = message;
      errorBanner.style.display = "flex";

      // Auto-hide after 5 seconds
      setTimeout(() => {
         this.hideError();
      }, 5000);
   }

   hideError() {
      document.getElementById("error-banner").style.display = "none";
   }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
   new MobilityPlanner();
});
