from src.data_loader import load_curriculum_from_json


def main():
    planner = load_curriculum_from_json("data/curriculum.json")

    print("Topological Order:", planner.get_topological_order())
    planner.visualize(filename="curriculum_graph.png", show_kg=True)


if __name__ == "__main__":
    main()
