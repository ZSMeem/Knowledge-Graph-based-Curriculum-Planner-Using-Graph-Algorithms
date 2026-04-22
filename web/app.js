async function loadGraph() {
  const response = await fetch('../data/curriculum.json');
  const data = await response.json();

  populateTable(data);

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
    width: '100%',
    height: '100%',
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
    network.fit();
  });

  displayCourseSequence(data);
}

function populateTable(data) {
  const tbody = document.querySelector('#curriculum-table tbody');
  tbody.innerHTML = '';

  data.courses.forEach(course => {
    const prereqs = data.prerequisites.filter(p => p.course === course.course_id).map(p => p.prerequisite).join(', ');
    const offered = data.offered.find(o => o.course === course.course_id)?.offered || 'N/A';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${course.course_id}</td>
      <td>${course.course_name}</td>
      <td>${course.type}</td>
      <td>${course.credits}</td>
      <td>${prereqs || 'None'}</td>
      <td>${offered}</td>
    `;
    tbody.appendChild(row);
  });
}

function displayCourseSequence(data) {
  const courseList = document.getElementById('course-list');
  courseList.innerHTML = '';

  if (data.topological_order && data.topological_order.length > 0) {
    data.topological_order.forEach(courseId => {
      const course = data.courses.find(c => c.course_id === courseId);
      const li = document.createElement('li');
      li.textContent = course ? `${course.course_id}: ${course.course_name}` : courseId;
      courseList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No topological order available.';
    courseList.appendChild(li);
  }
}

// Navigation
document.getElementById('curriculum-link').addEventListener('click', () => {
  document.getElementById('curriculum-section').style.display = 'block';
  document.getElementById('suggestion-section').style.display = 'none';
});

document.getElementById('suggestion-link').addEventListener('click', () => {
  document.getElementById('curriculum-section').style.display = 'none';
  document.getElementById('suggestion-section').style.display = 'block';
});

loadGraph().catch(error => console.error('Failed to load graph:', error));
