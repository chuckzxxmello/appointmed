import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { showToast } from "./ui-utils.js";

export function initAdminNavProfile(auth) {
  if (!auth) return;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const displayName = user.displayName || 'Admin';
      const nameElements = document.querySelectorAll('.nav-user-badge strong, #adminDisplayName');
      nameElements.forEach(el => el.textContent = displayName);

      const emailInput = document.getElementById('profileModalEmail');
      const nameInput = document.getElementById('profileModalName');
      if (emailInput) emailInput.value = user.email || '';
      if (nameInput) nameInput.value = displayName;

      // Load dev analytics toggle setting from Firestore
      await syncDevAnalyticsSetting(user);
    }
  });

  // Universal Sign Out Listener for all Admin components
  document.querySelectorAll('#adminLogoutBtn, #signOutBtn, #logoutBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      signOut(auth).then(() => {
        window.location.href = '../auth/login.html';
      }).catch(() => {
        window.location.href = '../auth/login.html';
      });
    });
  });

  // Attach modal trigger to badge
  const userBadge = document.querySelector('.nav-user-badge');
  if (userBadge) {
    userBadge.setAttribute('title', 'Click to edit Admin Profile & Password');
    userBadge.addEventListener('click', () => {
      openProfileModal();
    });
  }

  setupProfileModalHandlers(auth);
}

async function syncDevAnalyticsSetting(user) {
  const toggle = document.getElementById('profileModalDevToggle');
  const slider = document.getElementById('profileModalDevSlider');
  const knob = document.getElementById('profileModalDevKnob');
  const devLink = document.getElementById('devAnalyticsLink');

  function updateToggleUI(checked) {
    if (slider) slider.style.backgroundColor = checked ? '#1e3a8a' : '#cbd5e1';
    if (knob) knob.style.left = checked ? '23px' : '3px';
    if (devLink) devLink.style.display = checked ? '' : 'none';
  }

  let isEnabled = false;
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().showDevAnalytics !== undefined) {
      isEnabled = Boolean(userDoc.data().showDevAnalytics);
    }
  } catch (err) {
    console.log("Could not fetch dev analytics setting:", err);
  }

  if (toggle) {
    toggle.checked = isEnabled;
    updateToggleUI(isEnabled);

    // Remove old event listener by replacing node if re-initialized
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    newToggle.checked = isEnabled;

    newToggle.addEventListener('change', async () => {
      const checked = newToggle.checked;
      const newSlider = document.getElementById('profileModalDevSlider');
      const newKnob = document.getElementById('profileModalDevKnob');
      if (newSlider) newSlider.style.backgroundColor = checked ? '#1e3a8a' : '#cbd5e1';
      if (newKnob) newKnob.style.left = checked ? '23px' : '3px';
      if (devLink) devLink.style.display = checked ? '' : 'none';

      try {
        await setDoc(doc(db, 'users', user.uid), {
          showDevAnalytics: checked
        }, { merge: true });
        showToast('Analytics preference saved.');
      } catch (err) {
        console.warn("Could not save dev analytics setting:", err);
        showToast('Failed to save settings.', 'error');
      }
    });
  } else {
    if (devLink) devLink.style.display = isEnabled ? '' : 'none';
  }
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
        showToast('User session not found.', 'error');
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

          // Also save updated name to Firestore user document
          await setDoc(doc(db, 'users', user.uid), {
            displayName: newName
          }, { merge: true });
        }

        if (newPass) {
          if (newPass.length < 6) {
            showToast('New password must be at least 6 characters.', 'warning');
            return;
          }
          if (newPass !== confirmPass) {
            showToast('New passwords do not match.', 'error');
            return;
          }

          let passToReauth = currentPass;
          if (!passToReauth) {
            passToReauth = prompt('Security Check: Enter your CURRENT password to authorize password update:');
            if (!passToReauth) {
              showToast('Password update cancelled: Current password is required.', 'warning');
              return;
            }
          }

          const credential = EmailAuthProvider.credential(user.email, passToReauth);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPass);
          showToast('Password updated successfully!');
        } else if (newName && newName !== user.displayName) {
          showToast('Profile display name updated successfully!');
        }

        closeProfileModal();
      } catch (err) {
        console.error('Error updating admin profile:', err);
        showToast('Failed to update profile: ' + err.message, 'error');
      }
    });
  }
}

export function getProfileModalHTML() {
  return `
    <style>
      .admin-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        z-index: 2000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .admin-modal-overlay.active {
        display: flex !important;
      }
      .admin-modal-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        animation: adminModalFadeIn 0.2s ease-out;
      }
      @keyframes adminModalFadeIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .admin-modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f8fafc;
      }
      .admin-modal-header h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      .admin-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #64748b;
        cursor: pointer;
        line-height: 1;
        padding: 0.2rem;
      }
      .admin-modal-close:hover {
        color: #0f172a;
      }
      .admin-modal-body {
        padding: 1.5rem;
      }
      .admin-modal-body .form-group {
        margin-bottom: 1rem;
      }
      .admin-modal-body .form-group label {
        display: block;
        font-size: 0.825rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.35rem;
      }
      .admin-modal-body .form-input {
        width: 100%;
        padding: 0.6rem 0.85rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        color: #0f172a;
        box-sizing: border-box;
      }
      .admin-modal-body .form-input:disabled {
        background-color: #f1f5f9;
        color: #64748b;
      }
      .admin-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
      }
    </style>
    <div id="adminProfileModal" class="admin-modal-overlay">
      <div class="admin-modal-card">
        <div class="admin-modal-header">
          <h3>Edit Admin Profile</h3>
          <button id="closeProfileModalBtn" class="admin-modal-close">&times;</button>
        </div>
        <form id="adminProfileForm" class="admin-modal-body">
          <div class="form-group">
            <label for="profileModalName">Display Name</label>
            <input type="text" id="profileModalName" class="form-input" required />
          </div>
          <div class="form-group">
            <label for="profileModalEmail">Email Address</label>
            <input type="email" id="profileModalEmail" class="form-input" disabled />
          </div>
          <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e2e8f0;" />
          <div class="form-group">
            <label for="profileModalCurrentPassword">Current Password (required for password change)</label>
            <input type="password" id="profileModalCurrentPassword" class="form-input" placeholder="Enter current password" />
          </div>
          <div class="form-group">
            <label for="profileModalPassword">New Password (leave blank to keep current)</label>
            <input type="password" id="profileModalPassword" class="form-input" placeholder="New password" />
          </div>
          <div class="form-group">
            <label for="profileModalConfirm">Confirm New Password</label>
            <input type="password" id="profileModalConfirm" class="form-input" placeholder="Confirm new password" />
          </div>
          
          <hr style="margin: 1.25rem 0 1rem; border: none; border-top: 1px solid #e2e8f0;" />
          <!-- Developer Analytics Toggle Switch at Most Bottom Part -->
          <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem;">
            <div>
              <strong style="font-size: 0.85rem; color: #0f172a; display: block;">Developer Analytics</strong>
              <span style="font-size: 0.75rem; color: #64748b;">Show or hide developer analytics button</span>
            </div>
            <label style="position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; cursor: pointer;">
              <input type="checkbox" id="profileModalDevToggle" style="opacity: 0; width: 0; height: 0;" />
              <span id="profileModalDevSlider" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; border-radius: 24px; transition: 0.3s;">
                <span id="profileModalDevKnob" style="position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.3s;"></span>
              </span>
            </label>
          </div>

          <div class="admin-modal-footer">
            <button type="button" id="cancelProfileModalBtn" class="btn-secondary" style="background: #ffffff; border: 1px solid #cbd5e1; padding: 0.45rem 1rem; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
            <button type="submit" class="btn-primary" style="background: #18181b; color: #ffffff; border: 1px solid #18181b; padding: 0.45rem 1rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Global Escape key handler for modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay, .admin-modal-backdrop, .admin-modal-overlay');
    modals.forEach(modal => {
      // Check if modal is visible
      if (!modal.classList.contains('hidden') && modal.style.display !== 'none') {
        const closeBtn = modal.querySelector('.admin-modal-close, #closeProfileModalBtn, #cancelProfileModalBtn, [id^="close"], [id^="cancel"]');
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
