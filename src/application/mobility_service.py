import json, math, heapq


# ---------- helpers ----------
def _index_maps(node_ids):
    idx = {n: i for i, n in enumerate(node_ids)}
    rev = {i: n for n, i in idx.items()}
    return idx, rev


def _build_graph(node_file="nodes.json", edge_file="edges.json"):
    nodes_data = json.load(open(node_file))
    edges_data = json.load(open(edge_file))

    nodes = list(nodes_data["nodes"].keys())
    idx, rev = _index_maps(nodes)
    n = len(nodes)

    # adjacency (inf = no edge), and per-edge text
    graph = [
        [{"time": math.inf, "text": None, "path": []} for _ in range(n)]
        for _ in range(n)
    ]
    for i in range(n):
        graph[i][i]["time"] = 0
        graph[i][i]["path"] = [nodes[i]]

    directed = edges_data.get("directed", False)
    for edge in edges_data["edges"]:
        id_from, id_to, time = idx[edge["from"]], idx[edge["to"]], float(edge["time"])
        txt = edge.get("text")
        if time >= 0:
            graph[id_from][id_to]["time"] = min(graph[id_from][id_to]["time"], time)
            graph[id_from][id_to]["text"] = txt
            if not directed:
                graph[id_to][id_from]["time"] = min(graph[id_to][id_from]["time"], time)
                graph[id_to][id_from]["text"] = txt

    return nodes, idx, rev, graph


def _reconstruct_path(prev, s, t):
    if prev[t] is None and s != t:
        return []  # unreachable
    path = []
    cur = t
    while cur is not None:
        path.append(int(cur))  # ensure index
        cur = prev[cur]
    path.reverse()
    return path if path[0] == s else []


# ---------- f1: transitive closure with Dijkstra + full re-walk ----------
def f1_complete_all_pairs(node_file="nodes.json", edge_file="edges.json"):
    # N, idx, rev, W, edge_text, desc = _build_graph(node_file, edge_file)
    nodes, idx, rev, graph = _build_graph(node_file, edge_file)
    n = len(nodes)

    def dijkstra(start):
        dist = [math.inf] * n
        prev = [None] * n
        dist[start] = 0
        pq = [(0, start)]
        while pq:
            d, u = heapq.heappop(pq)
            if d != dist[u]:
                continue
            for v in range(n):
                w = graph[u][v]["time"]
                if w == math.inf:
                    continue
                nd = d + w
                if nd < dist[v]:
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq, (nd, v))
        return dist, prev

    def build_path_text(path):
        if not path or len(path) == 1:
            return ""
        parts = []
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edge = graph[u][v]
            if edge.get("text"):
                parts.append(edge["text"])
            else:
                parts.append(f"Go {rev[u]} -> {rev[v]}")
        return " | ".join(parts)

    improved = True
    while improved:
        improved = False
        for s in range(n):
            dist, prev = dijkstra(s)
            for t in range(n):
                if dist[t] < graph[s][t]["time"]:
                    graph[s][t]["time"] = dist[t]
                    path = _reconstruct_path(prev, s, t)
                    graph[s][t]["path"] = path
                    graph[s][t]["text"] = build_path_text(path)
                    improved = True
                elif graph[s][t]["time"] < math.inf and not graph[s][t]["path"]:
                    # fill missing path if distance is known
                    path = _reconstruct_path(prev, s, t)
                    graph[s][t]["path"] = path
                    graph[s][t]["text"] = build_path_text(path)

    return {
        "nodes": nodes,
        "idx": idx,
        "rev": rev,
        "graph": graph,
    }


# ---------- f2: choose meeting point minimizing total travel ----------
def f2_optimal_meeting(
    people_nodes, node_file="nodes.json", edge_file="edges.json", f1_cache=None
):
    nodes_data = json.load(open(node_file))
    people_dict = nodes_data["people"]

    # Validate people nodes first
    for p in people_nodes:
        if p not in people_dict:
            return {"status": "error", "message": f"Invalid people node: {p}"}

    if f1_cache:
        idx = f1_cache["idx"]
        rev = f1_cache["rev"]
        graph = f1_cache["graph"]
    else:
        G = f1_complete_all_pairs(node_file, edge_file)  # calls f1
        idx, rev, graph = (
            G["idx"],
            G["rev"],
            G["graph"],
        )

    people_loc = [idx[people_dict[p]["home"]] for p in people_nodes]

    candidate_nodes = set()

    for person in people_nodes:
        candidate_nodes.add(people_dict[person]["home"])
        candidate_nodes.update(people_dict[person]["points_of_interest"])

    candidate_indices = [idx[node_id] for node_id in candidate_nodes]

    best_point = None
    best_max = float("inf")
    for cand in candidate_indices:
        max_time = 0.0
        ok = True
        for u in people_loc:
            if graph[u][cand]["time"] == math.inf:
                ok = False
                break
            max_time = max(max_time, graph[u][cand]["time"])
        if ok and max_time < best_max:
            best_max = max_time
            best_point = cand

    if best_point is None:
        return {
            "status": "error",
            "message": "No common reachable meeting point among candidates.",
        }

    routes = []
    for u in people_nodes:
        u_idx = idx[people_dict[u]["home"]]

        full_path = [
            rev[i] if isinstance(i, int) else i
            for i in graph[u_idx][best_point]["path"]
        ]

        segment_times = []
        for i in range(len(full_path) - 1):
            from_idx = idx[full_path[i]]
            to_idx = idx[full_path[i + 1]]
            segment_times.append(graph[from_idx][to_idx]["time"])

        routes.append(
            {
                "person": u,
                "from": people_dict[u]["home"],
                "to": rev[best_point],
                "time": graph[u_idx][best_point]["time"],
                "path": full_path,
                "route_text": graph[u_idx][best_point]["text"],
                "segment_times": segment_times,
            }
        )

    # print(f"routes{routes}")
    # print(nodes_data["nodes"]["K2"]["name"])
    return {
        "status": "success",
        "meeting_point": rev[best_point],
        "meeting_point_name": nodes_data["nodes"]["K2"]["name"],
        "meet_time": best_max,
        "routes": routes,
    }


# ---------- tiny demo ----------
if __name__ == "__main__":
    # Example: people at A and C
    # print(f2_optimal_meeting(["A", "C"]))
    people = ["alice", "bob"]
    result = f2_optimal_meeting(
        people_nodes=people,
        node_file="../../data/nodes.json",
        edge_file="../../data/edges.json",
    )
    # print(result)
