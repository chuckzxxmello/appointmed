import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initAdminNavProfile, getProfileModalHTML } from "./admin-shared.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "./ui-utils.js";

document.body.insertAdjacentHTML('beforeend', getProfileModalHTML());
initAdminNavProfile(auth);

let currentDate = new Date();
let allAppointments = [];
let allUsers = [];
let selectedCellDate = null;
let calViewType = 'month';

renderCalendar();
setupCalendarModalListeners();
listenAppointments();
loadUsers();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Session state check
  }
});

function listenAppointments() {
  try {
    const q = query(collection(db, 'appointments'), limit(1000));
    onSnapshot(q, (snapshot) => {
      allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderCalendar();
      updateQuickStats();
      if (selectedCellDate) {
        const m = document.getElementById('dayAppointmentsModal');
        if (m && m.classList.contains('active')) {
          openDayAppointmentsModal(selectedCellDate);
        }
      }
    });
  } catch(err) {
    console.warn("Firestore calendar snapshot listener error:", err);
  }
}

function loadUsers() {
  try {
    const q = query(collection(db, 'users'), limit(1000));
    onSnapshot(q, (snapshot) => {
      allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderDraggableClients();
    });
  } catch(err) {
    console.warn("Could not fetch clients for calendar sidebar:", err);
  }
}

function renderDraggableClients() {
  const container = document.getElementById('draggableClientsList');
  if (!container) return;

  // EXCLUDE ADMIN USERS AND UNVERIFIED PROFILES FROM SCHEDULING LIST
  const clientUsers = allUsers.filter(u => {
    const role = (u.role || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const isRegular = role !== 'admin' && !email.includes('admin');
    
    // Check full verification criteria
    const hasPhone = u.phone && u.phone.trim() !== '';
    const hasFb = u.facebook && u.facebook.trim() !== '';
    const isVerified = u.emailVerified === true && hasPhone && hasFb;
    
    return isRegular && isVerified;
  });

  if (clientUsers.length === 0) {
    container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No fully verified patient accounts found</div>';
    return;
  }

  let html = '';
  clientUsers.forEach(u => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
    html += `
      <div class="draggable-client-item" draggable="true" data-type="client" data-name="${escapeHtml(name)}" data-email="${escapeHtml(u.email || '')}" data-phone="${escapeHtml(u.phone || '')}" data-facebook="${escapeHtml(u.facebook || '')}">
        <div>
          <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">${escapeHtml(name)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(u.email || '')}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
      </div>
    `;
  });
  container.innerHTML = html;

  container.querySelectorAll('.draggable-client-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        kind: 'client',
        name: item.dataset.name,
        email: item.dataset.email,
        phone: item.dataset.phone,
        facebook: item.dataset.facebook
      }));
    });
  });
}

function updateQuickStats() {
  const sideTotal = document.getElementById('sideTotalCount');
  if (sideTotal) sideTotal.textContent = allAppointments.length;
  
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const todayStr = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let monthCount = 0;
  let todayCount = 0;

  allAppointments.forEach(evt => {
    if (evt.appointmentDate) {
      if (evt.appointmentDate === todayStr) todayCount++;
      const d = new Date(evt.appointmentDate);
      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) monthCount++;
    }
  });

  const sideMonth = document.getElementById('sideMonthCount');
  const sideToday = document.getElementById('sideTodayCount');
  if (sideMonth) sideMonth.textContent = monthCount;
  if (sideToday) sideToday.textContent = todayCount;
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const calTitle = document.getElementById('calMonthTitle');
  const gridHeader = document.getElementById('calGridHeader');
  const gridContainer = document.getElementById('calDaysGrid');
  if (!gridContainer) return;

  // Update header title based on view type
  if (calViewType === 'month') {
    if (calTitle) calTitle.textContent = `${monthNames[month]} ${year}`;
    if (gridHeader) { gridHeader.style.display = ''; gridHeader.className = 'cal-grid-header'; }
    gridContainer.className = 'cal-days-grid';
    renderMonthView(gridContainer, year, month);
  } else if (calViewType === 'week') {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startStr = `${monthNames[startOfWeek.getMonth()].slice(0, 3)} ${startOfWeek.getDate()}`;
    const endStr = `${monthNames[endOfWeek.getMonth()].slice(0, 3)} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    if (calTitle) calTitle.textContent = `${startStr} – ${endStr}`;
    if (gridHeader) { gridHeader.style.display = ''; gridHeader.className = 'cal-grid-header'; }
    gridContainer.className = 'cal-days-grid';
    renderWeekView(gridContainer);
  } else if (calViewType === 'day') {
    if (calTitle) calTitle.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (gridHeader) gridHeader.style.display = 'none';
    gridContainer.className = '';
    renderDayView(gridContainer);
  }
}

function renderMonthView(gridContainer, year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrMonth = (today.getFullYear() === year && today.getMonth() === month);

  let html = '';
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-cell other-month"><span class="cal-cell-num">${prevMonthDays - i}</span></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvts = allAppointments.filter(e => e.appointmentDate === dateStr);
    const isSel = (selectedCellDate === dateStr);
    const isToday = isCurrMonth && (day === today.getDate());

    html += `<div class="cal-cell ${isSel ? 'is-selected' : ''} ${isToday ? 'cal-day-today' : ''}" data-date="${dateStr}"><span class="cal-cell-num">${day}</span>`;
    dayEvts.forEach((evt, idx) => {
      if (idx >= 3) return;
      const displayName = `${evt.firstName || ''} ${evt.lastName || ''}`.trim() || evt.email?.split('@')[0] || 'Patient';
      html += `<div class="cal-evt-pill status-${(evt.appointmentStatus || 'pending').toLowerCase()}" draggable="true" data-id="${evt.id}" data-date="${dateStr}" title="${escapeHtml(displayName)} (${evt.appointmentTimeStart || '09:00'})"><span>${escapeHtml(displayName)}</span><span style="font-size: 0.65rem; opacity: 0.85;">${evt.appointmentTimeStart || '09:00'}</span></div>`;
    });
    if (dayEvts.length > 3) {
      const extraCount = dayEvts.length - 3;
      html += `<div class="cal-evt-pill more-btn" data-date="${dateStr}" style="background-color: transparent; color: var(--medical-blue-text); border: 1px dashed var(--medical-blue-text); text-align: center; display: block; font-size: 0.65rem; cursor: pointer;">+${extraCount} more...</div>`;
    }
    html += `</div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const nextNeeded = (totalCells > 35) ? (42 - totalCells) : (35 - totalCells);
  for (let d = 1; d <= nextNeeded; d++) {
    html += `<div class="cal-cell other-month"><span class="cal-cell-num">${d}</span></div>`;
  }

  gridContainer.innerHTML = html;
  attachCellDragDropHandlers();
}

function attachCellDragDropHandlers() {
  const cells = document.querySelectorAll('.cal-cell:not(.other-month)');

  cells.forEach(cell => {
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.classList.add('drag-over');
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });

    cell.addEventListener('drop', async (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      const date = cell.dataset.date;
      if (!date) return;

      try {
        const rawData = e.dataTransfer.getData('text/plain');
        if (!rawData) return;
        const payload = JSON.parse(rawData);

        if (payload.kind === 'client') {
          openCalModal(null, date, payload.name, payload.email, payload.phone, payload.facebook);
        } else if (payload.kind === 'appt') {
          const apptId = payload.id;
          if (apptId) {
            await updateDoc(doc(db, 'appointments', apptId), {
              appointmentDate: date,
              updatedAt: new Date().toISOString()
            });
            showToast(`Appointment rescheduled to ${date}!`);
          }
        }
      } catch (err) {
        console.warn("Drop handling error:", err);
      }
    });

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.cal-evt-pill') && !e.target.closest('.more-btn')) return; // handled by pill click
      const dateStr = cell.dataset.date;
      if (dateStr) {
        selectedCellDate = dateStr;
        renderCalendar();
        if (e.target.closest('.more-btn') || e.target.closest('.cal-cell')) {
           if (typeof openDayAppointmentsModal === 'function') openDayAppointmentsModal(dateStr);
        }
      }
    });
  });

  document.querySelectorAll('.cal-evt-pill').forEach(pill => {
    pill.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', JSON.stringify({
        kind: 'appt',
        id: pill.dataset.id,
        fromDate: pill.dataset.date
      }));
      const dz = document.getElementById('dragDeleteZone');
      if (dz) dz.classList.add('visible');
    });

    pill.addEventListener('dragend', (e) => {
      const dz = document.getElementById('dragDeleteZone');
      if (dz) dz.classList.remove('visible');
    });

    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const apptId = pill.dataset.id;
      const dateStr = pill.dataset.date;
      if (dateStr) {
        selectedCellDate = dateStr;
        renderCalendar();
        const appt = allAppointments.find(a => String(a.id) === String(apptId));
        if (appt) openCalModal(appt, dateStr);
      }
    });
  });
}

function renderWeekView(gridContainer) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const today = new Date();
  let html = '';

  for (let i = 0; i < 7; i++) {
    const cellDate = new Date(startOfWeek);
    cellDate.setDate(startOfWeek.getDate() + i);
    const isToday = (today.toDateString() === cellDate.toDateString());
    const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
    const dayEvts = allAppointments.filter(e => e.appointmentDate === dateStr);
    const isSel = (selectedCellDate === dateStr);

    html += `<div class="cal-cell ${isSel ? 'is-selected' : ''} ${isToday ? 'cal-day-today' : ''}" data-date="${dateStr}"><span class="cal-cell-num">${cellDate.getDate()}</span>`;
    dayEvts.forEach((evt, idx) => {
      if (idx >= 3) return;
      const displayName = `${evt.firstName || ''} ${evt.lastName || ''}`.trim() || evt.email?.split('@')[0] || 'Patient';
      html += `<div class="cal-evt-pill status-${(evt.appointmentStatus || 'pending').toLowerCase()}" draggable="true" data-id="${evt.id}" data-date="${dateStr}" title="${escapeHtml(displayName)}"><span>${escapeHtml(displayName)}</span><span style="font-size: 0.65rem; opacity: 0.85;">${evt.appointmentTimeStart || '09:00'}</span></div>`;
    });
    if (dayEvts.length > 3) {
      const extraCount = dayEvts.length - 3;
      html += `<div class="cal-evt-pill more-btn" data-date="${dateStr}" style="background-color: transparent; color: var(--medical-blue-text); border: 1px dashed var(--medical-blue-text); text-align: center; display: block; font-size: 0.65rem; cursor: pointer;">+${extraCount} more...</div>`;
    }
    html += `</div>`;
  }

  gridContainer.innerHTML = html;
  attachCellDragDropHandlers();
}

function renderDayView(gridContainer) {
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const dayEvts = allAppointments.filter(e => e.appointmentDate === dateStr);

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

  let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
  workingHours.forEach(slot => {
    const bookedAppt = dayEvts.find(evt => (evt.appointmentTimeStart || '').slice(0, 2) === slot.start.slice(0, 2));

    if (bookedAppt) {
      const displayName = `${bookedAppt.firstName || ''} ${bookedAppt.lastName || ''}`.trim() || 'Patient';
      html += `
        <div class="cal-day-slot" data-date="${dateStr}" data-hour="${slot.start}" style="border-left: 3px solid #1e3a8a;">
          <div>
            <strong style="font-size: 0.9rem; color: var(--text-main); display: block;">${escapeHtml(displayName)}</strong>
            <span style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(slot.display)} | ${escapeHtml(bookedAppt.appointmentType || 'Therapy')} | ${escapeHtml(bookedAppt.doctor || 'Staff')}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="status-badge status-${(bookedAppt.appointmentStatus || 'pending').toLowerCase()}" style="font-size: 0.7rem;">${escapeHtml(bookedAppt.appointmentStatus || 'Pending')}</span>
            <button class="cal-nav-btn edit-day-appt" data-id="${bookedAppt.id}" title="Edit" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Edit</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="cal-day-slot" data-date="${dateStr}" data-hour="${slot.start}" style="border-left: 3px solid #e2e8f0;">
          <div>
            <strong style="font-size: 0.875rem; color: var(--text-main); display: block;">${escapeHtml(slot.display)}</strong>
            <span style="font-size: 0.725rem; color: #15803d; font-weight: 600;">Available</span>
          </div>
          <button class="cal-nav-btn" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">+ Add</button>
        </div>`;
    }
  });
  html += '</div>';
  gridContainer.innerHTML = html;
  attachDayViewHandlers(dateStr);
}

function attachDayViewHandlers(dateStr) {
  // Day view drag-drop on slots
  document.querySelectorAll('.cal-day-slot').forEach(slot => {
    slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => { slot.classList.remove('drag-over'); });
    slot.addEventListener('drop', async (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const hour = slot.dataset.hour;
      try {
        const rawData = e.dataTransfer.getData('text/plain');
        if (!rawData) return;
        const payload = JSON.parse(rawData);
        if (payload.kind === 'client') {
          openCalModal(null, dateStr, payload.name, payload.email, payload.phone, payload.facebook, hour);
        }
      } catch (err) { console.warn('Day view drop error:', err); }
    });
  });

  // Edit button on booked slots
  document.querySelectorAll('.edit-day-appt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const apptId = btn.dataset.id;
      const target = allAppointments.find(a => a.id === apptId);
      if (target) openCalModal(target);
    });
  });

  // Click + Add on empty slots
  document.querySelectorAll('.cal-day-slot').forEach(slot => {
    const addBtn = slot.querySelector('.cal-nav-btn:not(.edit-day-appt)');
    if (addBtn && !slot.querySelector('.edit-day-appt')) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCalModal(null, dateStr);
      });
    }
  });
}

function openCalModal(appt = null, defaultDate = '', defaultName = '', defaultEmail = '', defaultPhone = '', defaultFacebook = '', defaultStartTime = '') {
  const m = document.getElementById('calApptModal');
  if (!m) return;
  document.getElementById('calModalTitle').textContent = appt ? 'Edit Appointment' : 'Schedule Appointment';
  document.getElementById('calModalId').value = appt ? appt.id : '';

  const deleteBtn = document.getElementById('deleteCalApptBtn');
  if (deleteBtn) deleteBtn.style.display = appt ? 'inline-flex' : 'none';

  const nameParts = defaultName ? defaultName.trim().split(' ') : [];
  document.getElementById('calModalFirstName').value = appt ? (appt.firstName || '') : (nameParts[0] || '');
  document.getElementById('calModalLastName').value = appt ? (appt.lastName || '') : (nameParts.slice(1).join(' ') || '');
  document.getElementById('calModalEmail').value = appt ? (appt.email || '') : defaultEmail;
  
  if (document.getElementById('calModalPhone')) document.getElementById('calModalPhone').value = appt ? (appt.phone || '') : defaultPhone;
  if (document.getElementById('calModalFacebook')) document.getElementById('calModalFacebook').value = appt ? (appt.facebook || '') : defaultFacebook;

  document.getElementById('calModalDate').value = appt ? (appt.appointmentDate || '') : (defaultDate || new Date().toISOString().split('T')[0]);
  
  const startTime = appt ? (appt.appointmentTimeStart || '09:00') : (defaultStartTime || '09:00');
  document.getElementById('calModalStart').value = startTime;
  
  let nextHour = '10:00';
  if (!appt && defaultStartTime) {
    const nextH = parseInt(defaultStartTime.split(':')[0], 10) + 1;
    nextHour = String(nextH).padStart(2, '0') + ':00';
  }
  document.getElementById('calModalEnd').value = appt ? (appt.appointmentTimeEnd || '10:00') : nextHour;
  
  document.getElementById('calModalType').value = appt ? (appt.appointmentType || 'OCCUPATIONAL THERAPY') : 'OCCUPATIONAL THERAPY';
  document.getElementById('calModalDoctor').value = appt ? (appt.doctor || '') : '';
  document.getElementById('calModalStatus').value = appt ? (appt.appointmentStatus || 'Pending') : 'Pending';

  setupFacebookInput('calModalFacebook', 'clearCalFbBtn', 'calFbBadgePreview', 'calFbBadgeLink', 'calFbBadgeClearBtn');
  m.classList.add('active');
}

function closeCalModal() {
  const m = document.getElementById('calApptModal');
  if (m) m.classList.remove('active');
  const f = document.getElementById('calApptForm');
  if (f) f.reset();
  setupFacebookInput('calModalFacebook', 'clearCalFbBtn', 'calFbBadgePreview', 'calFbBadgeLink', 'calFbBadgeClearBtn');
}

function setupCalendarModalListeners() {
  document.getElementById('closeCalModalBtn')?.addEventListener('click', closeCalModal);
  document.getElementById('cancelCalModalBtn')?.addEventListener('click', closeCalModal);
  setupFacebookInput('calModalFacebook', 'clearCalFbBtn', 'calFbBadgePreview', 'calFbBadgeLink', 'calFbBadgeClearBtn');

  document.getElementById('calApptForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('calModalId').value;
    const data = {
      firstName: document.getElementById('calModalFirstName').value.trim(),
      lastName: document.getElementById('calModalLastName').value.trim(),
      email: document.getElementById('calModalEmail').value.trim(),
      phone: document.getElementById('calModalPhone')?.value.trim() || '',
      facebook: document.getElementById('calModalFacebook')?.value.trim() || '',
      appointmentDate: document.getElementById('calModalDate').value,
      appointmentTimeStart: document.getElementById('calModalStart').value,
      appointmentTimeEnd: document.getElementById('calModalEnd').value,
      appointmentType: document.getElementById('calModalType').value,
      doctor: document.getElementById('calModalDoctor').value.trim(),
      appointmentStatus: document.getElementById('calModalStatus').value,
      updatedAt: new Date().toISOString()
    };

    try {
      if (id) {
        await updateDoc(doc(db, 'appointments', id), data);
        showToast('Appointment successfully updated!');
      } else {
        data.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'appointments'), data);
        data.id = docRef.id;
        showToast('New appointment successfully scheduled!');
      }
    } catch(err) {
      console.error("Firestore save error:", err);
      showToast('Error saving to Firestore: ' + err.message, 'error');
    }
    closeCalModal();
  });

  document.getElementById('deleteCalApptBtn')?.addEventListener('click', async () => {
    const id = document.getElementById('calModalId').value;
    if (id && confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
        showToast('Appointment successfully canceled!');
      } catch(err) {
        showToast('Failed to delete appointment: ' + err.message, 'error');
      }
      closeCalModal();
    }
  });
}

// Click cell to view details or select (month + week views)
document.addEventListener('click', (e) => {
  const cell = e.target.closest('.cal-cell:not(.other-month)');
  if (cell && cell.dataset.date) {
    // If clicked on an actual appointment pill (but not +X more), ignore it (handled by pill click listener)
    if (e.target.closest('.cal-evt-pill') && !e.target.closest('.more-btn')) {
      return;
    }
    selectedCellDate = cell.dataset.date;
    renderCalendar();
    openDayAppointmentsModal(selectedCellDate);
  }
});
// Selected date logic now handled by modal

// View Switcher (Month / Week / Day)
document.querySelectorAll('.cal-view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    calViewType = btn.dataset.view;
    document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCalendar();
  });
});

// Calendar Navigation (view-type-aware)
document.getElementById('calPrevBtn')?.addEventListener('click', () => {
  if (calViewType === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
  else if (calViewType === 'week') currentDate.setDate(currentDate.getDate() - 7);
  else if (calViewType === 'day') currentDate.setDate(currentDate.getDate() - 1);
  renderCalendar();
});

document.getElementById('calNextBtn')?.addEventListener('click', () => {
  if (calViewType === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
  else if (calViewType === 'week') currentDate.setDate(currentDate.getDate() + 7);
  else if (calViewType === 'day') currentDate.setDate(currentDate.getDate() + 1);
  renderCalendar();
});

document.getElementById('calTodayBtn')?.addEventListener('click', () => {
  currentDate = new Date();
  renderCalendar();
});

document.querySelectorAll('#openAddApptModalBtn, .open-add-appt-sidebar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    openCalModal(null, selectedCellDate || new Date().toISOString().split('T')[0]);
  });
});

function setupFacebookInput(inputId, clearBtnId, previewId, linkId, linkClearBtnId) {
  const inputEl = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearBtnId);
  const previewEl = document.getElementById(previewId);
  const linkEl = document.getElementById(linkId);
  const linkClearBtn = document.getElementById(linkClearBtnId);

  if (!inputEl) return;

  function updateFBState() {
    const val = (inputEl.value || '').trim();
    if (!val) {
      if (clearBtn) clearBtn.style.display = 'none';
      if (previewEl) previewEl.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = 'block';

    const isLink = /^(https?:\/\/|www\.|facebook\.com|fb\.com)/i.test(val);
    if (isLink && previewEl && linkEl) {
      const fullUrl = val.startsWith('http') ? val : `https://${val}`;
      linkEl.href = fullUrl;
      linkEl.textContent = val.length > 32 ? val.substring(0, 30) + '...' : val;
      previewEl.style.display = 'block';
    } else {
      if (previewEl) previewEl.style.display = 'none';
    }
  }

  inputEl.oninput = updateFBState;

  const doClear = () => {
    inputEl.value = '';
    updateFBState();
    inputEl.focus();
  };

  if (clearBtn) clearBtn.onclick = doClear;
  if (linkClearBtn) linkClearBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    doClear();
  };

  updateFBState();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

function openDayAppointmentsModal(dateStr) {
  const modal = document.getElementById('dayAppointmentsModal');
  const title = document.getElementById('dayModalTitle');
  const list = document.getElementById('dayModalList');
  if (!modal || !title || !list) return;
  
  modal.classList.add('active');
  title.innerHTML = `
    Appointments for ${dateStr}
    <button class="btn-admin-pill btn-pill-primary add-appt-for-date-btn" style="font-size: 0.725rem; padding: 0.25rem 0.55rem; font-weight: 700; margin-left: 1rem; vertical-align: middle;">
      + Add
    </button>
  `;
  
  const addBtn = title.querySelector('.add-appt-for-date-btn');
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.classList.remove('active');
      openCalModal(null, dateStr);
    });
  }

  const dayEvents = allAppointments.filter(item => item.appointmentDate === dateStr);
  
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
    const displayName = `${evt.firstName || ''} ${evt.lastName || ''}`.trim() || evt.email || 'Patient';
    
    html += `
      <div style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; font-size: 0.85rem; background-color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <strong style="color: var(--text-main); font-size: 0.9rem;">${escapeHtml(timeStart)} - ${escapeHtml(timeEnd)}</strong>
          <span class="status-badge ${stClass}" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">${escapeHtml(evt.appointmentStatus || 'Pending')}</span>
        </div>
        <div style="color: var(--text-muted); line-height: 1.4;">
          <div style="font-weight: 600; color: var(--medical-blue-text);">${escapeHtml(displayName)}</div>
          <div>${escapeHtml(serviceName)}</div>
          <div>Doctor: ${escapeHtml(evt.doctor || 'Staff')}</div>
          ${evt.phoneNumber ? `<div>Phone: ${escapeHtml(evt.phoneNumber)}</div>` : ''}
        </div>
        <div style="display: flex; gap: 0.4rem; justify-content: flex-end; padding-top: 0.5rem; border-top: 1px dashed var(--border-color); margin-top: 0.5rem;">
          <button class="cal-nav-btn edit-modal-appt-btn" data-id="${evt.id}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 0.25rem; font-weight: 600; cursor: pointer;">Edit</button>
          <button class="cal-nav-btn delete-modal-appt-btn" data-id="${evt.id}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 0.25rem; font-weight: 600; cursor: pointer;">Delete</button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  list.innerHTML = html;
  
  document.querySelectorAll('.edit-modal-appt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const apptId = btn.dataset.id;
      const target = allAppointments.find(a => String(a.id) === String(apptId));
      if (target) {
        modal.classList.remove('active');
        openCalModal(target, dateStr);
      }
    });
  });

  document.querySelectorAll('.delete-modal-appt-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const apptId = btn.dataset.id;
      if (apptId && confirm('Are you sure you want to delete this appointment?')) {
        try {
          await deleteDoc(doc(db, 'appointments', apptId));
          showToast('Appointment successfully canceled!');
          openDayAppointmentsModal(dateStr); // Re-render modal
        } catch (err) {
          showToast('Failed to delete appointment: ' + err.message, 'error');
        }
      }
    });
  });

  document.getElementById('closeDayModalBtn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });
}

// Global Escape key handler for modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay, .admin-modal-backdrop, .admin-modal-overlay');
    modals.forEach(modal => {
      // Check if modal is visible
      if (!modal.classList.contains('hidden') && modal.style.display !== 'none' && (modal.classList.contains('active') || !modal.classList.contains('admin-modal-backdrop'))) {
        const closeBtn = modal.querySelector('.admin-modal-close, #closeDayModalBtn, #closeCalModalBtn, #closeApptDetailBtn, #cancelDeleteBtn, [id^="close"], [id^="cancel"]');
        if (closeBtn) {
          closeBtn.click();
        } else {
          modal.classList.add('hidden');
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      }
    });
  }
});

let appointmentToDelete = null;

const dz = document.getElementById('dragDeleteZone');
if (dz) {
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('drag-over');
  });
  dz.addEventListener('dragleave', () => {
    dz.classList.remove('drag-over');
  });
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    dz.classList.remove('visible');
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const payload = JSON.parse(rawData);
      if (payload.kind === 'appt' && payload.id) {
        appointmentToDelete = payload.id;
        document.getElementById('deleteConfirmModal').classList.add('active');
      }
    } catch (err) {
      console.warn('Drop on delete zone error:', err);
    }
  });
}

document.getElementById('cancelDeleteConfirmBtn')?.addEventListener('click', () => {
  appointmentToDelete = null;
  document.getElementById('deleteConfirmModal').classList.remove('active');
});

document.getElementById('confirmDeleteApptBtn')?.addEventListener('click', async () => {
  if (appointmentToDelete) {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentToDelete));
      showToast('Appointment deleted successfully!');
      appointmentToDelete = null;
      document.getElementById('deleteConfirmModal').classList.remove('active');
    } catch (err) {
      showToast('Failed to delete appointment: ' + err.message, 'error');
    }
  }
});
