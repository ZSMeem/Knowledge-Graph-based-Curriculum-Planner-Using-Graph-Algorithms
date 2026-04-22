# Curriculum Scheduling

A Python project for building a Knowledge Graph based Curriculum Planner using topological sorting and graph algorithms.

## Features

- Add courses with prerequisites
- Compute topological order for course scheduling
- Visualize the curriculum graph

## Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`

## Usage

```python
from src.curriculum_planner import CurriculumPlanner

planner = CurriculumPlanner()
planner.add_course("Math 101")
planner.add_course("Physics 101", ["Math 101"])
# Add more courses...

order = planner.get_topological_order()
print(order)

planner.visualize()
```

## Requirements

- Python 3.6+
- networkx
- matplotlib