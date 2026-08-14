import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initAdminNavProfile, getProfileModalHTML } from "./admin-shared.js";
import { auth, db } from "./firebase-config.js";

// Mount Modal HTML Container
document.body.insertAdjacentHTML('beforeend', getProfileModalHTML());
initAdminNavProfile(auth);

let isListening = false;

onAuthStateChanged(auth, async (user) => {
  if (!user && !window.location.pathname.includes('login.html')) {
    window.location.href = '../auth/login.html';
    return;
  }

  if (user && !isListening) {
    isListening = true;
    startAdminHomeSnapshotListeners();
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

function startAdminHomeSnapshotListeners() {
  // Real-time appointment tracking metrics (Excluding Admin Staff Accounts)
  onSnapshot(collection(db, 'appointments'), (snapshot) => {
    const rawAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const patientAppointments = getPatientAppointmentsOnly(rawAppointments);
    
    const total = patientAppointments.length;
    let pending = 0;
    let confirmed = 0;
    let completed = 0;

    patientAppointments.forEach(app => {
      const st = (app.appointmentStatus || '').toLowerCase();
      if (st === 'pending') pending++;
      else if (st === 'confirmed') confirmed++;
      else if (st === 'completed' || st === 'finished') completed++;
    });

    const statTotal = document.getElementById('statTotalAppointments');
    const statPending = document.getElementById('statPendingAppointments');
    const badgeAppts = document.getElementById('badgeAppointments');
    const statCompletedCard = document.getElementById('statCompletedSessions');
    
    const stConfirmed = document.getElementById('statusConfirmedCount');
    const stPending = document.getElementById('statusPendingCount');
    const stCompleted = document.getElementById('statusCompletedCount');
    const lastUpdated = document.getElementById('lastUpdatedTimestamp');

    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (badgeAppts) badgeAppts.textContent = total;
    if (statCompletedCard) statCompletedCard.textContent = completed;
    
    if (stConfirmed) stConfirmed.textContent = confirmed;
    if (stPending) stPending.textContent = pending;
    if (stCompleted) stCompleted.textContent = completed;

    if (lastUpdated) lastUpdated.textContent = new Date().toLocaleString();

    // Compute real-time Clinic Booking Insights from appointment data
    computeBookingInsights(patientAppointments, total, confirmed, completed);

    // Render recent patient therapy appointments
    renderRecentAppointments(patientAppointments);
  }, (error) => {
    console.warn("Real-time appointments snapshot listener error:", error);
  });

  // Real-time Total Users count listener (Admin users ARE allowed to be included)
  onSnapshot(collection(db, 'users'), (usersSnap) => {
    const totalUsersCount = usersSnap.size || 0;
    const statUsers = document.getElementById('statTotalUsers');
    const badgeUsers = document.getElementById('badgeManageUsers');
    if (statUsers) statUsers.textContent = totalUsersCount;
    if (badgeUsers) badgeUsers.textContent = totalUsersCount;
  }, (error) => {
    console.warn("Real-time users snapshot listener error:", error);
  });
}

// =====================================================================
// REAL-TIME CLINIC BOOKING INSIGHTS (Computed from Live Firestore Data)
// =====================================================================
function computeBookingInsights(appointments, total, confirmed, completed) {
  // 1. Peak Booking Hours - computed from appointmentTimeStart
  const hourBuckets = {};
  appointments.forEach(appt => {
    const timeStr = appt.appointmentTimeStart || appt.appointmentTime || '';
    if (timeStr) {
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (!isNaN(hour)) {
        hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
      }
    }
  });

  const peakLabel = document.getElementById('peakHoursLabel');
  const peakBadge = document.getElementById('peakDemandBadge');
  const activeHours = document.getElementById('insightActiveHours');

  const hourEntries = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1]);
  if (hourEntries.length > 0) {
    const peakHour = parseInt(hourEntries[0][0], 10);
    const peakCount = hourEntries[0][1];
    const peakPct = total > 0 ? Math.round((peakCount / total) * 100) : 0;

    const peakStart = formatHour(peakHour);
    const peakEnd = formatHour(peakHour + 2);

    if (peakLabel) peakLabel.textContent = `Peak: ${peakStart} - ${peakEnd}`;
    if (peakBadge) {
      if (peakPct >= 40) {
        peakBadge.textContent = 'High Demand';
        peakBadge.style.backgroundColor = '#dcfce7';
        peakBadge.style.color = '#15803d';
      } else if (peakPct >= 20) {
        peakBadge.textContent = 'Moderate';
        peakBadge.style.backgroundColor = '#fef3c7';
        peakBadge.style.color = '#b45309';
      } else {
        peakBadge.textContent = 'Low Volume';
        peakBadge.style.backgroundColor = '#e0f2fe';
        peakBadge.style.color = '#0369a1';
      }
    }
    if (activeHours) activeHours.textContent = `${peakStart} - ${peakEnd} (${peakPct}%)`;
  } else {
    if (peakLabel) peakLabel.textContent = 'No booking data yet';
    if (peakBadge) { peakBadge.textContent = 'No Data'; peakBadge.style.backgroundColor = '#f1f5f9'; peakBadge.style.color = '#64748b'; }
    if (activeHours) activeHours.textContent = 'No data';
  }

  // 2. Top Requested Service - computed from appointmentType
  const serviceCounts = {};
  appointments.forEach(appt => {
    const svc = (appt.appointmentType || appt.service || 'General Therapy').trim();
    if (svc) serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
  });

  const topService = document.getElementById('insightTopService');
  const serviceEntries = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  if (topService) {
    topService.textContent = serviceEntries.length > 0
      ? toTitleCase(serviceEntries[0][0])
      : 'No data';
  }

  // 3. Attendance Rate - (confirmed + completed) / total
  const attendanceRate = document.getElementById('homeAttendanceRate');
  if (attendanceRate) {
    if (total > 0) {
      const rate = Math.round(((confirmed + completed) / total) * 100);
      attendanceRate.textContent = `${rate}% Attendance`;
    } else {
      attendanceRate.textContent = 'No data';
    }
  }

  // 4. Avg Therapy Session Duration - computed from appointmentTimeStart/End
  const avgDuration = document.getElementById('insightAvgDuration');
  if (avgDuration) {
    let totalMinutes = 0;
    let durationCount = 0;
    appointments.forEach(appt => {
      if (appt.appointmentTimeStart && appt.appointmentTimeEnd) {
        const startMins = timeToMinutes(appt.appointmentTimeStart);
        const endMins = timeToMinutes(appt.appointmentTimeEnd);
        if (startMins !== null && endMins !== null && endMins > startMins) {
          totalMinutes += (endMins - startMins);
          durationCount++;
        }
      }
    });
    if (durationCount > 0) {
      const avg = Math.round(totalMinutes / durationCount);
      avgDuration.textContent = `${avg} Minutes`;
    } else {
      avgDuration.textContent = 'No data';
    }
  }
}

function renderRecentAppointments(patientAppointments) {
  const recentContainer = document.getElementById('recentAppointmentsList');
  if (!recentContainer) return;

  if (patientAppointments.length === 0) {
    recentContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.875rem; padding: 1.5rem 0;">No patient therapy appointments found</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
  patientAppointments.slice(0, 5).forEach(item => {
    const stClass = `status-${(item.appointmentStatus || 'pending').toLowerCase()}`;
    const patientName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email?.split('@')[0] || 'Patient';
    
    html += `
      <div style="background-color: var(--bg-main); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 0.875rem; color: var(--text-main); display: block;">${escapeHtml(patientName)}</strong>
          <span style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(item.appointmentType || 'Therapy')} | ${escapeHtml(item.appointmentDate || 'No Date')}</span>
        </div>
        <span class="status-badge ${stClass}">${escapeHtml(item.appointmentStatus || 'Pending')}</span>
      </div>
    `;
  });
  html += '</div>';
  recentContainer.innerHTML = html;
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

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Refresh Action
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
