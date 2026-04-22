from src.data_loader import load_curriculum_from_json
import json


def main():
    planner = load_curriculum_from_json("data/curriculum.json")

    topo_order = planner.get_topological_order()
    print("Topological Order:", topo_order)
    planner.visualize(filename="curriculum_graph.png", show_kg=True)

    # Save the topological order to the JSON
    with open("data/curriculum.json", "r") as f:
        data = json.load(f)
    data["topological_order"] = topo_order
    with open("data/curriculum.json", "w") as f:
        json.dump(data, f, indent=2)


if __name__ == "__main__":
    main()
