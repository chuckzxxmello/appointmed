import { signOut, onAuthStateChanged, sendEmailVerification, reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, doc, getDoc, setDoc, deleteDoc, query, where, onSnapshot, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "./ui-utils.js";

let currentUser = null;
let allUserAppointments = [];
let clinicAppointments = [];
let activeDashboardFilter = 'all';
let activeUserFilter = 'all';

// Calendar view type tracking per container ('month', 'week', 'day')
const calendarViewTypes = {
  userDashboardCalendarContainer: 'month',
  userCalendarContainer: 'month',
  clinicCalendarContainer: 'month'
};

// Calendar date state tracking
let clinicCurrentDate = new Date();
let clinicScheduleCurrentDate = new Date();
let userDashboardCurrentDate = new Date();

// --- 1. Dynamic Month / Week / Day Schedule Calendar Renderer ---
function renderCustomCalendar(containerId, currentDate, eventsList, isPersonalOnly = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const viewType = calendarViewTypes[containerId] || 'month';
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  let headerTitleText = "";
  if (viewType === 'month') {
    headerTitleText = `${monthNames[month]} ${year}`;
  } else if (viewType === 'week') {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startStr = `${monthNames[startOfWeek.getMonth()].slice(0, 3)} ${startOfWeek.getDate()}`;
    const endStr = `${monthNames[endOfWeek.getMonth()].slice(0, 3)} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    headerTitleText = `${startStr} – ${endStr}`;
  } else if (viewType === 'day') {
    headerTitleText = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  let html = `
    <div class="calendar-header-row">
      <h2 class="calendar-month-title">${headerTitleText}</h2>
      <div class="calendar-nav-buttons">
        <div class="cal-view-segmented-control">
          <button class="cal-view-btn ${viewType === 'month' ? 'active' : ''}" data-view="month" data-target="${containerId}">Month</button>
          <button class="cal-view-btn ${viewType === 'week' ? 'active' : ''}" data-view="week" data-target="${containerId}">Week</button>
          <button class="cal-view-btn ${viewType === 'day' ? 'active' : ''}" data-view="day" data-target="${containerId}">Day</button>
        </div>
        <button class="cal-btn prev-btn" data-target="${containerId}">&lt;</button>
        <button class="cal-btn next-btn" data-target="${containerId}">&gt;</button>
      </div>
    </div>
  `;

  // --- A. MONTH VIEW ---
  if (viewType === 'month') {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonthReal = (today.getFullYear() === year && today.getMonth() === month);

    html += `
      <div class="calendar-weekdays-grid">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div class="calendar-days-grid">
    `;

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      html += `<div class="cal-day cal-day-other"><span class="cal-day-num">${dayNum}</span></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonthReal && (day === today.getDate());
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayEvents = (eventsList || []).filter(item => item.appointmentDate === dateString);

      html += `<div class="cal-day ${isToday ? 'cal-day-today' : ''}" data-date="${dateString}" style="cursor: pointer;"><span class="cal-day-num">${day}</span>`;

      if (dayEvents.length > 0) {
        const displayEvts = dayEvents.slice(0, 3);
        const extraCount = dayEvents.length - 3;
        
        displayEvts.forEach(evt => {
          const stClass = `status-${(evt.appointmentStatus || 'pending').toLowerCase()}`;
          const serviceName = evt.appointmentType || evt.service || 'Therapy Session';
          const timeStart = evt.appointmentTimeStart || '09:00';
          const timeEnd = evt.appointmentTimeEnd || '10:00';

          html += `
            <div class="cal-evt-pill ${stClass} clickable-evt-pill"
                 data-id="${evt.id || ''}"
                 data-service="${escapeHtml(serviceName)}"
                 data-date="${escapeHtml(evt.appointmentDate || dateString)}"
                 data-time="${escapeHtml(timeStart)} - ${escapeHtml(timeEnd)}"
                 data-doctor="${escapeHtml(evt.doctor || 'CM Punk')}"
                 data-status="${escapeHtml(evt.appointmentStatus || 'Pending')}"
                 title="Click to view details (${escapeHtml(serviceName)})">
              ${escapeHtml(timeStart)} - ${escapeHtml(serviceName)}
            </div>
          `;
        });
        
        if (extraCount > 0) {
          html += `<div class="cal-evt-pill more-btn" style="background-color: transparent; color: var(--medical-blue-text); border: 1px dashed var(--medical-blue-text); text-align: center; display: block; font-size: 0.65rem; pointer-events: none;">+${extraCount} more...</div>`;
        }
      }
      html += `</div>`;
    }

    const totalCellsSoFar = startingDayOfWeek + daysInMonth;
    const nextDaysNeeded = (totalCellsSoFar > 35) ? (42 - totalCellsSoFar) : (35 - totalCellsSoFar);

    for (let d = 1; d <= nextDaysNeeded; d++) {
      html += `<div class="cal-day cal-day-other"><span class="cal-day-num">${d}</span></div>`;
    }
    html += `</div>`;
  }
  
  // --- B. WEEK VIEW ---
  else if (viewType === 'week') {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const today = new Date();

    html += `
      <div class="calendar-weekdays-grid">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div class="calendar-days-grid">
    `;

    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(startOfWeek);
      cellDate.setDate(startOfWeek.getDate() + i);
      const isToday = (today.toDateString() === cellDate.toDateString());
      const dateString = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
      const dayEvents = (eventsList || []).filter(item => item.appointmentDate === dateString);

      html += `<div class="cal-day ${isToday ? 'cal-day-today' : ''}" data-date="${dateString}" style="cursor: pointer;"><span class="cal-day-num">${cellDate.getDate()}</span>`;

      if (dayEvents.length > 0) {
        const displayEvts = dayEvents.slice(0, 3);
        const extraCount = dayEvents.length - 3;
        
        displayEvts.forEach(evt => {
          const stClass = `status-${(evt.appointmentStatus || 'pending').toLowerCase()}`;
          const serviceName = evt.appointmentType || evt.service || 'Therapy Session';
          const timeStart = evt.appointmentTimeStart || '09:00';
          const timeEnd = evt.appointmentTimeEnd || '10:00';

          html += `
            <div class="cal-evt-pill ${stClass} clickable-evt-pill"
                 data-id="${evt.id || ''}"
                 data-service="${escapeHtml(serviceName)}"
                 data-date="${escapeHtml(evt.appointmentDate || dateString)}"
                 data-time="${escapeHtml(timeStart)} - ${escapeHtml(timeEnd)}"
                 data-doctor="${escapeHtml(evt.doctor || 'CM Punk')}"
                 data-status="${escapeHtml(evt.appointmentStatus || 'Pending')}"
                 title="Click to view details">
              ${escapeHtml(timeStart)} - ${escapeHtml(serviceName)}
            </div>
          `;
        });
        
        if (extraCount > 0) {
          html += `<div class="cal-evt-pill more-btn" style="background-color: transparent; color: var(--medical-blue-text); border: 1px dashed var(--medical-blue-text); text-align: center; display: block; font-size: 0.65rem; pointer-events: none;">+${extraCount} more...</div>`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  // --- C. DAY / HOURLY SCHEDULE VIEW ---
  else if (viewType === 'day') {
    const activeDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayEvents = (eventsList || []).filter(item => item.appointmentDate === activeDateStr);

    const workingHours = [
      { start: "08:00", end: "09:00", display: "08:00 AM - 09:00 AM" },
      { start: "09:00", end: "10:00", display: "09:00 AM - 10:00 AM" },
      { start: "10:00", end: "11:00", display: "10:00 AM - 11:00 AM" },
      { start: "11:00", end: "12:00", display: "11:00 AM - 12:00 PM" },
      { start: "13:00", end: "14:00", display: "01:00 PM - 02:00 PM" },
      { start: "14:00", end: "15:00", display: "02:00 PM - 03:00 PM" },
      { start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
      { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
      { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" }
    ];

    html += `<div style="display: flex; flex-direction: column; gap: 0.65rem;">`;

    workingHours.forEach(slot => {
      const bookedAppt = dayEvents.find(evt => (evt.appointmentTimeStart || '').slice(0,2) === slot.start.slice(0,2));

      if (bookedAppt) {
        const stClass = `status-${(bookedAppt.appointmentStatus || 'pending').toLowerCase()}`;
        const serviceName = bookedAppt.appointmentType || bookedAppt.service || 'Therapy Session';
        html += `
          <div class="clickable-evt-pill"
               data-id="${bookedAppt.id || ''}"
               data-service="${escapeHtml(serviceName)}"
               data-date="${escapeHtml(activeDateStr)}"
               data-time="${escapeHtml(slot.display)}"
               data-doctor="${escapeHtml(bookedAppt.doctor || 'CM Punk')}"
               data-status="${escapeHtml(bookedAppt.appointmentStatus || 'Pending')}"
               style="background-color: #ffffff; border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);">
            <div>
              <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${escapeHtml(serviceName)}</strong>
              <span style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(slot.display)} | Specialist: ${escapeHtml(bookedAppt.doctor || 'CM Punk')}</span>
            </div>
            <span class="status-badge ${stClass}">${escapeHtml(bookedAppt.appointmentStatus || 'Pending')}</span>
          </div>
        `;
      } else {
        html += `
          <div style="background-color: var(--bg-main); border: 1px dashed var(--border-color); border-radius: 0.5rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.875rem; color: var(--text-main); display: block;">${escapeHtml(slot.display)}</strong>
              <span class="status-badge status-confirmed" style="font-size: 0.7rem; padding: 0.15rem 0.5rem; margin-top: 0.15rem; display: inline-block;">Available Free Time</span>
            </div>
            <button class="btn-secondary nav-tab" data-tab="book-appointment" style="font-size: 0.75rem; padding: 0.35rem 0.7rem;">Book</button>
          </div>
        `;
      }
    });

    html += `</div>`;
  }

  container.innerHTML = html;
}

// Global click delegation for calendar navigation, view switching, and event pop-up modal
document.addEventListener('click', (e) => {
  // 1. Calendar View Switcher (Month / Week / Day)
  const viewBtn = e.target.closest('.cal-view-btn');
  if (viewBtn) {
    const target = viewBtn.dataset.target;
    const view = viewBtn.dataset.view;
    if (target && view) {
      calendarViewTypes[target] = view;
      renderDashboardUserCalendar();
      renderClinicCalendar();
      renderClinicScheduleCalendar();
    }
    return;
  }

  // 2. Clickable Event Pill -> Open Detail Pop-Up Modal
  const evtPill = e.target.closest('.clickable-evt-pill');
  if (evtPill) {
    const apptId = evtPill.dataset.id;
    const allList = clinicAppointments.length > 0 ? clinicAppointments : allUserAppointments;
    const foundDoc = allList.find(a => String(a.id) === String(apptId)) || {
      appointmentType: evtPill.dataset.service,
      appointmentDate: evtPill.dataset.date,
      appointmentTimeStart: evtPill.dataset.time?.split(' - ')[0],
      appointmentTimeEnd: evtPill.dataset.time?.split(' - ')[1],
      doctor: evtPill.dataset.doctor,
      appointmentStatus: evtPill.dataset.status
    };

    openAppointmentDetailModal(foundDoc);
    return;
  }

  // 2.5 Clickable Calendar Day -> Show Schedule in Sidebar
  const calDay = e.target.closest('.cal-day');
  if (calDay && !evtPill) {
    const dateStr = calDay.dataset.date;
    if (dateStr) {
      document.querySelectorAll('.cal-day').forEach(d => {
        d.style.boxShadow = 'none';
      });
      calDay.style.boxShadow = 'inset 0 0 0 2px var(--medical-blue-text)';
      if (typeof renderSelectedDaySchedule === 'function') {
        renderSelectedDaySchedule(dateStr);
      }
    }
    return;
  }

  // 3. Prev/Next Navigation Buttons
  const prevBtn = e.target.closest('.prev-btn');
  const nextBtn = e.target.closest('.next-btn');

  if (prevBtn) {
    const target = prevBtn.dataset.target;
    const viewType = calendarViewTypes[target] || 'month';

    if (target === 'clinicCalendarContainer') {
      shiftCalendarDate(clinicCurrentDate, viewType, -1);
      renderClinicCalendar();
    } else if (target === 'userCalendarContainer') {
      shiftCalendarDate(clinicScheduleCurrentDate, viewType, -1);
      renderClinicScheduleCalendar();
    } else if (target === 'userDashboardCalendarContainer') {
      shiftCalendarDate(userDashboardCurrentDate, viewType, -1);
      renderDashboardUserCalendar();
    }
  } else if (nextBtn) {
    const target = nextBtn.dataset.target;
    const viewType = calendarViewTypes[target] || 'month';

    if (target === 'clinicCalendarContainer') {
      shiftCalendarDate(clinicCurrentDate, viewType, 1);
      renderClinicCalendar();
    } else if (target === 'userCalendarContainer') {
      shiftCalendarDate(clinicScheduleCurrentDate, viewType, 1);
      renderClinicScheduleCalendar();
    } else if (target === 'userDashboardCalendarContainer') {
      shiftCalendarDate(userDashboardCurrentDate, viewType, 1);
      renderDashboardUserCalendar();
    }
  }
});

function shiftCalendarDate(dateObj, viewType, direction) {
  if (viewType === 'month') {
    dateObj.setMonth(dateObj.getMonth() + direction);
  } else if (viewType === 'week') {
    dateObj.setDate(dateObj.getDate() + (direction * 7));
  } else if (viewType === 'day') {
    dateObj.setDate(dateObj.getDate() + direction);
  }
}

// --- Pop-Up Modal Open/Close Logic (Direct Firestore Data Binding & Privacy Safeguarded) ---
function openAppointmentDetailModal(docData) {
  const modal = document.getElementById('appointmentDetailModal');
  if (!modal) return;

  const stBadge = document.getElementById('modalApptStatusBadge');
  const serviceEl = document.getElementById('modalApptService');
  const dateEl = document.getElementById('modalApptDate');
  const timeEl = document.getElementById('modalApptTime');
  const doctorEl = document.getElementById('modalApptDoctor');

  const rawStatus = (docData.appointmentStatus || 'Pending').trim();
  const statusLower = rawStatus.toLowerCase();

  if (stBadge) {
    stBadge.textContent = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
    stBadge.className = `status-badge status-${statusLower}`;
  }

  if (serviceEl) {
    serviceEl.textContent = docData.appointmentType || docData.service || 'Therapy Session';
  }

  if (dateEl) {
    const dStr = docData.appointmentDate || '';
    const d = new Date(dStr);
    dateEl.textContent = isNaN(d.getTime()) 
      ? dStr 
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (timeEl) {
    const tStart = docData.appointmentTimeStart || '09:00';
    const tEnd = docData.appointmentTimeEnd || '10:00';
    timeEl.textContent = `${tStart} - ${tEnd}`;
  }

  if (doctorEl) {
    doctorEl.textContent = `${docData.doctor || 'Clinic Staff'} (Therapy Specialist)`;
  }

  // PRIVACY SAFEGUARD GUARANTEE: Patient/Client name and email are strictly EXCLUDED!
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
}

function closeAppointmentDetailModal() {
  const modal = document.getElementById('appointmentDetailModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }
}

// Close Modal Listeners
const closeModalBtn = document.getElementById('closeApptModalBtn');
const detailModal = document.getElementById('appointmentDetailModal');

if (closeModalBtn) closeModalBtn.addEventListener('click', closeAppointmentDetailModal);
if (detailModal) {
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeAppointmentDetailModal();
  });
}

function renderClinicCalendar() {
  const evts = clinicAppointments.length > 0 ? clinicAppointments : allUserAppointments;
  renderCustomCalendar(
    'clinicCalendarContainer',
    clinicCurrentDate,
    evts,
    false
  );
}

function renderClinicScheduleCalendar() {
  const base = clinicAppointments.length > 0 ? clinicAppointments : allUserAppointments;
  const filtered = filterAppointmentsByStatus(base, activeUserFilter);
  renderCustomCalendar(
    'userCalendarContainer',
    clinicScheduleCurrentDate,
    filtered,
    false
  );
}

function renderDashboardUserCalendar() {
  renderCustomCalendar(
    'userDashboardCalendarContainer',
    userDashboardCurrentDate,
    allUserAppointments,
    true
  );
}

// --- 2. Tab Navigation System ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  const profileMenu = document.getElementById('profileDropdownMenu');
  if (profileMenu) profileMenu.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  const tabTarget = e.target.closest('.nav-tab');
  if (tabTarget && tabTarget.dataset.tab) {
    e.preventDefault();
    switchTab(tabTarget.dataset.tab);
  }
});

// --- 3. Profile Dropdown Popover Toggle ---
const profileBtn = document.getElementById('profileDropdownBtn');
const profileMenu = document.getElementById('profileDropdownMenu');

if (profileBtn && profileMenu) {
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('hidden');
    profileBtn.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
      profileMenu.classList.add('hidden');
      profileBtn.classList.remove('active');
    }
  });
}

// --- 4. Rule-Compliant Firestore Real-Time Subscriptions ---
function listenToUserAppointments(user) {
  if (!user || !user.email) return;

  const q = query(collection(db, 'appointments'), where("email", "==", user.email));
  
  onSnapshot(q, (snapshot) => {
    allUserAppointments = [];
    snapshot.forEach(docSnap => {
      allUserAppointments.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (clinicAppointments.length === 0) {
      clinicAppointments = [...allUserAppointments];
    }

    renderDashboardAppointments();
    renderDashboardUserCalendar();
    renderClinicCalendar();
    renderClinicScheduleCalendar();
    updateClinicFilterCountBadges();
    renderAvailableClinicSlots();
  }, (error) => {
    console.error("Error subscribing to user appointments:", error);
  });
}

function updateClinicFilterCountBadges() {
  const base = clinicAppointments.length > 0 ? clinicAppointments : allUserAppointments;
  const counts = { all: base.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  
  base.forEach(item => {
    const st = (item.appointmentStatus || '').toLowerCase();
    if (counts[st] !== undefined) counts[st]++;
  });

  for (const [key, val] of Object.entries(counts)) {
    const badge = document.getElementById(`count-${key}`);
    if (badge) badge.textContent = val;
  }
}

function listenToClinicAppointments() {
  onSnapshot(collection(db, 'appointments'), (snapshot) => {
    clinicAppointments = [];
    snapshot.forEach(docSnap => {
      clinicAppointments.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderClinicCalendar();
    renderClinicScheduleCalendar();
    updateClinicFilterCountBadges();
    renderAvailableClinicSlots();
  }, (error) => {
    console.log("Clinic full schedule subscription notice (rule scoped to user appointments):", error.code);
    clinicAppointments = [...allUserAppointments];
    renderClinicCalendar();
    renderClinicScheduleCalendar();
    updateClinicFilterCountBadges();
    renderAvailableClinicSlots();
  });
}

function filterAppointmentsByStatus(items, filter) {
  if (filter === 'all') return items;
  return items.filter(item => (item.appointmentStatus || '').toLowerCase() === filter);
}

// --- 5. Render Dashboard "All Appointments" Section ---
function renderDashboardAppointments() {
  const container = document.getElementById('allAppointmentsContainer');
  if (!container) return;
  const filtered = filterAppointmentsByStatus(allUserAppointments, activeDashboardFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h3>No appointments found</h3>
        <p>You haven't scheduled any ${activeDashboardFilter !== 'all' ? activeDashboardFilter : ''} appointments yet</p>
        <button class="btn-primary nav-tab" data-tab="book-appointment">
          Book Your First Appointment
        </button>
      </div>
    `;
    return;
  }

  let html = '<div class="appointments-list">';
  filtered.forEach(item => {
    const d = item.appointmentDate ? new Date(item.appointmentDate) : new Date();
    const day = isNaN(d.getDate()) ? '--' : d.getDate();
    const month = isNaN(d.getMonth()) ? 'MMM' : d.toLocaleString('default', { month: 'short' });
    const stText = item.appointmentStatus || 'Pending';
    const statusClass = `status-${stText.toLowerCase()}`;

    html += `
      <div class="appointment-row-card">
        <div class="date-badge">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <div class="appt-details">
          <h4>${escapeHtml(item.appointmentType || item.service || 'Therapy Consultation')}</h4>
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${escapeHtml(item.appointmentTimeStart || '09:00')} - ${escapeHtml(item.appointmentTimeEnd || '10:00')} | Specialist: ${escapeHtml(item.doctor || 'CM Punk')}
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="status-badge ${statusClass}">${escapeHtml(stText)}</span>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// Filter listeners for Dashboard Filter Chips
document.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const filter = e.target.dataset.filter;
    if (!filter) return;
    document.querySelectorAll('.filter-chip[data-filter]').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeDashboardFilter = filter;
    renderDashboardAppointments();
  });
});

// Filter listeners for Sidebar Buttons
document.querySelectorAll('.btn-filter[data-user-filter]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('.btn-filter');
    if (!targetBtn) return;
    const filter = targetBtn.dataset.userFilter;
    if (!filter) return;

    document.querySelectorAll('.btn-filter[data-user-filter]').forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');
    activeUserFilter = filter;
    renderClinicScheduleCalendar();
  });
});

// --- 6. Render Available Open Free Slots (Working Hours 08:00 - 18:00 Only) ---
function renderAvailableClinicSlots() {
  const container = document.getElementById('upcomingListContainer');
  if (!container) return;

  // STRICT CLINIC WORKING HOURS (08:00 AM to 06:00 PM) - Pure Free Time Windows (AM/PM)
  const workingHoursSlots = [
    { start: "08:00", end: "09:00", display: "08:00 AM - 09:00 AM" },
    { start: "09:00", end: "10:00", display: "09:00 AM - 10:00 AM" },
    { start: "10:00", end: "11:00", display: "10:00 AM - 11:00 AM" },
    { start: "11:00", end: "12:00", display: "11:00 AM - 12:00 PM" },
    { start: "13:00", end: "14:00", display: "01:00 PM - 02:00 PM" },
    { start: "14:00", end: "15:00", display: "02:00 PM - 03:00 PM" },
    { start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
    { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
    { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" }
  ];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const bookedTimes = new Set();
  const apptsList = clinicAppointments.length > 0 ? clinicAppointments : allUserAppointments;

  apptsList.forEach(item => {
    if (item.appointmentDate === todayStr && item.appointmentTimeStart) {
      bookedTimes.add(item.appointmentTimeStart);
    }
  });

  let html = '<div style="display: flex; flex-direction: column; gap: 0.65rem;">';
  let freeSlotsFound = 0;

  workingHoursSlots.forEach(slot => {
    const isBooked = bookedTimes.has(slot.start);
    if (!isBooked) {
      freeSlotsFound++;
      html += `
        <div style="background-color: var(--bg-main); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 0.75rem 0.85rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.875rem; color: var(--text-main); display: block;">${escapeHtml(slot.display)}</strong>
            <span class="status-badge status-confirmed" style="font-size: 0.7rem; padding: 0.15rem 0.5rem; margin-top: 0.2rem; display: inline-block;">Free Slot</span>
          </div>
          <button class="btn-secondary nav-tab" data-tab="book-appointment" style="font-size: 0.75rem; padding: 0.35rem 0.7rem;">Book</button>
        </div>
      `;
    }
  });

  if (freeSlotsFound === 0) {
    html = '<p style="font-size: 0.825rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">All clinic slots for today are fully booked.</p>';
  } else {
    html += '</div>';
  }

  container.innerHTML = html;
}



// --- 7. FAQ English / Tagalog Switcher ---
const userFaqDictionary = {
  eng: {
    subtitle: "Quick answers to common questions",
    items: [
      {
        q: "How do I book an appointment?",
        a: "You can view clinic schedule availability on the \"Set An Appointment\" tab, then contact our clinic directly via phone or Facebook Messenger to reserve your session."
      },
      {
        q: "What should I bring to my appointment?",
        a: "Please bring a valid ID, any relevant medical records, developmental evaluations, or physician referrals for your initial consultation."
      },
      {
        q: "Can I reschedule or cancel my appointment?",
        a: "Yes. To reschedule or cancel your session, please notify our clinic staff at least 24 hours in advance so we can adjust the schedule."
      },
      {
        q: "How long is each therapy session?",
        a: "Standard therapy sessions typically last 45 to 60 minutes, tailored to your child's individualized treatment plan and developmental goals."
      }
    ]
  },
  fil: {
    subtitle: "Mga sagot sa karaniwang tanong tungkol sa aming therapy center",
    items: [
      {
        q: "Paano po mag-book ng appointment?",
        a: "Pwede ninyong i-check ang available clinic schedule sa \"Set An Appointment\" tab, tapos i-contact lang ang aming clinic staff sa phone o Facebook Messenger para ma-reserve ang inyong session."
      },
      {
        q: "Ano ang dapat dalhin sa appointment?",
        a: "Magdala lamang po ng valid ID, mga medical records, previous developmental evaluations, o referral galing sa inyong doktor para sa initial consultation."
      },
      {
        q: "Pwede po ba mag-reschedule o mag-cancel?",
        a: "Opo, pwede po. Paki-inform lang po ang aming clinic staff at least 24 hours bago ang inyong appointment para maayos po natin ang schedule."
      },
      {
        q: "Gaano po katagal ang bawat therapy session?",
        a: "Ang bawat therapy session ay karaniwang tumatagal ng 45 hanggang 60 minutes, depende sa individualized treatment plan at developmental goals ng inyong anak."
      }
    ]
  }
};

const userFaqLangToggle = document.getElementById('userFaqLangToggle');
const userFaqSubtitle = document.getElementById('userFaqSubtitle');
const userFaqGrid = document.getElementById('userFaqGrid');

if (userFaqLangToggle && userFaqGrid) {
  userFaqLangToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;

    const lang = btn.dataset.lang;
    if (!userFaqDictionary[lang]) return;

    userFaqLangToggle.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const data = userFaqDictionary[lang];
    if (userFaqSubtitle) userFaqSubtitle.textContent = data.subtitle;

    let html = '';
    data.items.forEach(item => {
      html += `
        <div class="faq-card">
          <h4>${escapeHtml(item.q)}</h4>
          <p>${escapeHtml(item.a)}</p>
        </div>
      `;
    });
    userFaqGrid.innerHTML = html;
  });
}

// --- 8. Handle Profile Form Update & Save ---
const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    const fName = document.getElementById('firstNameInput')?.value.trim() || '';
    const lName = document.getElementById('lastNameInput')?.value.trim() || '';
    const mName = document.getElementById('middleNameInput')?.value.trim() || '';
    const phone = document.getElementById('phoneInput')?.value.trim() || '';
    const age = document.getElementById('ageInput')?.value.trim() || '';
    const address = document.getElementById('addressInput')?.value.trim() || '';
    const facebook = document.getElementById('facebookInput')?.value.trim() || '';

    const data = {
      uid: currentUser.uid,
      email: currentUser.email,
      firstName: fName,
      lastName: lName,
      middleName: mName,
      phone: phone,
      facebook: facebook,
      age: age,
      address: address,
      updatedAt: new Date().toISOString()
    };

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, data, { merge: true });
      
      // Update local data for badges without refresh
      if (window.currentUserData) {
        window.currentUserData.phone = phone;
        window.currentUserData.facebook = facebook;
        showToast("Profile updated successfully!");
        window.location.reload();
      } else {
        showToast("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error saving user profile:", err);
      showToast("Failed to update profile: " + err.message, 'error');
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Update Profile'; }
    }
  });
}

// --- 9. Handle Email Verification Button ---
const resendVerifyBtn = document.getElementById('verifyBtn');
if (resendVerifyBtn) {
  resendVerifyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (currentUser.emailVerified) {
      if (window.currentUserData && window.currentUserData.adminUnverified) {
        showToast("Your account was manually unverified by an administrator. Please contact support to restore your verification status.", 'error');
      } else {
        showToast("Your email address is already verified!", 'info');
      }
      return;
    }

    const lastSent = localStorage.getItem('lastVerifyRequestTime');
    const now = Date.now();
    if (lastSent && (now - parseInt(lastSent)) < 60000) {
      const remaining = Math.ceil((60000 - (now - parseInt(lastSent))) / 1000);
      showToast(`For your security, please wait ${remaining} seconds before requesting another verification link.`, 'warning');
      return;
    }

    try {
      await sendEmailVerification(currentUser);
      localStorage.setItem('lastVerifyRequestTime', Date.now().toString());
      showToast(`Verification email sent to ${currentUser.email}! Please check your inbox and spam folder (Gmail users: search "in:spam"), then click the link and refresh this page.`);
    } catch (err) {
      console.error("Error sending verification email:", err);
      if (err.code === 'auth/too-many-requests') {
        showToast("Too many verification requests. Please check your email inbox or wait a few minutes before trying again.", 'warning');
      } else {
        showToast("Failed to send verification email: " + err.message, 'error');
      }
    }
  });
}

// --- 10. Sign Out Button ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
      window.location.href = 'login.html';
    });
  });
}

// --- 10.5 Permanent Account Deletion ---
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const deleteAccountModal = document.getElementById('deleteAccountModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteAccountReauthSection = document.getElementById('deleteAccountReauthSection');
const deleteAccountPasswordInput = document.getElementById('deleteAccountPassword');
const deleteAccountStatus = document.getElementById('deleteAccountStatus');

function openDeleteModal() {
  if (deleteAccountModal) {
    deleteAccountModal.style.display = 'flex';
    deleteAccountModal.classList.remove('hidden');
    if (deleteAccountStatus) deleteAccountStatus.textContent = '';
    
    // Safety check: force password entry by default for email users
    const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
    if (deleteAccountReauthSection) {
      deleteAccountReauthSection.style.display = isGoogleUser ? 'none' : 'block';
    }
    if (deleteAccountPasswordInput) deleteAccountPasswordInput.value = '';
  }
}

function closeDeleteModal() {
  if (deleteAccountModal) {
    deleteAccountModal.style.display = 'none';
    deleteAccountModal.classList.add('hidden');
  }
}

if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', openDeleteModal);
if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

async function purgeUserDataCompletely(user) {
  if (!user) return;
  const userEmail = (user.email || '').toLowerCase().trim();
  const userUid = user.uid;

  // 1. Delete user's owned appointments from Firestore 'appointments' collection
  try {
    const allApptsSnap = await getDocs(collection(db, 'appointments'));
    for (const docSnap of allApptsSnap.docs) {
      const data = docSnap.data();
      const apptEmail = (data.email || '').toLowerCase().trim();
      const apptUid = data.uid || data.userId;

      if ((userEmail && apptEmail === userEmail) || (userUid && apptUid === userUid)) {
        try {
          await deleteDoc(docSnap.ref);
        } catch (err) {
          console.warn("Notice deleting appointment record:", docSnap.id, err);
        }
      }
    }
  } catch (err) {
    console.warn("Notice during appointment wipeout:", err);
  }

  // 2. Delete all patient's user documents from Firestore 'users' collection (including fragments matching email)
  try {
    const allUsersSnap = await getDocs(collection(db, 'users'));
    for (const docSnap of allUsersSnap.docs) {
      const data = docSnap.data();
      const docEmail = (data.email || '').toLowerCase().trim();
      const docUid = docSnap.id || data.uid;

      if (docUid === userUid || (userEmail && docEmail === userEmail)) {
        try {
          await deleteDoc(docSnap.ref);
          console.log(`Successfully deleted user document users/${docSnap.id}`);
        } catch (err) {
          console.warn("Notice deleting user document:", docSnap.id, err);
        }
      }
    }
  } catch (err) {
    console.warn("Notice during user document wipeout:", err);
  }
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentUser) return;
    
    const isGoogleUser = currentUser.providerData.some(p => p.providerId === 'google.com');
    const password = deleteAccountPasswordInput?.value;

    if (!isGoogleUser && !password) {
      if (deleteAccountStatus) { 
        deleteAccountStatus.textContent = 'Please enter your password to confirm deletion.'; 
        deleteAccountStatus.style.color = '#dc2626'; 
      }
      return;
    }

    confirmDeleteBtn.disabled = true;
    if (deleteAccountStatus) { 
      deleteAccountStatus.textContent = 'Verifying security credentials...'; 
      deleteAccountStatus.style.color = '#0284c7'; 
    }

    try {
      // 1. Re-authenticate FIRST before touching any data!
      if (isGoogleUser) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }

      // 2. Credentials verified. Now safely purge data.
      if (deleteAccountStatus) {
        deleteAccountStatus.textContent = 'Deleting your account and all associated data...';
      }
      await purgeUserDataCompletely(currentUser);

      // 3. Delete Firebase Auth user
      await currentUser.delete();
      showToast("Your account and all associated data have been permanently deleted.");
      setTimeout(() => { window.location.href = 'login.html'; }, 2000);

    } catch (err) {
      console.error("Account deletion error:", err);
      confirmDeleteBtn.disabled = false;
      
      if (deleteAccountStatus) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          deleteAccountStatus.textContent = 'Incorrect password. Please try again.';
        } else if (err.code === 'auth/popup-closed-by-user') {
          deleteAccountStatus.textContent = 'Google sign-in was cancelled. Cannot delete account.';
        } else {
          deleteAccountStatus.textContent = 'Failed to delete account: ' + err.message;
        }
        deleteAccountStatus.style.color = '#dc2626';
      }
    }
  });
}

// --- 11. Firebase Auth State Observer ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try { await user.reload(); } catch (e) { /* ignore reload errors */ }
    currentUser = auth.currentUser || user;
    let isEmailVerified = false;

    const dropdownEmailDisplay = document.getElementById('dropdownEmail');
    const dropdownFullName = document.getElementById('dropdownFullName');
    const profileFullNameDisplay = document.getElementById('profileFullNameDisplay');
    const headerUserName = document.getElementById('headerUserName');
    const navAvatarCircle = document.getElementById('navAvatarCircle');
    const profileEmailInput = document.getElementById('profileEmailInput');
    const profileEmailDisplay = document.getElementById('profileEmailDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const profileAvatarLg = document.getElementById('profileAvatarLg');

    // 1. Immediate UI Hydration from Auth profile
    const email = currentUser.email || '';
    const emailUsername = email ? email.split('@')[0] : 'Patient';
    const authDisplayName = currentUser.displayName || emailUsername;
    const initial = authDisplayName.charAt(0).toUpperCase();

    if (dropdownEmailDisplay) dropdownEmailDisplay.textContent = email;
    if (profileEmailDisplay) profileEmailDisplay.textContent = email;
    if (profileEmailInput) profileEmailInput.value = email;

    if (dropdownFullName) dropdownFullName.textContent = authDisplayName;
    if (profileFullNameDisplay) profileFullNameDisplay.textContent = authDisplayName;
    if (headerUserName) headerUserName.textContent = authDisplayName.split(' ')[0];
    if (welcomeUserName) welcomeUserName.textContent = authDisplayName.split(' ')[0];
    if (navAvatarCircle) navAvatarCircle.textContent = initial;
    if (profileAvatarLg) profileAvatarLg.textContent = initial;

    // 2. Load / Auto-Create Firestore User Document & Sync Email Verification
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();

        window.currentUserData = data; // store it for the verify button handler

        // STRICT RULE: Verification status relies on Firestore data.emailVerified === true
        // However, if Auth is verified and the admin hasn't explicitly unverified them, sync to Firestore
        if (data.emailVerified === true) {
          isEmailVerified = true;
        } else if (currentUser.emailVerified === true && !data.adminUnverified) {
          try {
             await setDoc(userDocRef, { emailVerified: true }, { merge: true });
             isEmailVerified = true;
             data.emailVerified = true;
          } catch (e) {
             console.error("Failed to sync email verification status", e);
             isEmailVerified = false;
          }
        } else {
          isEmailVerified = false;
        }

        const fNameInput = document.getElementById('firstNameInput');
        const lNameInput = document.getElementById('lastNameInput');
        const mNameInput = document.getElementById('middleNameInput');
        const phoneInput = document.getElementById('phoneInput');
        const ageInput = document.getElementById('ageInput');
        const addressInput = document.getElementById('addressInput');
        const facebookInput = document.getElementById('facebookInput');

        if (fNameInput) fNameInput.value = data.firstName || (currentUser.displayName ? currentUser.displayName.split(' ')[0] : '');
        if (lNameInput) lNameInput.value = data.lastName || (currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : '');
        if (mNameInput) mNameInput.value = data.middleName || '';
        if (phoneInput) phoneInput.value = data.phone || '';
        if (ageInput) ageInput.value = data.age || '';
        if (addressInput) addressInput.value = data.address || '';
        if (facebookInput) {
          facebookInput.value = data.facebook || '';
        }

        const firstName = data.firstName || (currentUser.displayName ? currentUser.displayName.split(' ')[0] : '');
        const lastName = data.lastName || (currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : '');
        const fullName = `${firstName} ${lastName}`.trim() || authDisplayName;

        if (fullName) {
          if (dropdownFullName) dropdownFullName.textContent = fullName;
          if (profileFullNameDisplay) profileFullNameDisplay.textContent = fullName;
          if (headerUserName) headerUserName.textContent = firstName || emailUsername;
          if (welcomeUserName) welcomeUserName.textContent = firstName || emailUsername;
          const userInitial = (firstName || authDisplayName).charAt(0).toUpperCase();
          if (navAvatarCircle) navAvatarCircle.textContent = userInitial;
          if (profileAvatarLg) profileAvatarLg.textContent = userInitial;
        }

        const memberSinceEl = document.getElementById('profileMemberSince');
        if (memberSinceEl) {
          if (data.createdAt) {
            const createDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            memberSinceEl.textContent = `Member since ${createDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
          } else if (currentUser.metadata && currentUser.metadata.creationTime) {
            const authDate = new Date(currentUser.metadata.creationTime);
            memberSinceEl.textContent = `Member since ${authDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
          }
        }
      } else {
        // Auto-create document for first time user with emailVerified status explicitly set to false
        const parts = (currentUser.displayName || '').split(' ');
        const fName = parts[0] || '';
        const lName = parts.slice(1).join(' ') || '';

        const fNameInput = document.getElementById('firstNameInput');
        const lNameInput = document.getElementById('lastNameInput');
        if (fNameInput) fNameInput.value = fName;
        if (lNameInput) lNameInput.value = lName;

        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'patient',
          firstName: fName,
          lastName: lName,
          emailVerified: false,
          createdAt: new Date().toISOString()
        }, { merge: true });

        const memberSinceEl = document.getElementById('profileMemberSince');
        if (memberSinceEl && currentUser.metadata && currentUser.metadata.creationTime) {
          const authDate = new Date(currentUser.metadata.creationTime);
          memberSinceEl.textContent = `Member since ${authDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }

    // 3. Apply Verification UI Badges & Action Button State
    const profileVerifiedStatus = document.getElementById('profileVerifiedStatus');
    const profileFormEmailNote = document.getElementById('profileFormEmailNote');
    const emailVerifiedBadge = document.getElementById('emailVerifiedBadge');

    const hasPhone = window.currentUserData && window.currentUserData.phone && window.currentUserData.phone.trim() !== '';
    const hasFb = window.currentUserData && window.currentUserData.facebook && window.currentUserData.facebook.trim() !== '';
    const isFullyVerified = isEmailVerified && hasPhone && hasFb;

    if (isFullyVerified) {
      if (profileVerifiedStatus) {
        profileVerifiedStatus.textContent = "Fully Verified";
        profileVerifiedStatus.className = "status-badge status-confirmed";
      }
      if (emailVerifiedBadge) {
        emailVerifiedBadge.textContent = "Verified";
        emailVerifiedBadge.className = "status-badge status-confirmed";
      }
      if (profileFormEmailNote) { profileFormEmailNote.textContent = "Fully Verified Account"; profileFormEmailNote.style.color = '#15803d'; }
      if (resendVerifyBtn) resendVerifyBtn.style.display = "none";
    } else if (isEmailVerified) {
      if (profileVerifiedStatus) {
        profileVerifiedStatus.textContent = "Unverified";
        profileVerifiedStatus.className = "status-badge status-pending";
        profileVerifiedStatus.style.backgroundColor = '#fef3c7';
        profileVerifiedStatus.style.color = '#d97706';
      }
      if (emailVerifiedBadge) {
        emailVerifiedBadge.textContent = "Unverified";
        emailVerifiedBadge.className = "status-badge status-pending";
        emailVerifiedBadge.style.backgroundColor = '#fef3c7';
        emailVerifiedBadge.style.color = '#d97706';
      }
      if (profileFormEmailNote) { profileFormEmailNote.textContent = "Email Verified. Please complete Phone and Facebook account details to fully verify account"; profileFormEmailNote.style.color = '#d97706'; }
      if (resendVerifyBtn) resendVerifyBtn.style.display = "none";
    } else {
      if (profileVerifiedStatus) {
        profileVerifiedStatus.textContent = "Unverified Email";
        profileVerifiedStatus.className = "status-badge status-pending";
      }
      if (emailVerifiedBadge) {
        emailVerifiedBadge.textContent = "Unverified";
        emailVerifiedBadge.className = "status-badge status-pending";
      }
      if (profileFormEmailNote) { profileFormEmailNote.textContent = "Email Not Verified. Please click button below to verify."; profileFormEmailNote.style.color = '#b45309'; }
      if (resendVerifyBtn) resendVerifyBtn.style.display = "inline-flex";
    }

    listenToUserAppointments(currentUser);
    listenToClinicAppointments();

    // 4. Fetch Patient Portal Announcements
    try {
      const portalDoc = await getDoc(doc(db, "announcements", "portal_announcement"));
      if (portalDoc.exists()) {
        const pData = portalDoc.data();
        const wrapper = document.getElementById('portalAlertsWrapper');
        if (wrapper) {
          wrapper.innerHTML = ''; // clear wrapper
          
          let alerts = pData.alerts || [];
          
          // Fallback for single old data format
          if (alerts.length === 0 && pData.title && pData.isActive) {
            alerts.push({ isActive: pData.isActive, title: pData.title, description: pData.description });
          }

          alerts.forEach(alertData => {
            if (alertData.isActive) {
              const alertHTML = `
                <div class="content-card" style="border: 1px solid #fde047; background-color: #fefce8; margin-bottom: 0;">
                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="background-color: #fef08a; padding: 0.75rem; border-radius: 50%; color: #854d0e; flex-shrink: 0;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <div>
                      <h2 style="font-size: 1.15rem; color: #854d0e; margin: 0 0 0.5rem 0;">${escapeHtml(alertData.title || 'Important Announcement')}</h2>
                      <p style="color: #713f12; margin: 0; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(alertData.description || '')}</p>
                    </div>
                  </div>
                </div>
              `;
              wrapper.insertAdjacentHTML('beforeend', alertHTML);
            }
          });
        }
      }
    } catch (err) {
      console.warn("Failed to load portal announcements", err);
    }

  } else {
    window.location.href = 'login.html';
  }
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

function renderSelectedDaySchedule(dateStr) {
  const modal = document.getElementById('dayAppointmentsModal');
  const title = document.getElementById('dayModalTitle');
  const list = document.getElementById('dayModalList');
  if (!modal || !title || !list) return;
  
  modal.style.display = 'flex';
  title.textContent = `Schedule for ${dateStr}`;
  
  const dayEvents = clinicAppointments.filter(item => item.appointmentDate === dateStr);
  
  if (dayEvents.length === 0) {
    list.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; text-align: center;">No appointments booked for this day.</p>`;
    return;
  }
  
  let html = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;
  dayEvents.forEach(evt => {
    const stClass = `status-${(evt.appointmentStatus || 'pending').toLowerCase()}`;
    const serviceName = evt.appointmentType || evt.service || 'Therapy Session';
    const timeStart = evt.appointmentTimeStart || '09:00';
    const timeEnd = evt.appointmentTimeEnd || '10:00';
    
    html += `
      <div style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; font-size: 0.85rem; background-color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <strong style="color: var(--text-main); font-size: 0.9rem;">${escapeHtml(timeStart)} - ${escapeHtml(timeEnd)}</strong>
          <span class="status-badge ${stClass}" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">${escapeHtml(evt.appointmentStatus || 'Pending')}</span>
        </div>
        <div style="color: var(--text-muted); line-height: 1.4;">
          <div style="font-weight: 600; color: var(--medical-blue-text);">${escapeHtml(serviceName)}</div>
          <div>Specialist: Dr. ${escapeHtml(evt.doctor || 'Staff')}</div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  list.innerHTML = html;
  
  document.getElementById('closeDayModalBtn')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

// Global Escape key handler for modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay, .admin-modal-backdrop, .admin-modal-overlay');
    modals.forEach(modal => {
      // Check if modal is visible
      if (!modal.classList.contains('hidden') && modal.style.display !== 'none') {
        const closeBtn = modal.querySelector('.admin-modal-close, #closeDayModalBtn, #closeCalModalBtn, #closeApptDetailBtn, #cancelDeleteBtn, [id^="close"], [id^="cancel"]');
        if (closeBtn) {
          closeBtn.click();
        } else {
          modal.classList.add('hidden');
          modal.style.display = 'none';
        }
      }
    });
  }
});

