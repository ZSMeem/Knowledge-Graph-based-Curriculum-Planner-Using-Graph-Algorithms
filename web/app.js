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

  // Build a semester schedule
  const semesterSchedule = buildSemesterSchedule(data, filteredOrder, activeIds);

  // Display semester-wise schedule
  const semesterNames = ['Fall (Year 1)', 'Spring (Year 1)', 'Fall (Year 2)', 'Spring (Year 2)'];

  semesterNames.forEach((semesterName, index) => {
    const semesterCourses = semesterSchedule[index] || [];

    // Skip empty semesters
    if (semesterCourses.length === 0) return;

    // Create semester heading (without credits)
    const li = document.createElement('li');
    li.style.fontWeight = 'bold';
    li.style.marginTop = '10px';
    li.style.color = '#2b3e50';
    li.textContent = semesterName;
    courseList.appendChild(li);

    // List courses in this semester
    semesterCourses.forEach(courseId => {
      const course = data.courses.find(c => c.course_id === courseId);
      const subLi = document.createElement('li');
      subLi.style.marginLeft = '20px';
      subLi.style.color = '#555';
      subLi.style.display = 'flex';
      subLi.style.alignItems = 'center';
      subLi.style.gap = '8px';

      const courseText = course ? `${course.course_id}: ${course.course_name} (${course.credits} cr)` : courseId;
      subLi.textContent = courseText;

      // Add type badge
      if (course) {
        const badge = document.createElement('span');
        badge.style.fontSize = '11px';
        badge.style.fontWeight = 'bold';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '3px';
        badge.style.whiteSpace = 'nowrap';

        const isCore = course.type === 'core' || course.type === 'capstone';
        const isConcentrationRequired = selectedConcentration !== 'none' && 
          (course.concentrations || []).includes(selectedConcentration) && 
          !isCore;

        if (isCore) {
          badge.style.backgroundColor = '#ffcdd2';
          badge.style.color = '#c62828';
          badge.textContent = 'Core';
          subLi.appendChild(badge);
        } else if (isConcentrationRequired) {
          badge.style.backgroundColor = '#c8e6c9';
          badge.style.color = '#2e7d32';
          badge.textContent = 'Required';
          subLi.appendChild(badge);
        }
      }

      courseList.appendChild(subLi);
    });
  });
}

function buildSemesterSchedule(data, orderedCourses, activeIds) {
  const semesterSchedule = [[], [], [], []];
  const takenCourses = new Set();
  let semesterIndex = 0;

  // Map courses to their offered semesters
  const courseToSemesters = {};
  data.offered.forEach(offering => {
    if (!courseToSemesters[offering.course]) {
      courseToSemesters[offering.course] = offering.offered;
    }
  });

  // Map prerequisites
  const coursePrereqs = {};
  data.prerequisites.forEach(prereq => {
    if (!coursePrereqs[prereq.course]) {
      coursePrereqs[prereq.course] = [];
    }
    coursePrereqs[prereq.course].push(prereq.prerequisite);
  });

  const semesterCycle = ['Fall', 'Spring', 'Fall', 'Spring'];

  // Assign courses to semesters
  for (const courseId of orderedCourses) {
    if (!activeIds.has(courseId)) continue;

    const course = data.courses.find(c => c.course_id === courseId);
    if (!course) continue;

    // Check prerequisites are satisfied
    const prereqs = coursePrereqs[courseId] || [];
    const allPreqsMet = prereqs.every(p => takenCourses.has(p));
    if (!allPreqsMet) continue;

    // Find best semester for this course
    const offered = courseToSemesters[courseId] || '';
    let bestSemester = semesterIndex;

    // Try to match offered semester
    if (offered.includes(semesterCycle[semesterIndex % 4])) {
      bestSemester = semesterIndex;
    } else {
      // Find next matching semester
      for (let i = 1; i < 4; i++) {
        const checkSem = (semesterIndex + i) % 4;
        if (offered.includes(semesterCycle[checkSem]) || offered === '' || offered === 'All') {
          bestSemester = semesterIndex + i;
          break;
        }
      }
    }

    const targetSem = bestSemester % 4;
    if (targetSem < 4) {
      semesterSchedule[targetSem].push(courseId);
      takenCourses.add(courseId);

      // Move to next semester if needed
      if (bestSemester >= semesterIndex) {
        semesterIndex = bestSemester + 1;
      }
    }
  }

  return semesterSchedule;
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
