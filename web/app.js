async function loadGraph() {
  const response = await fetch('../data/curriculum.json');
  const data = await response.json();

  const nodes = data.courses.map(course => ({
    id: course.course_id,
    label: course.course_id,
    title: `${course.course_name}\n${course.type} (${course.credits} credits)`,
    shape: 'ellipse',
    color: '#90caf9',
    font: { color: '#1a237e' },
  }));

  const edges = [];

  data.prerequisites.forEach(entry => {
    if (entry.course && entry.prerequisite) {
      edges.push({
        from: entry.prerequisite,
        to: entry.course,
        label: 'prerequisite',
        color: { color: '#1976d2' },
        arrows: 'to',
      });
    }
  });

  data.kg_edges.forEach(entry => {
    if (entry.source && entry.relation && entry.target) {
      edges.push({
        from: entry.source,
        to: entry.target,
        label: entry.relation,
        color: { color: '#43a047' },
        dashes: true,
        arrows: 'to',
      });
    }
  });

  const container = document.getElementById('network');
  const networkData = { nodes, edges };
  const options = {
    interaction: {
      hover: true,
      dragNodes: true,
      dragView: true,
      tooltipDelay: 100,
    },
    physics: {
      enabled: true,
      stabilization: {
        enabled: true,
        iterations: 200,
        updateInterval: 25,
        onlyDynamicEdges: false,
      },
      barnesHut: {
        gravitationalConstant: -2000,
        springLength: 200,
        springConstant: 0.04,
      },
    },
    edges: {
      font: { align: 'middle' },
      smooth: {
        type: 'cubicBezier',
        forceDirection: 'horizontal',
        roundness: 0.4,
      },
    },
    nodes: {
      borderWidth: 1,
      size: 30,
    },
  };

  const network = new vis.Network(container, networkData, options);

  network.once('stabilizationIterationsDone', () => {
    network.setOptions({ physics: { enabled: false } });
  });
}

loadGraph().catch(error => console.error('Failed to load graph:', error));
