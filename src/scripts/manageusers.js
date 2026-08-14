import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs, writeBatch, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initAdminNavProfile, getProfileModalHTML } from "./admin-shared.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "./ui-utils.js";

document.body.insertAdjacentHTML('beforeend', getProfileModalHTML());
initAdminNavProfile(auth);

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let itemsPerPage = 10;

setupUserModalListeners();
setupPaginationAndFilters();
listenUsers();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Session listener
  }
});

function listenUsers() {
  try {
    const q = query(collection(db, 'users'), limit(500));
    onSnapshot(q, (snapshot) => {
      // Direct load from Firestore Database - no hardcoded stray users
      allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      applyFilters();
      updateUserStats(allUsers);
    });
  } catch (err) {
    console.warn("Firestore user snapshot listener error:", err);
  }
}

function updateUserStats(users) {
  const statTotal = document.getElementById('statTotalUsers');
  const statVerified = document.getElementById('statVerifiedUsers');
  const statAdmin = document.getElementById('statAdminUsers');
  const statRegular = document.getElementById('statRegularUsers');

  if (statTotal) statTotal.textContent = users.length;
  let verified = 0;
  let admins = 0;
  let regular = 0;

  users.forEach(u => {
    if (u.emailVerified) verified++;
    if ((u.role || '').toLowerCase() === 'admin' || (u.email || '').includes('admin')) admins++;
    else regular++;
  });

  if (statVerified) statVerified.textContent = verified;
  if (statAdmin) statAdmin.textContent = admins;
  if (statRegular) statRegular.textContent = regular;
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No registered users found matching the criteria</td></tr>';
    return;
  }

  const totalAdminCount = allUsers.filter(u => (u.role || '').toLowerCase() === 'admin' || (u.email || '').toLowerCase().includes('admin')).length;

  let html = '';
  users.forEach(u => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0];
    const isVerified = Boolean(u.emailVerified);
    const role = (u.role || (u.email.includes('admin') ? 'admin' : 'regular')).toLowerCase();
    const roleBadge = role === 'admin' ? '<span class="status-pill status-cancelled">Admin</span>' : '<span class="status-pill status-completed">Regular User</span>';
    const verifyBadge = isVerified ? '<span class="status-pill status-confirmed">Verified</span>' : '<span class="status-pill status-pending">Unverified</span>';
    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-01-15';

    const isTargetAdmin = role === 'admin' || (u.email || '').toLowerCase().includes('admin');
    const isProtectedAdmin = isTargetAdmin && totalAdminCount <= 1;

    const deleteBtnHtml = isProtectedAdmin
      ? `<button class="action-icon-btn danger delete-user-btn" data-id="${u.id}" disabled style="opacity: 0.3; cursor: not-allowed;" title="Action Prohibited: Cannot delete the last remaining admin account">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
         </button>`
      : `<button class="action-icon-btn danger delete-user-btn" data-id="${u.id}" title="Delete User">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
         </button>`;

    html += `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="row-checkbox" data-id="${u.id}" ${isProtectedAdmin ? 'disabled' : ''}>
        </td>
        <td class="patient-info-cell">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(u.email)}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${verifyBadge}
            <button class="action-icon-btn toggle-verify-btn" data-id="${u.id}" data-verified="${isVerified}" title="Toggle Verification (Verified/Unverified)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </button>
          </div>
        </td>
        <td>${roleBadge}</td>
        <td>${escapeHtml(dateStr)}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="action-icon-btn edit-user-btn" data-id="${u.id}" title="Edit User">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            ${deleteBtnHtml}
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function openUserModal(user = null) {
  const m = document.getElementById('userFormModal');
  if (!m) return;
  document.getElementById('userModalTitle').textContent = user ? 'Edit User' : 'Add New User';
  document.getElementById('userModalId').value = user ? user.id : '';
  document.getElementById('userModalFirstName').value = user ? (user.firstName || '') : '';
  document.getElementById('userModalLastName').value = user ? (user.lastName || '') : '';
  document.getElementById('userModalEmail').value = user ? (user.email || '') : '';
  document.getElementById('userModalRole').value = user ? (user.role || 'regular') : 'regular';
  document.getElementById('userModalVerified').value = user ? String(Boolean(user.emailVerified)) : 'true';
  m.classList.add('active');
}

function closeUserModal() {
  const m = document.getElementById('userFormModal');
  if (m) m.classList.remove('active');
  const f = document.getElementById('userForm');
  if (f) f.reset();
}

function setupUserModalListeners() {
  document.getElementById('addUserBtn')?.addEventListener('click', () => openUserModal());
  document.getElementById('closeUserModalBtn')?.addEventListener('click', closeUserModal);
  document.getElementById('cancelUserModalBtn')?.addEventListener('click', closeUserModal);

  document.getElementById('userForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('userModalId').value;
    const data = {
      firstName: document.getElementById('userModalFirstName').value.trim(),
      lastName: document.getElementById('userModalLastName').value.trim(),
      email: document.getElementById('userModalEmail').value.trim(),
      role: document.getElementById('userModalRole').value,
      emailVerified: document.getElementById('userModalVerified').value === 'true',
      updatedAt: new Date().toISOString()
    };

    try {
      if (id) {
        await updateDoc(doc(db, 'users', id), data);
        showToast('User profile has been successfully updated.');
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'users'), data);
        showToast('New user account has been successfully created.');
      }
    } catch (err) {
      console.error("Firestore user save error:", err);
      showToast('Error saving user: ' + err.message, 'error');
    }
    closeUserModal();
  });
}

document.addEventListener('click', async (e) => {
  const toggleVerifyBtn = e.target.closest('.toggle-verify-btn');
  const editBtn = e.target.closest('.edit-user-btn');
  const deleteBtn = e.target.closest('.delete-user-btn');

  if (toggleVerifyBtn) {
    const id = toggleVerifyBtn.dataset.id;
    const currVerified = toggleVerifyBtn.dataset.verified === 'true';
    const nextVerified = !currVerified;

    try {
      await updateDoc(doc(db, 'users', id), { emailVerified: nextVerified });
    } catch (err) {
      console.error("Failed to update verification status:", err);
    }
  } else if (editBtn) {
    const id = editBtn.dataset.id;
    const target = allUsers.find(u => u.id === id);
    if (target) openUserModal(target);
  } else if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    const targetUser = allUsers.find(u => u.id === id);
    if (!targetUser) return;

    const isTargetAdmin = (targetUser.role || '').toLowerCase() === 'admin' || (targetUser.email || '').toLowerCase().includes('admin');
    const totalAdminCount = allUsers.filter(u => (u.role || '').toLowerCase() === 'admin' || (u.email || '').toLowerCase().includes('admin')).length;

    if (isTargetAdmin && totalAdminCount <= 1) {
      showToast("Action Prohibited: Cannot delete the last remaining administrator account.", "error");
      return;
    }

    const userName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email;
    if (confirm(`Are you sure you want to permanently delete user "${userName}" (${targetUser.email}) and wipe out all associated user documents and appointments from Firestore?`)) {
      try {
        const userEmail = (targetUser.email || '').toLowerCase().trim();
        const userUid = targetUser.id || targetUser.uid;

        // 1. Delete matching user documents from Firestore 'users' collection
        try {
          const qUsers = query(collection(db, 'users'), where('email', '==', userEmail), limit(50));
          const allUsersSnap = await getDocs(qUsers);
          const batch = writeBatch(db);
          let userCount = 0;
          allUsersSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
            userCount++;
          });
          // Also explicitly delete by ID just in case email doesn't match
          batch.delete(doc(db, 'users', userUid));
          await batch.commit();
        } catch (err) {
          console.warn("Notice during admin user doc wipeout:", err);
        }

        // 2. Delete matching appointments from Firestore 'appointments' collection
        try {
          const qAppts = query(collection(db, 'appointments'), where('email', '==', userEmail), limit(100));
          const allApptsSnap = await getDocs(qAppts);
          const batch = writeBatch(db);
          let apptCount = 0;
          allApptsSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
            apptCount++;
          });
          if (apptCount > 0) await batch.commit();
        } catch (err) {
          console.warn("Notice cleaning user appointments on deletion:", err);
        }

        showToast(`User account for ${userName} has been successfully deleted.`);
      } catch (err) {
        showToast('Failed to delete user account: ' + err.message, 'error');
      }
    }
  }
});

function applyFilters() {
  const searchTerm = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
  const roleFilter = (document.getElementById('roleFilterSelect')?.value || 'all');

  filteredUsers = allUsers.filter(u => {
    let matchSearch = true;
    if (searchTerm) {
      matchSearch = (u.email || '').toLowerCase().includes(searchTerm) ||
        (u.firstName || '').toLowerCase().includes(searchTerm) ||
        (u.lastName || '').toLowerCase().includes(searchTerm);
    }

    let matchRole = true;
    if (roleFilter !== 'all') {
      if (roleFilter === 'verified') matchRole = Boolean(u.emailVerified);
      else if (roleFilter === 'unverified') matchRole = !u.emailVerified;
      else {
        const role = (u.role || (u.email.includes('admin') ? 'admin' : 'regular')).toLowerCase();
        matchRole = (role === roleFilter);
      }
    }
    return matchSearch && matchRole;
  });

  currentPage = 1;
  renderCurrentPage();
}

function renderCurrentPage() {
  const totalPagesDisplay = document.getElementById('totalPagesDisplay');
  const currentPageDisplay = document.getElementById('currentPageDisplay');

  const limit = parseInt(itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / limit) || 1;
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

  const pageUsers = filteredUsers.slice(startIndex, endIndex);
  renderUsers(pageUsers);
  updateBulkDeleteUI();
}

function updateBulkDeleteUI() {
  const checkboxes = document.querySelectorAll('.row-checkbox:not(:disabled)');
  const checked = document.querySelectorAll('.row-checkbox:checked:not(:disabled)');
  const selectAll = document.getElementById('selectAllUsers');
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

function setupPaginationAndFilters() {
  document.getElementById('userSearchInput')?.addEventListener('input', applyFilters);
  document.getElementById('roleFilterSelect')?.addEventListener('change', applyFilters);

  document.getElementById('userPerPageSelect')?.addEventListener('change', (e) => {
    itemsPerPage = e.target.value;
    applyFilters();
  });

  document.getElementById('btnFirstPage')?.addEventListener('click', () => { currentPage = 1; renderCurrentPage(); });
  document.getElementById('btnPrevPage')?.addEventListener('click', () => { currentPage--; renderCurrentPage(); });
  document.getElementById('btnNextPage')?.addEventListener('click', () => { currentPage++; renderCurrentPage(); });
  document.getElementById('btnLastPage')?.addEventListener('click', () => {
    const limit = parseInt(itemsPerPage);
    currentPage = Math.ceil(filteredUsers.length / limit) || 1;
    renderCurrentPage();
  });

  document.getElementById('selectAllUsers')?.addEventListener('change', (e) => {
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

    if (confirm(`Are you sure you want to permanently delete ${checked.length} selected users and their appointments?`)) {
      try {
        let batch = writeBatch(db);
        let opCount = 0;
        let deletedCount = 0;

        // 1. Fetch all docs concurrently (massive speedup)
        const fetchTasks = Array.from(checked).map(async (cb) => {
          const userUid = cb.dataset.id;
          const targetUser = allUsers.find(u => u.id === userUid);
          if (!targetUser) return null;

          const userEmail = (targetUser.email || '').toLowerCase().trim();
          let usersDocs = [];
          let apptsDocs = [];

          if (userEmail) {
            const qUsers = query(collection(db, 'users'), where('email', '==', userEmail), limit(10));
            const qAppts = query(collection(db, 'appointments'), where('email', '==', userEmail), limit(50));

            const [usersSnap, apptsSnap] = await Promise.all([
              getDocs(qUsers),
              getDocs(qAppts)
            ]);
            usersDocs = usersSnap.docs;
            apptsDocs = apptsSnap.docs;
          }

          return { userUid, usersDocs, apptsDocs };
        });

        // Wait for all concurrent fetches to complete
        const fetchResults = await Promise.all(fetchTasks);

        // 2. Queue batch deletes instantly
        for (const result of fetchResults) {
          if (!result) continue;

          for (const d of result.usersDocs) {
            batch.delete(d.ref);
            opCount++;
          }

          batch.delete(doc(db, 'users', result.userUid));
          opCount++;

          for (const d of result.apptsDocs) {
            batch.delete(d.ref);
            opCount++;
          }

          deletedCount++;

          // If batch gets too large, commit and reset
          if (opCount >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }

        if (opCount > 0) {
          await batch.commit();
        }

        showToast(`Successfully deleted ${deletedCount} users.`);
        const selectAll = document.getElementById('selectAllUsers');
        if (selectAll) selectAll.checked = false;
        updateBulkDeleteUI();
      } catch (err) {
        console.error("Delete failed:", err);
        showToast('Delete failed: ' + err.message, 'error');
      }
    }
  });
}

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = '../auth/login.html';
  });
});

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
        const closeBtn = modal.querySelector('.admin-modal-close, #closeUserModalBtn, #cancelUserModalBtn, [id^="close"], [id^="cancel"]');
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
