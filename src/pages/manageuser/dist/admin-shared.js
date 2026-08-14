import { getAuth, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

export function initAdminNavProfile(auth) {
  if (!auth) return;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const displayName = user.displayName || 'Admin';
      const nameElements = document.querySelectorAll('.nav-user-badge strong, #adminDisplayName');
      nameElements.forEach(el => el.textContent = displayName);

      const emailInput = document.getElementById('profileModalEmail');
      const nameInput = document.getElementById('profileModalName');
      if (emailInput) emailInput.value = user.email || '';
      if (nameInput) nameInput.value = displayName;
    }
  });

  const userBadge = document.querySelector('.nav-user-badge');
  if (userBadge) {
    userBadge.setAttribute('title', 'Click to edit Admin Profile & Password');
    userBadge.addEventListener('click', () => {
      openProfileModal();
    });
  }

  setupProfileModalHandlers(auth);
}

export function openProfileModal() {
  const modal = document.getElementById('adminProfileModal');
  if (modal) modal.classList.add('active');
}

export function closeProfileModal() {
  const modal = document.getElementById('adminProfileModal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('adminProfileForm');
  if (form) form.reset();
}

function setupProfileModalHandlers(auth) {
  const closeBtn = document.getElementById('closeProfileModalBtn');
  const cancelBtn = document.getElementById('cancelProfileModalBtn');
  const form = document.getElementById('adminProfileForm');

  if (closeBtn) closeBtn.addEventListener('click', closeProfileModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeProfileModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) {
        alert('Display Name updated!');
        closeProfileModal();
        return;
      }

      const newName = document.getElementById('profileModalName')?.value.trim();
      const currentPass = document.getElementById('profileModalCurrentPassword')?.value;
      const newPass = document.getElementById('profileModalPassword')?.value;
      const confirmPass = document.getElementById('profileModalConfirm')?.value;

      try {
        if (newName && newName !== user.displayName) {
          await updateProfile(user, { displayName: newName });
          const nameElements = document.querySelectorAll('.nav-user-badge strong, #adminDisplayName');
          nameElements.forEach(el => el.textContent = newName);
        }

        if (newPass) {
          if (newPass.length < 6) {
            alert('New password must be at least 6 characters.');
            return;
          }
          if (newPass !== confirmPass) {
            alert('New passwords do not match.');
            return;
          }

          let passToReauth = currentPass;
          if (!passToReauth) {
            passToReauth = prompt('Security Check: Enter your CURRENT password to authorize password update:');
            if (!passToReauth) {
              alert('Password update cancelled: Current password is required.');
              return;
            }
          }

          const credential = EmailAuthProvider.credential(user.email, passToReauth);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPass);
          alert('Password updated successfully!');
        } else if (newName && newName !== user.displayName) {
          alert('Profile display name updated successfully!');
        }

        closeProfileModal();
      } catch (err) {
        console.error('Error updating profile:', err);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          alert('Failed to update password: Current password entered is incorrect.');
        } else {
          alert('Failed to update profile: ' + err.message);
        }
      }
    });
  }
}

export function getProfileModalHTML() {
  return `
    <div class="admin-modal-backdrop" id="adminProfileModal">
      <div class="admin-modal-card">
        <div class="admin-modal-header">
          <h2>Admin Profile & Security Settings</h2>
          <button class="admin-modal-close" id="closeProfileModalBtn">&times;</button>
        </div>
        <form id="adminProfileForm">
          <div class="form-group-admin">
            <label>Admin Email Account</label>
            <input type="email" id="profileModalEmail" disabled style="background-color: var(--bg-main); color: var(--text-muted);">
          </div>
          <div class="form-group-admin">
            <label>Display Name</label>
            <input type="text" id="profileModalName" placeholder="Admin Name" required>
          </div>
          <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 1.25rem 0;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">Change Password</h3>
          <div class="form-group-admin">
            <label>Current Password (Required to change password)</label>
            <input type="password" id="profileModalCurrentPassword" placeholder="Enter current password">
          </div>
          <div class="form-group-admin">
            <label>New Password</label>
            <input type="password" id="profileModalPassword" placeholder="Leave blank to keep current password">
          </div>
          <div class="form-group-admin">
            <label>Confirm New Password</label>
            <input type="password" id="profileModalConfirm" placeholder="Re-type new password">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-admin-pill btn-pill-secondary" id="cancelProfileModalBtn">Cancel</button>
            <button type="submit" class="btn-admin-pill btn-pill-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
