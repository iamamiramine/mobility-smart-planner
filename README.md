<<<<<<< HEAD
# 🧭 Smart Student Mobility Planner

An interactive and data-driven **urban mobility planner** that computes **optimal meeting points** for groups of users based on real travel times.  
The system combines **FastAPI** (backend) and **Leaflet.js** (frontend) to visualize routes, nodes, and buildings in **Montbéliard city**.

---

## 🚀 Features

-  **Dijkstra-based Routing:** Efficient all-pairs shortest path computation using Dijkstra’s algorithm with transitive closure.
-  **Optimal Meeting Point (f2):** Finds the best meeting point minimizing the **maximum individual travel time** among selected users.
-  **Rich Node Structure:** Supports detailed node hierarchy (e.g., `Library - Room 201`, `Hospital - Pharmacy`).
-  **Interactive Map Visualization:** Visualizes routes, nodes, and optimal meeting points with **Leaflet.js**.
-  **JSON-Driven Data:** Easy-to-edit structure for nodes, edges, and people.
-  **FastAPI Backend:** Lightweight, high-performance REST API.
-  **Frontend Integration:** Pure JavaScript frontend that interacts seamlessly with the backend.

---

## ⚙️ Quick Start
=======
# Smart Student Mobility Planner

A minimal JSON-backed mobility planner that computes optimal meeting points for groups using Dijkstra's algorithm and transitive closure.

## Features

- **f1**: Computes all-pairs shortest paths using Dijkstra with iterative re-walk (transitive closure)
- **f2**: Finds optimal meeting point minimizing total travel time for a group
- **FastAPI Backend**: RESTful API with CORS support
- **Interactive Map**: Vanilla JavaScript frontend with Leaflet map visualization
- **Candidate Points**: Option to restrict meeting points to specific locations

## Quick Start
>>>>>>> origin/main

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
<<<<<<< HEAD
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Access the API at **http://localhost:8000**

### 3. Run the Frontend

Option A – Serve via Python:

=======
uvicorn server:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Serve the Frontend

Option A - Using Python's built-in server:
>>>>>>> origin/main
```bash
cd map
python -m http.server 5500
```

<<<<<<< HEAD
Option B – Serve from FastAPI:
Frontend is available at  
👉 `http://localhost:8000/map/`

### 4. Open in Browser

Visit `http://localhost:5500` or `http://localhost:8000/map/`

---

## 🧩 API Endpoints

### **GET** `/api/graph`

Returns all nodes, edges, coordinates, and metadata for the city graph.

### **POST** `/api/f1`

Recomputes all-pairs shortest paths (Dijkstra with iterative transitive closure).

**Response:**

```json
{
   "status": "success",
   "message": "All-pairs shortest paths computed",
   "num_nodes": 35,
   "elapsed_time": 0.52
}
```

### **POST** `/api/f2`

Finds the **optimal meeting point** minimizing total or maximum travel time.

**Request:**

```json
{
   "people": ["alice", "bob"]
=======
Option B - Using FastAPI map files:
The frontend is automatically served at `http://localhost:8000/map/`

### 4. Open the Application

Navigate to `http://localhost:5500` (if using Python server) or `http://localhost:8000/map/` (if using FastAPI)

## API Endpoints

### GET `/api/graph`
Returns graph data including nodes, descriptions, coordinates, and edges.

### POST `/api/f1`
Recomputes all-pairs shortest paths and returns computation summary.

### POST `/api/f2`
Computes optimal meeting point and routes.

**Request:**
```json
{
  "people": ["A", "C", "D"],
  "candidate_points": ["B", "L", "N"]  // optional
>>>>>>> origin/main
}
```

**Response:**
<<<<<<< HEAD

```json
{
   "tatus": "success",
   "meeting_point": "K",
   "meet_time": 65.0,
   "routes": [
      {
         "person": "alice",
         "from": "F",
         "to": "K",
         "time": 35.0,
         "path": ["F", "K"],
         "route_text": "Bus 35",
         "segment_times": [35.0]
      },
      {
         "person": "bob",
         "from": "J",
         "to": "K",
         "time": 65.0,
         "path": ["J", "N", "K"],
         "route_text": "Bus 40 | Metro 30",
         "segment_times": [35.0, 30.0]
      }
   ]
}
```

---

## 🗺️ Data Format

### `nodes.json`

Defines all physical locations (stations, university, library, hospital, etc.) and their sub-locations.

```json
{
  "nodes": {
    "A": { "name": "Gare de Montbéliard", "type": "station", "coords": [47.510471, 6.801662] },
    "B": { "name": "Centre-ville", "type": "city_center", "coords": [47.512, 6.8] },
    "B1": { "name": "City Center - Main Square", "type": "public_square", "coords": [47.5121, 6.8001] },
    ...
    "K2": { "name": "Library - Room 201", "type": "study_room", "coords": [47.5091, 6.8082] }
  },
  "people": {
    "alice": { "home": "F", "points_of_interest": ["B", "C", "H"] },
    "bob": { "home": "J", "points_of_interest": ["D2", "E", "K1"] },
    "carol": { "home": "A", "points_of_interest": ["B3", "M3", "N"] }
=======
```json
{
  "status": "success",
  "meeting_point": "L",
  "total_time": 92.0,
  "routes": [
    {
      "from": "A",
      "to": "L",
      "time": 30.0,
      "path": ["A", "B", "L"],
      "route_text": "Bus 20 | Walk 10"
    }
  ]
}
```

## Data Format

### nodes.json
```json
{
  "nodes": ["A", "B", "C", ...],
  "descriptions": {
    "A": "Central bus terminal",
    "B": "Train station"
  },
  "coords": {
    "A": [47.513, 6.798],
    "B": [47.516, 6.812]
>>>>>>> origin/main
  }
}
```

<<<<<<< HEAD
### `edges.json`

Defines connectivity between nodes (roads, paths, bus routes, etc.).

```json
{
   "directed": false,
   "edges": [
      { "from": "A", "to": "B", "time": 20, "text": "Bus 20" },
      { "from": "K", "to": "K1", "time": 2, "text": "Library internal stairs" },
      { "from": "D", "to": "D2", "time": 3, "text": "Hospital corridor" }
   ]
}
```

---

## 🧠 Algorithms

### **f1 – Dijkstra’s All-Pairs Shortest Paths**

Computes the shortest path between every pair of nodes, storing the distance matrix for reuse.

### **f2 – Optimal Meeting Point**

Evaluates each node as a potential meeting location and selects the one minimizing:

-  Total group travel time, or
-  Maximum individual travel time (configurable).

---

## 🖥️ Frontend

-  Built with **Vanilla JavaScript + Leaflet**
-  Displays:
   -  All nodes as markers
   -  User homes and meeting points
   -  Optimal routes with distinct colors
-  Provides:
   -  Person selection
   -  Route computation
   -  Real-time map update

---

## 🔄 Data Flow

1. Frontend sends selected people → `/api/f2`
2. Backend computes routes and meeting point
3. Response is displayed on map via **Leaflet**
4. Each route path and meeting point is shown interactively

---

## 🌍 Architecture Overview

```
├── server.py # FastAPI backend & API routes
├── src/application/
│   ├── mobility_service.py # Core algorithms (f1, f2)
│   └── utils/ # Path computation helpers
├── data/
│   ├── nodes.json # City and building nodes
│   └── edges.json # Connectivity graph
├── map/
│   ├── index.html # Web interface
│   ├── app.js # Main JS logic
│   └── styles.css # Styling
└── requirements.txt # Dependencies
```

## 🧾 Example Usage

1. Select people (e.g., Alice, Bob, Carol)
2. Press **Compute Best Routes**
3. Watch the map animate optimal paths
4. Hover over routes for step details
5. Meeting point is marked in **green**

---

## 🏁 Future Improvements

-  Add **real-time transport schedules**
-  Enable **dynamic edge weighting** (traffic, time of day)
-  Add **user authentication**
-  Include **multi-criteria optimization** (time + distance + CO₂)

---

## 📦 Project Information

**GitHub Repository:** [Mobility Smart Planner](https://github.com/iamamiramine/mobility-smart-planner)  
**Developed by:** Amir Amine & Mohammad Khalife  
**Technologies:** FastAPI, Leaflet.js, JavaScript, Python, JSON
=======
### edges.json
```json
{
  "directed": false,
  "edges": [
    {
      "from": "A",
      "to": "B", 
      "time": 20,
      "text": "Bus 20"
    }
  ]
}
```

## Usage

1. **Select People**: Choose the locations where people are currently located
2. **Select Candidates** (optional): Choose specific meeting point candidates, or leave empty to consider all locations
3. **Compute Routes**: Click "Compute Best Routes" to find the optimal meeting point
4. **View Results**: See the chosen meeting point highlighted on the map with route polylines

## CORS Configuration

The server is configured to allow requests from:
- `http://localhost:5500`
- `http://127.0.0.1:5500`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

To modify CORS settings, edit the `allow_origins` list in `server.py`.

## Architecture

- **Backend**: FastAPI with Python
- **Frontend**: Vanilla JavaScript with Leaflet maps
- **Algorithms**: Dijkstra's shortest path with transitive closure
- **Data**: JSON files for nodes and edges
- **Visualization**: Interactive map with markers and polylines

## File Structure

```
├── server.py                 # FastAPI backend
├── requirements.txt          # Python dependencies
├── nodes.json               # Node data with coordinates
├── edges.json               # Edge data with travel times
├── src/
│   └── application/
│       └── mobility_service.py  # Core algorithms (f1, f2)
└── map/
    ├── index.html           # Frontend HTML
    ├── app.js              # Frontend JavaScript
    └── styles.css          # Frontend CSS
```

## Development

The application is designed to be minimal and framework-free (except for Leaflet via CDN). No build tools or bundlers are required.

For development, use `uvicorn server:app --reload` to enable auto-reload of the backend server.
>>>>>>> origin/main
