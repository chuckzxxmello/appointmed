import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initAdminNavProfile, getProfileModalHTML } from "./admin-shared.js";
import { auth, db } from "./firebase-config.js";

document.body.insertAdjacentHTML('beforeend', getProfileModalHTML());
initAdminNavProfile(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    initDevTelemetryListeners();
  } else {
    window.location.href = '../auth/login.html';
  }
});

function initDevTelemetryListeners() {
  let apptCount = 0;
  let userCount = 0;
  const latencyReadings = [];
  let collectionsActive = 0;

  // Measure real Firestore query latency for appointments
  const apptQueryStart = performance.now();
  onSnapshot(collection(db, 'appointments'), (apptsSnap) => {
    const queryTime = Math.round(performance.now() - apptQueryStart);
    latencyReadings.push(queryTime);
    apptCount = apptsSnap.size;
    collectionsActive = 2; // appointments + users
    updateDevTelemetryUI(apptCount, userCount, latencyReadings, collectionsActive);
  });

  // Measure real Firestore query latency for users
  const userQueryStart = performance.now();
  onSnapshot(collection(db, 'users'), (usersSnap) => {
    const queryTime = Math.round(performance.now() - userQueryStart);
    latencyReadings.push(queryTime);
    userCount = usersSnap.size;
    updateDevTelemetryUI(apptCount, userCount, latencyReadings, collectionsActive);
  });
}

function updateDevTelemetryUI(apptCount, userCount, latencyReadings, collectionsActive) {
  const totalDocs = apptCount + userCount;
  
  // KPI Card 1: Firestore Documents
  const docsEl = document.getElementById('devTotalDocs');
  const docsBadge = document.getElementById('devDocsBadge');
  const usersCountEl = document.getElementById('devUsersCount');
  const apptsCountEl = document.getElementById('devApptsCount');

  if (docsEl) docsEl.textContent = `${totalDocs} docs`;
  if (docsBadge) {
    docsBadge.textContent = totalDocs > 0 ? 'Live' : 'Empty';
    if (totalDocs > 0) {
      docsBadge.style.backgroundColor = '#dcfce7';
      docsBadge.style.color = '#15803d';
    }
  }
  if (usersCountEl) usersCountEl.textContent = `Users: ${userCount}`;
  if (apptsCountEl) apptsCountEl.textContent = `Appointments: ${apptCount}`;

  // KPI Card 2: Query Latency (measured from real performance.now())
  const latencyEl = document.getElementById('devQueryLatency');
  const latencyStatus = document.getElementById('devLatencyStatus');
  const latencyGrade = document.getElementById('devLatencyGrade');

  if (latencyReadings.length > 0) {
    const avgLatency = Math.round(latencyReadings.reduce((a, b) => a + b, 0) / latencyReadings.length);
    if (latencyEl) latencyEl.textContent = `${avgLatency} ms`;
    if (latencyStatus) latencyStatus.textContent = `Samples: ${latencyReadings.length}`;
    if (latencyGrade) {
      if (avgLatency < 100) { latencyGrade.textContent = 'Excellent'; latencyGrade.style.color = '#15803d'; }
      else if (avgLatency < 500) { latencyGrade.textContent = 'Good'; latencyGrade.style.color = '#b45309'; }
      else { latencyGrade.textContent = 'Slow'; latencyGrade.style.color = '#dc2626'; }
    }
  }

  // KPI Card 3: Active Collections
  const collectionEl = document.getElementById('devCollectionCount');
  if (collectionEl) collectionEl.textContent = `${collectionsActive} collections`;

  // Chart 1: Latency readings timeline
  const devLatencyCtx = document.getElementById('devLatencyChart')?.getContext('2d');
  if (devLatencyCtx) {
    if (window.devLatencyChartInstance) window.devLatencyChartInstance.destroy();

    const labels = latencyReadings.map((_, i) => `Query ${i + 1}`);
    window.devLatencyChartInstance = new Chart(devLatencyCtx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['No data'],
        datasets: [{
          label: 'Query Latency (ms)',
          data: latencyReadings.length > 0 ? latencyReadings : [0],
          borderColor: '#6b21a8',
          backgroundColor: 'rgba(107, 33, 168, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#6b21a8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'ms' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Chart 2: Live Document Count Throughput
  const devThroughputCtx = document.getElementById('devThroughputChart')?.getContext('2d');
  if (devThroughputCtx) {
    if (window.devThroughputChartInstance) window.devThroughputChartInstance.destroy();

    window.devThroughputChartInstance = new Chart(devThroughputCtx, {
      type: 'bar',
      data: {
        labels: ['Registered Users', 'Appointments', 'Total Firestore Docs'],
        datasets: [{
          label: 'Live Document Count',
          data: [userCount, apptCount, totalDocs],
          backgroundColor: ['#0284c7', '#059669', '#7c3aed'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}
