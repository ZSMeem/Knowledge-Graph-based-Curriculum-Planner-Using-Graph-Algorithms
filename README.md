# Curriculum Scheduling

A Python project for building a Knowledge Graph based Curriculum Planner using topological sorting and graph algorithms.

## Features

- Load curriculum data from CSV or JSON datasets
- Add courses with metadata, prerequisites, and offering terms
- Compute topological order for course scheduling
- Visualize the curriculum and knowledge graph

## Installation

1. Clone the repository
2. Install dependencies:
   - Create and activate a virtual environment:
     ```sh
     python3 -m venv venv
     source venv/bin/activate
     ```
   - Install packages:
     ```sh
     python -m pip install -r requirements.txt
     ```

## Dataset

Sample dataset file is available in the `data/` folder:

- `data/curriculum.json`

## Usage

Load from JSON:

```python
from src.data_loader import load_curriculum_from_json

planner = load_curriculum_from_json("data/curriculum.json")
print(planner.get_topological_order())
planner.visualize(show_kg=True)
```

Run the sample loader script:

```sh
python -m src.run_planner
```

## Requirements

- Python 3.6+
- networkx
- matplotlib