# Smart Student Mobility Planner

A minimal JSON-backed mobility planner that computes optimal meeting points for groups using Dijkstra's algorithm and transitive closure.

## Features

- **f1**: Computes all-pairs shortest paths using Dijkstra with iterative re-walk (transitive closure)
- **f2**: Finds optimal meeting point minimizing total travel time for a group
- **FastAPI Backend**: RESTful API with CORS support
- **Interactive Map**: Vanilla JavaScript frontend with Leaflet map visualization
- **Candidate Points**: Option to restrict meeting points to specific locations

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
uvicorn server:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Serve the Frontend

Option A - Using Python's built-in server:
```bash
cd map
python -m http.server 5500
```

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
}
```

**Response:**
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
  }
}
```

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
