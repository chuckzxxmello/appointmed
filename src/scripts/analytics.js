import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initAdminNavProfile, getProfileModalHTML } from "./admin-shared.js";
import { auth, db } from "./firebase-config.js";

// Mount Modal HTML Container
document.body.insertAdjacentHTML('beforeend', getProfileModalHTML());
initAdminNavProfile(auth);

let chartInstances = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '../auth/login.html';
  } else {
    startAnalyticsListeners();
  }
});

function getPatientAppointmentsOnly(items) {
  return items.filter(item => {
    const email = (item.email || '').toLowerCase();
    const fName = (item.firstName || '').toLowerCase();
    const lName = (item.lastName || '').toLowerCase();
    const pName = (item.patientName || '').toLowerCase();
    const role = (item.role || '').toLowerCase();
    return role !== 'admin' && !email.includes('admin') && fName !== 'admin' && lName !== 'admin' && !pName.includes('admin');
  });
}

function startAnalyticsListeners() {
  // Real-time Appointment Snapshot Listener
  onSnapshot(collection(db, 'appointments'), (snapshot) => {
    const rawAppointments = snapshot.docs.map(doc => doc.data());
    const appointments = getPatientAppointmentsOnly(rawAppointments);
    updateKPICards(appointments);
    renderClinicCharts(appointments);
    updatePatientCareInsights(appointments);
  }, (error) => {
    console.warn("Analytics appointments listener error:", error);
  });

  // Real-time Users count listener
  onSnapshot(collection(db, 'users'), (usersSnap) => {
    const count = usersSnap.size || 0;
    const regUsersEl = document.getElementById('registeredUsersCount');
    if (regUsersEl) regUsersEl.textContent = `${count} Users`;
  }, (error) => {
    console.warn("Analytics users listener error:", error);
  });
}

// =====================================================================
// KPI CARDS - All computed from real Firestore appointment data
// =====================================================================
function updateKPICards(appointments) {
  const total = appointments.length;
  let confirmed = 0;
  let completed = 0;

  appointments.forEach(a => {
    const st = (a.appointmentStatus || '').toLowerCase();
    if (st === 'confirmed') confirmed++;
    if (st === 'completed' || st === 'finished') completed++;
  });

  // 1. Peak Booking Hours
  const hourBuckets = {};
  appointments.forEach(appt => {
    const timeStr = appt.appointmentTimeStart || appt.appointmentTime || '';
    if (timeStr) {
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (!isNaN(hour)) hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
    }
  });

  const peakHoursEl = document.getElementById('analyticsPeakHours');
  const peakBadge = document.getElementById('analyticsPeakBadge');
  const peakShare = document.getElementById('analyticsPeakShare');
  const peakPeriod = document.getElementById('analyticsPeakPeriod');

  const hourEntries = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1]);
  if (hourEntries.length > 0) {
    const peakHour = parseInt(hourEntries[0][0], 10);
    const peakCount = hourEntries[0][1];
    const peakPct = total > 0 ? Math.round((peakCount / total) * 100) : 0;
    const peakStart = formatHour(peakHour);
    const peakEnd = formatHour(peakHour + 2);

    if (peakHoursEl) peakHoursEl.textContent = `${peakStart} - ${peakEnd}`;
    if (peakBadge) {
      peakBadge.textContent = peakPct >= 40 ? 'High Demand' : peakPct >= 20 ? 'Moderate' : 'Low Volume';
    }
    if (peakShare) peakShare.textContent = `Peak Share: ${peakPct}% Daily`;
    if (peakPeriod) peakPeriod.textContent = peakHour < 12 ? 'Morning Peak' : peakHour < 17 ? 'Afternoon Peak' : 'Evening Peak';
  } else {
    if (peakHoursEl) peakHoursEl.textContent = 'No data yet';
    if (peakBadge) peakBadge.textContent = 'No Data';
    if (peakShare) peakShare.textContent = 'Peak Share: --';
    if (peakPeriod) peakPeriod.textContent = '--';
  }

  // 2. Avg Appointments per Month
  const avgEl = document.getElementById('avgAppointmentsValue');
  const monthlyTotal = document.getElementById('analyticsMonthlyTotal');
  const flowStatus = document.getElementById('analyticsFlowStatus');

  if (total > 0) {
    // Get unique months from appointment dates
    const months = new Set();
    appointments.forEach(a => {
      const d = a.appointmentDate || a.createdAt || '';
      if (d) {
        const monthKey = d.substring(0, 7); // "YYYY-MM"
        if (monthKey.length >= 7) months.add(monthKey);
      }
    });
    const monthCount = Math.max(months.size, 1);
    const avg = (total / monthCount).toFixed(1);
    if (avgEl) avgEl.textContent = `${avg} / mo`;
    if (monthlyTotal) monthlyTotal.textContent = `Total: ${total} appts`;
    if (flowStatus) flowStatus.textContent = total >= 5 ? 'Healthy Flow' : total >= 2 ? 'Growing' : 'Starting';
  } else {
    if (avgEl) avgEl.textContent = '0 / mo';
    if (monthlyTotal) monthlyTotal.textContent = 'Total: 0 appts';
    if (flowStatus) flowStatus.textContent = 'No Data';
  }

  // 3. Completed Therapy Sessions
  const completedEl = document.getElementById('statCompletedSessionsAnalytics');
  const completionRate = document.getElementById('analyticsCompletionRate');
  const completionStatus = document.getElementById('analyticsCompletionStatus');

  if (completedEl) completedEl.textContent = completed;
  if (total > 0) {
    const rate = Math.round((completed / total) * 100);
    if (completionRate) completionRate.textContent = `Completion Rate: ${rate}%`;
    if (completionStatus) completionStatus.textContent = rate >= 80 ? 'Excellent' : rate >= 50 ? 'Good' : rate > 0 ? 'In Progress' : 'Pending';
  } else {
    if (completionRate) completionRate.textContent = 'Completion Rate: --';
    if (completionStatus) completionStatus.textContent = '--';
  }

  // 4. Attendance Rate
  const attendanceEl = document.getElementById('appointmentAttendanceRate');
  if (attendanceEl) {
    if (total > 0) {
      const rate = Math.round(((confirmed + completed) / total) * 100);
      attendanceEl.textContent = `${rate}% Attendance`;
    } else {
      attendanceEl.textContent = 'No data';
    }
  }
}

// =====================================================================
// PATIENT CARE INSIGHTS - Session duration, attendance from Firestore
// =====================================================================
function updatePatientCareInsights(appointments) {
  const total = appointments.length;
  let confirmed = 0;
  let completed = 0;

  // Avg Duration from appointmentTimeStart/End
  let totalMinutes = 0;
  let durationCount = 0;

  appointments.forEach(appt => {
    const st = (appt.appointmentStatus || '').toLowerCase();
    if (st === 'confirmed') confirmed++;
    if (st === 'completed' || st === 'finished') completed++;

    if (appt.appointmentTimeStart && appt.appointmentTimeEnd) {
      const startMins = timeToMinutes(appt.appointmentTimeStart);
      const endMins = timeToMinutes(appt.appointmentTimeEnd);
      if (startMins !== null && endMins !== null && endMins > startMins) {
        totalMinutes += (endMins - startMins);
        durationCount++;
      }
    }
  });

  const avgDurEl = document.getElementById('analyticsAvgDuration');
  if (avgDurEl) {
    avgDurEl.textContent = durationCount > 0 ? `${Math.round(totalMinutes / durationCount)} Mins` : 'No data';
  }

  const attendRateEl = document.getElementById('analyticsAttendanceRate');
  if (attendRateEl) {
    if (total > 0) {
      const rate = Math.round(((confirmed + completed) / total) * 100);
      attendRateEl.textContent = `${rate}% Attendance`;
    } else {
      attendRateEl.textContent = 'No data';
    }
  }
}

// =====================================================================
// CHARTS - All driven by real Firestore appointment data
// =====================================================================
function renderClinicCharts(appointments) {
  // 1. Monthly Appointments Chart (from real appointment dates)
  const monthlyData = new Array(12).fill(0);
  appointments.forEach(a => {
    const dateStr = a.appointmentDate || a.createdAt || '';
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) monthlyData[monthIdx]++;
      }
    }
  });

  const ctxMonthly = document.getElementById('monthlyAvgChart')?.getContext('2d');
  if (ctxMonthly) {
    if (chartInstances.monthly) chartInstances.monthly.destroy();
    chartInstances.monthly = new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Appointments / Month',
          data: monthlyData,
          borderColor: '#1e3a8a',
          backgroundColor: 'rgba(30, 58, 138, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#1e3a8a'
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

  // 2. Therapy Services Breakdown (from real appointment types)
  const serviceCounts = {};
  appointments.forEach(a => {
    const t = (a.appointmentType || a.service || 'General Therapy').toUpperCase();
    if (t.includes('CONSULT')) serviceCounts['Consultation'] = (serviceCounts['Consultation'] || 0) + 1;
    else if (t.includes('PHYSICAL')) serviceCounts['Physical Therapy'] = (serviceCounts['Physical Therapy'] || 0) + 1;
    else if (t.includes('SPEECH')) serviceCounts['Speech Pathology'] = (serviceCounts['Speech Pathology'] || 0) + 1;
    else if (t.includes('OCCUPATIONAL')) serviceCounts['Occupational Therapy'] = (serviceCounts['Occupational Therapy'] || 0) + 1;
    else serviceCounts['Other Therapy'] = (serviceCounts['Other Therapy'] || 0) + 1;
  });

  const serviceLabels = Object.keys(serviceCounts);
  const serviceData = Object.values(serviceCounts);
  const serviceColors = ['#1e3a8a', '#d97706', '#059669', '#7c3aed', '#dc2626'];

  const ctxTypes = document.getElementById('typeDistChart')?.getContext('2d');
  if (ctxTypes) {
    if (chartInstances.types) chartInstances.types.destroy();
    chartInstances.types = new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: serviceLabels.length > 0 ? serviceLabels : ['No Data'],
        datasets: [{
          data: serviceData.length > 0 ? serviceData : [1],
          backgroundColor: serviceLabels.length > 0 ? serviceColors.slice(0, serviceLabels.length) : ['#e2e8f0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // 3. Peak Booking Hours Chart (from real appointment start times)
  const hourLabels = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
  const hourData = new Array(11).fill(0);
  appointments.forEach(a => {
    const timeStr = a.appointmentTimeStart || a.appointmentTime || '';
    if (timeStr) {
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (hour >= 7 && hour <= 17) hourData[hour - 7]++;
    }
  });

  const ctxPeak = document.getElementById('peakHoursChart')?.getContext('2d');
  if (ctxPeak) {
    if (chartInstances.peak) chartInstances.peak.destroy();
    chartInstances.peak = new Chart(ctxPeak, {
      type: 'bar',
      data: {
        labels: hourLabels,
        datasets: [{
          label: 'Patient Appointments',
          data: hourData,
          backgroundColor: '#3b82f6',
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

// =====================================================================
// UTILITY HELPERS
// =====================================================================
function formatHour(h) {
  const hour24 = ((h % 24) + 24) % 24;
  if (hour24 === 0) return '12 AM';
  if (hour24 === 12) return '12 PM';
  return hour24 < 12 ? `${hour24} AM` : `${hour24 - 12} PM`;
}

function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}
