async function fetchCurriculumData() {
  const sources = ['/api/curriculum', '../data/curriculum.json', 'data/curriculum.json'];
  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        lastError = new Error(`Failed to load curriculum from ${source}: ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to fetch curriculum data');
}

let loadedData = null;
let selectedConcentration = 'none';

async function loadGraph() {
  try {
    const data = await fetchCurriculumData();
    loadedData = data;

    populateTable(data);
    populateConcentrationDropdown(data);
    renderNetwork(data);
    displayCourseSequence(data);
  } catch (error) {
    console.error('Failed to load curriculum data:', error);
    alert('Could not load curriculum data. Check server or file path.');
  }
}

function getFilteredCourses(data) {
  if (selectedConcentration === 'none') {
    return data.courses;
  }

  return data.courses.filter(course => {
    const isCore = course.type === 'core' || course.type === 'capstone';
    const hasNoConcentration = !course.concentrations || course.concentrations.length === 0;
    const matchesConcentration = (course.concentrations || []).includes(selectedConcentration);
    return isCore || hasNoConcentration || matchesConcentration;
  });
}

function renderNetwork(data) {
  const filteredCourses = getFilteredCourses(data);
  const visibleIds = new Set(filteredCourses.map(course => course.course_id));

  const nodes = filteredCourses.map(course => ({
    id: course.course_id,
    label: course.course_id,
    title: `${course.course_name}\n${course.type} (${course.credits} credits)`,
    shape: 'ellipse',
    color: '#90caf9',
    font: { color: '#1a237e' },
  }));

  const edges = [];

  data.prerequisites.forEach(entry => {
    if (entry.course && entry.prerequisite && visibleIds.has(entry.course) && visibleIds.has(entry.prerequisite)) {
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
    if (entry.source && entry.relation && entry.target && visibleIds.has(entry.source) && visibleIds.has(entry.target)) {
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

  new vis.Network(container, networkData, options);
}

function populateConcentrationDropdown(data) {
  const select = document.getElementById('concentration-select');
  select.innerHTML = '<option value="none">None</option>';

  const concentrations = new Set();
  data.courses.forEach(course => {
    const list = course.concentrations || [];
    list.forEach(c => concentrations.add(c));
  });

  const sorted = Array.from(concentrations).sort();
  sorted.forEach(concentration => {
    const option = document.createElement('option');
    option.value = concentration;
    option.textContent = concentration;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    selectedConcentration = select.value;
    if (loadedData) {
      renderNetwork(loadedData);
      displayCourseSequence(loadedData);
    }
  });
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
      <td>${(course.concentrations || []).join(', ') || 'None'}</td>
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

  const activeCourses = getFilteredCourses(data);
  const activeIds = new Set(activeCourses.map(course => course.course_id));
  const filteredOrder = data.topological_order.filter(courseId => activeIds.has(courseId));

  if (filteredOrder && filteredOrder.length > 0) {
    filteredOrder.forEach(courseId => {
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
