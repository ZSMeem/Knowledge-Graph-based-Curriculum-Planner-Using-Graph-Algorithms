import json
from src.curriculum_planner import CurriculumPlanner


def load_curriculum_from_json(path):
    with open(path, "r", encoding="utf-8") as jsonfile:
        data = json.load(jsonfile)

    planner = CurriculumPlanner()
    courses = {item["course_id"]: item for item in data.get("courses", []) if item.get("course_id")}
    offered = {item["course"]: item.get("offered") for item in data.get("offered", []) if item.get("course")}

    for course_id, attrs in courses.items():
        planner.add_course(
            course_id,
            name=attrs.get("course_name"),
            course_type=attrs.get("type"),
            credits=attrs.get("credits"),
            offered=offered.get(course_id),
        )

    for item in data.get("prerequisites", []):
        course = item.get("course")
        prereq = item.get("prerequisite")
        if course and prereq:
            planner.add_prerequisite(course, prereq)

    for item in data.get("kg_edges", []):
        source = item.get("source")
        relation = item.get("relation")
        target = item.get("target")
        if source and relation and target:
            planner.add_kg_edge(source, relation, target)

    return planner
