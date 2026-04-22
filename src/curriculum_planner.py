import networkx as nx
import matplotlib.pyplot as plt


class CurriculumPlanner:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.kg = nx.DiGraph()

    def add_course(self, course_id, name=None, course_type=None, credits=None, offered=None):
        """
        Add a course node to the planner.
        :param course_id: Course identifier
        :param name: Course name
        :param course_type: Course type (e.g. core, transition, capstone)
        :param credits: Credit value
        :param offered: Term offered (e.g. Fall, Spring)
        """
        attrs = {}
        if name:
            attrs["course_name"] = name
        if course_type:
            attrs["type"] = course_type
        if credits is not None:
            attrs["credits"] = credits
        if offered:
            attrs["offered"] = offered

        self.graph.add_node(course_id, **attrs)
        self.kg.add_node(course_id, **attrs)

    def add_prerequisite(self, course_id, prerequisite_id):
        """
        Add a prerequisite edge for scheduling.
        :param course_id: Course that requires the prerequisite
        :param prerequisite_id: Prerequisite course
        """
        self.graph.add_edge(prerequisite_id, course_id, relation="prerequisite")
        self.kg.add_edge(prerequisite_id, course_id, relation="prerequisite")

    def add_kg_edge(self, source, relation, target):
        """
        Add a general knowledge graph edge.
        :param source: Source node
        :param relation: Relation label
        :param target: Target node
        """
        self.kg.add_edge(source, target, relation=relation)

    def get_topological_order(self):
        """
        Get a valid course order based on prerequisite dependencies.
        :return: List of course ids in topological order
        """
        try:
            return list(nx.topological_sort(self.graph))
        except nx.NetworkXUnfeasible:
            raise ValueError("The curriculum graph has a cycle. Cannot determine a valid order.")

    def visualize(self, filename='curriculum_graph.png', show_kg=False, show=False):
        """
        Visualize the prerequisite graph or the full knowledge graph.
        :param filename: File to save the visualization
        :param show_kg: If True, visualize all KG edges; otherwise visualize only prerequisite edges
        :param show: If True, display the plot interactively after saving
        """
        graph = self.kg if show_kg else self.graph
        num_nodes = graph.number_of_nodes()
        figsize = (max(10, num_nodes * 0.8), max(8, num_nodes * 0.6))
        plt.figure(figsize=figsize)

        try:
            pos = nx.nx_agraph.graphviz_layout(graph, prog='dot')
        except Exception:
            k = 2.0 / (num_nodes ** 0.5) if num_nodes > 0 else 1.0
            pos = nx.spring_layout(graph, k=k, iterations=200)

        nx.draw_networkx_nodes(graph, pos, node_color='lightblue', node_size=2000)
        nx.draw_networkx_labels(graph, pos, font_size=10, font_weight='bold')
        nx.draw_networkx_edges(graph, pos, arrows=True)

        edge_labels = nx.get_edge_attributes(graph, 'relation')
        if edge_labels:
            nx.draw_networkx_edge_labels(graph, pos, edge_labels=edge_labels, font_color='gray')

        plt.title("Curriculum Knowledge Graph" if show_kg else "Curriculum Prerequisite Graph")
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(filename)
        if show:
            plt.show()
        plt.close()
