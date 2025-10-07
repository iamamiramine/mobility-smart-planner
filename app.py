"""FastAPI server for Smart Student Mobility Planner"""

import json
import sys
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add src to path
sys.path.insert(0, "./")

from src.application.mobility_service import f1_complete_all_pairs, f2_optimal_meeting

app = FastAPI(title="Smart Student Mobility Planner API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class F2Request(BaseModel):
    people: List[str]
    candidate_points: Optional[List[str]] = None


class F2Response(BaseModel):
    status: str
    meeting_point: Optional[str] = None
    total_time: Optional[float] = None
    routes: Optional[List[dict]] = None
    message: Optional[str] = None


# Global cache for f1 results
f1_cache = None


@app.get("/api/graph")
async def get_graph():
    """Get graph data including nodes, descriptions, coordinates, and edges"""
    try:
        with open("data/nodes.json", "r") as f:
            nodes_data = json.load(f)
        with open("data/edges.json", "r") as f:
            edges_data = json.load(f)

        return {
            "nodes": nodes_data.get("nodes", {}),
            "people": nodes_data.get("people", {}),
            "edges": edges_data.get("edges", []),
            "directed": edges_data.get("directed", False),
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Graph data file not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading graph data: {e}")


@app.post("/api/f1")
async def compute_f1():
    """Recompute all-pairs shortest paths using f1"""
    try:
        global f1_cache
        f1_cache = f1_complete_all_pairs("data/nodes.json", "data/edges.json")

        # Calculate sparsity
        n = len(f1_cache["nodes"])
        total_pairs = n * n
        reachable_pairs = sum(
            1
            for row in f1_cache["graph"]
            for cell in row
            if cell["time"] != float("inf")
        )

        sparsity = (total_pairs - reachable_pairs) / total_pairs

        return {
            "status": "ok",
            "nodes": f1_cache["nodes"],
            "message": f"Computed all-pairs shortest paths for {n} nodes",
            "sparsity": round(sparsity, 3),
            "reachable_pairs": reachable_pairs,
            "total_pairs": total_pairs,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing f1: {e}")


@app.post("/api/f2", response_model=F2Response)
async def compute_f2(request: F2Request):
    """Compute optimal meeting point and routes using f2"""
    try:
        if not request.people:
            raise HTTPException(
                status_code=400, detail="At least one person must be specified"
            )

        result = f2_optimal_meeting(
            people_nodes=request.people,
            node_file="data/nodes.json",
            edge_file="data/edges.json",
            f1_cache=f1_cache,  # pass cached graph
        )

        # Check if the result contains an error status
        if result.get("status") == "error":
            raise HTTPException(
                status_code=400, detail=result.get("message", "Unknown error")
            )

        return F2Response(**result)
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing f2: {e}")


@app.get("/")
async def root():
    """Root endpoint - redirect to map files"""
    return {"message": "Smart Student Mobility Planner API", "docs": "/docs"}


# at the bottom, before mounting
import os

if os.path.isdir("map"):
    app.mount("/map", StaticFiles(directory="map", html=True), name="map")
else:
    print("'map' directory not found; skipping static mount")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
