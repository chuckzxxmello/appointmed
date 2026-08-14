import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, limit, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initAdminNavProfile, getProfileModalHTML } from "./admin-shared.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "./ui-utils.js";

// Mount Modal HTML Container
document.body.insertAdjacentHTML('beforeend', getProfileModalHTML());
initAdminNavProfile(auth);

let allAppointments = [];
let filteredAppointments = [];
let currentPage = 1;
let itemsPerPage = 10;
let isListening = false;

setupModalListeners();
setupFilterListeners();
setupPaginationAndBulkActions();

onAuthStateChanged(auth, async (user) => {
  if (!user && !window.location.pathname.includes('login.html')) {
    window.location.href = '../auth/login.html';
    return;
  }

  if (user) {
    if (!isListening) {
      isListening = true;
      listenAppointments();
    }

    if (user.email && user.email.toLowerCase().includes('admin')) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.log("Admin document sync notice:", err);
      }
    }
  }
});

function getPatientAppointmentsOnly(items) {
  return items.filter(item => {
    const email = (item.email || '').toLowerCase();
    const fName = (item.firstName || '').toLowerCase();
    const lName = (item.lastName || '').toLowerCase();
    const pName = (item.patientName || '').toLowerCase();
    return !email.includes('admin') && fName !== 'admin' && lName !== 'admin' && !pName.includes('admin');
  });
}

function listenAppointments() {
  try {
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(500));
    onSnapshot(q, (snapshot) => {
      const rawAppointments = [];
      snapshot.forEach(doc => {
        rawAppointments.push({ id: doc.id, ...doc.data() });
      });
      allAppointments = getPatientAppointmentsOnly(rawAppointments);
      filterAndRenderAppointments();
      updateStats(allAppointments);
    }, (error) => {
      console.warn("Firestore snapshot listener permission error:", error);
    });
  } catch (err) {
    console.warn("Firestore snapshot listener error:", err);
  }
}

function updateStats(items) {
  const statTotal = document.getElementById('statTotalAppts');
  const statPending = document.getElementById('statPendingAppts');
  const statConfirmed = document.getElementById('statConfirmedAppts');
  const statCompleted = document.getElementById('statCompletedAppts');

  if (statTotal) statTotal.textContent = items.length;
  let pending = 0;
  let confirmed = 0;
  let completed = 0;

  items.forEach(i => {
    const st = (i.appointmentStatus || '').toLowerCase();
    if (st === 'pending') pending++;
    else if (st === 'confirmed') confirmed++;
    else if (st === 'completed' || st === 'finished') completed++;
  });

  if (statPending) statPending.textContent = pending;
  if (statConfirmed) statConfirmed.textContent = confirmed;
  if (statCompleted) statCompleted.textContent = completed;
}

function filterAndRenderAppointments() {
  const searchTerm = (document.getElementById('apptSearchInput')?.value || '').toLowerCase().trim();
  const statusFilter = (document.getElementById('statusFilterSelect')?.value || 'all').toLowerCase();

  filteredAppointments = allAppointments.filter(item => {
    const name = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
    const email = (item.email || '').toLowerCase();
    const doctor = (item.doctor || '').toLowerCase();
    const service = (item.appointmentType || '').toLowerCase();
    const status = (item.appointmentStatus || '').toLowerCase();

    const matchesSearch = !searchTerm || name.includes(searchTerm) || email.includes(searchTerm) || doctor.includes(searchTerm) || service.includes(searchTerm);
    const matchesStatus = (statusFilter === 'all') || (status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  currentPage = 1;
  renderCurrentPage();
}

function renderCurrentPage() {
  const totalPagesDisplay = document.getElementById('totalPagesDisplay');
  const currentPageDisplay = document.getElementById('currentPageDisplay');

  const limit = parseInt(itemsPerPage);
  const totalPages = Math.ceil(filteredAppointments.length / limit) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;

  if (totalPagesDisplay) totalPagesDisplay.textContent = totalPages;
  if (currentPageDisplay) currentPageDisplay.textContent = currentPage;

  document.getElementById('btnFirstPage').disabled = currentPage === 1;
  document.getElementById('btnPrevPage').disabled = currentPage === 1;
  document.getElementById('btnNextPage').disabled = currentPage === totalPages;
  document.getElementById('btnLastPage').disabled = currentPage === totalPages;

  const pageAppts = filteredAppointments.slice(startIndex, endIndex);
  renderAppointmentsTable(pageAppts);
  updateBulkDeleteUI();
}

function updateBulkDeleteUI() {
  const checkboxes = document.querySelectorAll('.row-checkbox:not(:disabled)');
  const checked = document.querySelectorAll('.row-checkbox:checked:not(:disabled)');
  const selectAll = document.getElementById('selectAllAppts');
  const bulkBtn = document.getElementById('bulkDeleteBtn');
  const bulkCount = document.getElementById('bulkDeleteCount');

  if (selectAll) {
    selectAll.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
  }

  if (bulkBtn && bulkCount) {
    bulkCount.textContent = checked.length;
    bulkBtn.style.display = checked.length > 0 ? 'inline-flex' : 'none';
  }
}

function setupPaginationAndBulkActions() {
  document.getElementById('apptPerPageSelect')?.addEventListener('change', (e) => {
    itemsPerPage = e.target.value;
    filterAndRenderAppointments();
  });

  document.getElementById('btnFirstPage')?.addEventListener('click', () => { currentPage = 1; renderCurrentPage(); });
  document.getElementById('btnPrevPage')?.addEventListener('click', () => { currentPage--; renderCurrentPage(); });
  document.getElementById('btnNextPage')?.addEventListener('click', () => { currentPage++; renderCurrentPage(); });
  document.getElementById('btnLastPage')?.addEventListener('click', () => {
    const limit = parseInt(itemsPerPage);
    currentPage = Math.ceil(filteredAppointments.length / limit) || 1;
    renderCurrentPage();
  });

  document.getElementById('selectAllAppts')?.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.row-checkbox:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
    updateBulkDeleteUI();
  });

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('row-checkbox')) {
      updateBulkDeleteUI();
    }
  });

  document.getElementById('bulkDeleteBtn')?.addEventListener('click', async () => {
    const checked = document.querySelectorAll('.row-checkbox:checked:not(:disabled)');
    if (checked.length === 0) return;

    if (confirm(`Are you sure you want to permanently delete ${checked.length} selected appointments?`)) {
      try {
        const batch = writeBatch(db);
        for (const cb of checked) {
          const docId = cb.dataset.id;
          batch.delete(doc(db, 'appointments', docId));
        }
        await batch.commit();
        showToast(`Successfully deleted ${checked.length} appointments.`);
        const selectAll = document.getElementById('selectAllAppts');
        if (selectAll) selectAll.checked = false;
        updateBulkDeleteUI();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    }
  });
}

function renderAppointmentsTable(items) {
  const tbody = document.getElementById('apptsTableBody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2.5rem; color: var(--text-muted); font-size: 0.9rem;">
          No patient appointments found matching current filters.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  items.forEach(appt => {
    const pName = (appt.firstName || appt.lastName)
      ? `${appt.firstName || ''} ${appt.lastName || ''}`.trim()
      : (appt.patientName || appt.email?.split('@')[0] || 'Patient');

    const pEmail = appt.email || 'No email provided';
    const dateStr = appt.appointmentDate || '--';
    const timeStr = (appt.appointmentTimeStart && appt.appointmentTimeEnd)
      ? `${appt.appointmentTimeStart} - ${appt.appointmentTimeEnd}`
      : (appt.appointmentTime || '--');

    const typeStr = appt.appointmentType || appt.service || 'General Therapy';
    const doctorStr = appt.doctor || 'Staff';
    const stText = appt.appointmentStatus || 'Pending';
    const statusClass = `status-${stText.toLowerCase()}`;

    const phoneStr = appt.phone ? `<small style="display: block; color: var(--text-muted); font-size: 0.75rem;">📞 ${escapeHtml(appt.phone)}</small>` : '';
    let fbStr = '';
    if (appt.facebook) {
      const fbVal = appt.facebook.trim();
      const isLink = /^(https?:\/\/|www\.|facebook\.com|fb\.com)/i.test(fbVal);
      if (isLink) {
        const url = fbVal.startsWith('http') ? fbVal : `https://${fbVal}`;
        fbStr = `<small style="display: block; font-size: 0.75rem;"><a href="${escapeHtml(url)}" target="_blank" style="color: #1d4ed8; font-weight: 600;">FB Link ↗</a></small>`;
      } else {
        fbStr = `<small style="display: block; color: var(--text-muted); font-size: 0.75rem;">FB: ${escapeHtml(fbVal)}</small>`;
      }
    }

    html += `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="row-checkbox" data-id="${appt.id}">
        </td>
        <td class="patient-info-cell">
          <strong>${escapeHtml(pName)}</strong>
          <span>${escapeHtml(pEmail)}</span>
          ${phoneStr}
          ${fbStr}
        </td>
        <td>
          <strong style="color: var(--text-main); font-size: 0.85rem;">${escapeHtml(dateStr)}</strong>
          <small style="display: block; color: var(--text-muted); font-size: 0.775rem;">${escapeHtml(timeStr)}</small>
        </td>
        <td><span class="badge-role" style="background-color: #f1f5f9; color: #334155; padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.775rem; font-weight: 600;">${escapeHtml(typeStr)}</span></td>
        <td><strong style="color: var(--text-main); font-size: 0.85rem;">${escapeHtml(doctorStr)}</strong></td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(stText)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${appt.id}" title="Edit Appointment">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-action btn-delete" data-id="${appt.id}" title="Delete Appointment">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  attachActionListeners();
}

function attachActionListeners() {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const appt = allAppointments.find(a => a.id === id);
      if (appt) openModal(appt);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (id && confirm("Are you sure you want to delete this appointment from Firestore?")) {
        try {
          await deleteDoc(doc(db, 'appointments', id));
          showToast("Appointment successfully canceled.");
        } catch (err) {
          showToast("Failed to delete appointment: " + err.message, 'error');
        }
      }
    });
  });
}

function setupFilterListeners() {
  document.getElementById('apptSearchInput')?.addEventListener('input', filterAndRenderAppointments);
  document.getElementById('statusFilterSelect')?.addEventListener('change', filterAndRenderAppointments);
  document.getElementById('refreshApptsBtn')?.addEventListener('click', () => {
    filterAndRenderAppointments();
  });
}

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

  inputEl.addEventListener('input', updateFBState);

  const doClear = () => {
    inputEl.value = '';
    updateFBState();
    inputEl.focus();
  };

  if (clearBtn) clearBtn.addEventListener('click', doClear);
  if (linkClearBtn) linkClearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    doClear();
  });

  updateFBState();
}

function openModal(appt = null) {
  const modal = document.getElementById('apptFormModal');
  if (!modal) return;

  const titleEl = document.getElementById('apptModalTitle');
  if (titleEl) titleEl.textContent = appt ? 'Edit Appointment' : 'Add Appointment';

  document.getElementById('apptModalId').value = appt ? appt.id : '';

  const nameParts = appt && appt.firstName ? [appt.firstName, appt.lastName || ''] : (appt && appt.patientName ? appt.patientName.split(' ') : []);
  document.getElementById('apptModalFirstName').value = appt ? (appt.firstName || nameParts[0] || '') : '';
  document.getElementById('apptModalLastName').value = appt ? (appt.lastName || nameParts.slice(1).join(' ') || '') : '';
  document.getElementById('apptModalEmail').value = appt ? (appt.email || '') : '';

  if (document.getElementById('apptModalPhone')) document.getElementById('apptModalPhone').value = appt ? (appt.phone || '') : '';
  if (document.getElementById('apptModalFacebook')) document.getElementById('apptModalFacebook').value = appt ? (appt.facebook || '') : '';

  document.getElementById('apptModalDate').value = appt ? (appt.appointmentDate || '') : '';
  document.getElementById('apptModalStart').value = appt ? (appt.appointmentTimeStart || '09:00') : '09:00';
  document.getElementById('apptModalEnd').value = appt ? (appt.appointmentTimeEnd || '10:00') : '10:00';
  document.getElementById('apptModalType').value = appt ? (appt.appointmentType || 'OCCUPATIONAL THERAPY') : 'OCCUPATIONAL THERAPY';
  document.getElementById('apptModalDoctor').value = appt ? (appt.doctor || '') : '';
  document.getElementById('apptModalStatus').value = appt ? (appt.appointmentStatus || 'Pending') : 'Pending';

  setupFacebookInput('apptModalFacebook', 'clearApptFbBtn', 'apptFbBadgePreview', 'apptFbBadgeLink', 'apptFbBadgeClearBtn');
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('apptFormModal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('apptForm');
  if (form) form.reset();
  setupFacebookInput('apptModalFacebook', 'clearApptFbBtn', 'apptFbBadgePreview', 'apptFbBadgeLink', 'apptFbBadgeClearBtn');
}

function setupModalListeners() {
  document.getElementById('addApptBtn')?.addEventListener('click', () => openModal(null));
  document.getElementById('closeApptModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('cancelApptModalBtn')?.addEventListener('click', closeModal);
  setupFacebookInput('apptModalFacebook', 'clearApptFbBtn', 'apptFbBadgePreview', 'apptFbBadgeLink', 'apptFbBadgeClearBtn');

  document.getElementById('apptForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('apptModalId').value;
    const data = {
      firstName: document.getElementById('apptModalFirstName').value.trim(),
      lastName: document.getElementById('apptModalLastName').value.trim(),
      email: document.getElementById('apptModalEmail').value.trim(),
      phone: document.getElementById('apptModalPhone')?.value.trim() || '',
      facebook: document.getElementById('apptModalFacebook')?.value.trim() || '',
      appointmentDate: document.getElementById('apptModalDate').value,
      appointmentTimeStart: document.getElementById('apptModalStart').value,
      appointmentTimeEnd: document.getElementById('apptModalEnd').value,
      appointmentType: document.getElementById('apptModalType').value,
      doctor: document.getElementById('apptModalDoctor').value.trim(),
      appointmentStatus: document.getElementById('apptModalStatus').value,
      updatedAt: new Date().toISOString()
    };

    try {
      if (id) {
        await updateDoc(doc(db, 'appointments', id), data);
        showToast("Appointment successfully updated!");
      } else {
        data.createdAt = new Date().toISOString();
        data.userId = "admin-created";
        await addDoc(collection(db, 'appointments'), data);
        showToast("New appointment added successfully!");
      }
    } catch (err) {
      console.error("Firestore save error:", err);
      showToast("Error saving appointment: " + err.message, 'error');
    }
    closeModal();
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// Global Escape key handler for modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay, .admin-modal-backdrop, .admin-modal-overlay');
    modals.forEach(modal => {
      // Check if modal is visible
      if (!modal.classList.contains('hidden') && modal.style.display !== 'none') {
        const closeBtn = modal.querySelector('.admin-modal-close, #closeApptModalBtn, #cancelApptModalBtn, [id^="close"], [id^="cancel"]');
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
