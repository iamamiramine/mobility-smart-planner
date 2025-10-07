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

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Access the API at **http://localhost:8000**

### 3. Run the Frontend

Option A – Serve via Python:

```bash
cd map
python -m http.server 5500
```

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
}
```

**Response:**

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
  }
}
```

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
