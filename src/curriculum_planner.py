import networkx as nx
import matplotlib.pyplot as plt

class CurriculumPlanner:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_course(self, course_name, prerequisites=None):
        """
        Add a course to the curriculum graph.
        :param course_name: Name of the course
        :param prerequisites: List of prerequisite course names
        """
        self.graph.add_node(course_name)
        if prerequisites:
            for prereq in prerequisites:
                self.graph.add_edge(prereq, course_name)

    def get_topological_order(self):
        """
        Get the topological order of courses.
        :return: List of course names in topological order
        """
        try:
            return list(nx.topological_sort(self.graph))
        except nx.NetworkXError:
            raise ValueError("The curriculum graph has a cycle. Cannot determine a valid order.")

    def visualize(self, filename='curriculum_graph.png'):
        """
        Visualize the curriculum graph.
        :param filename: File to save the visualization
        """
        pos = nx.spring_layout(self.graph)
        nx.draw(self.graph, pos, with_labels=True, node_color='lightblue', node_size=2000, font_size=10, font_weight='bold')
        plt.title("Curriculum Knowledge Graph")
        plt.savefig(filename)
        plt.show()

# Example usage
if __name__ == "__main__":
    planner = CurriculumPlanner()
    planner.add_course("Math 101")
    planner.add_course("Physics 101", ["Math 101"])
    planner.add_course("CS 101", ["Math 101"])
    planner.add_course("CS 201", ["CS 101", "Physics 101"])

    print("Topological Order:", planner.get_topological_order())
    planner.visualize()