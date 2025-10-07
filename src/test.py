"""Smart Student Mobility Planner – JSON-based Minimal Version"""

import json

import sys
sys.path.insert(0, './')

from src.application.mobility_service import f1_complete_all_pairs, f2_optimal_meeting

def main():
    print("=" * 65)
    print("      SMART STUDENT MOBILITY PLANNER (JSON-BASED VERSION)")
    print("=" * 65)

    # STEP 1 – Load JSON Data
    print("\n[STEP 1] Loading network data from JSON files...")
    with open("nodes.json") as f:
        nodes_data = json.load(f)
    with open("edges.json") as f:
        edges_data = json.load(f)
    print(f"✓ Loaded {len(nodes_data['nodes'])} nodes and {len(edges_data['edges'])} edges.")

    # STEP 2 – Compute Transitive Closure (f1)
    print("\n[STEP 2] Computing transitive closure with Dijkstra (f1)...")
    f1_result = f1_complete_all_pairs("nodes.json", "edges.json")
    print(f"✓ Completed all-pairs shortest paths computed.")
    print(f"  - Total Nodes: {len(f1_result['nodes'])}")

    # Show distance matrix
    print("\nDistance Matrix (minutes):")
    for row in f1_result["D"]:
        print(["∞" if x == float("inf") else round(x, 1) for x in row])

    # STEP 3 – Find optimal meeting point (f2)
    print("\n[STEP 3] Computing optimal meeting point (f2)...")
    # Example: assume group at nodes A, C, and D
    people = ["A", "C", "D"]
    print(f"People positions: {people}")

    f2_result = f2_optimal_meeting(people, "nodes.json", "edges.json")
    if f2_result["status"] == "success":
        print(f"\n✓ Best meeting point: {f2_result['meeting_point']}")
        print(f"  - Total travel time: {f2_result['total_time']:.1f} min\n")
        print("Routes:")
        for r in f2_result["routes"]:
            print(f"  {r['from']} → {r['to']} ({r['time']} min)")
            print(f"    Path: {' → '.join(r['path'])}")
            print(f"    Route: {r['route_text']}")
    else:
        print(f"✗ Error: {f2_result['message']}")

    print("\n✓ Application finished successfully!\n")


if __name__ == "__main__":
    main()
