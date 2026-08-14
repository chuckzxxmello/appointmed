import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { initAdminNavProfile } from "./admin-shared.js";
import { showToast } from "./ui-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  initAdminNavProfile(auth);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '../auth/login.html';
      return;
    }

    // Verify admin role
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        window.location.href = '../auth/login.html';
        return;
      }
      
      // Load data once confirmed admin
      loadAnnouncements();
    } catch (err) {
      console.error("Auth check error:", err);
      window.location.href = '../auth/login.html';
    }
  });

  // Setup form listeners
  document.getElementById('reviewsForm').addEventListener('submit', (e) => handleSaveEmbeds(e, 'reviewsContainer', 'facebook_reviews', 'saveReviewsBtn', 'Reviews'));
  document.getElementById('portalAlertForm').addEventListener('submit', handleSavePortalAlerts);

  // Setup add buttons
  document.getElementById('addReviewBtn').addEventListener('click', () => addEmbedInput('reviewsContainer'));
  document.getElementById('addAlertBtn').addEventListener('click', () => addAlertInput('alertsContainer'));
});

async function loadAnnouncements() {
  try {
    // Load Reviews
    await loadEmbeds('facebook_reviews', 'reviewsContainer');

    // Load Portal Alerts
    const portalDoc = await getDoc(doc(db, "announcements", "portal_announcement"));
    const alertsContainer = document.getElementById('alertsContainer');
    alertsContainer.innerHTML = ''; // Clear container

    if (portalDoc.exists()) {
      const data = portalDoc.data();
      const alerts = data.alerts || [];
      
      // Fallback for old single-alert data structure
      if (alerts.length === 0 && data.title) {
        addAlertInput('alertsContainer', { isActive: data.isActive, title: data.title, description: data.description });
      } else {
        alerts.forEach(alert => addAlertInput('alertsContainer', alert));
      }
    }
    
    // Add default empty row if none
    if (alertsContainer.children.length === 0) addAlertInput('alertsContainer');

  } catch (err) {
    console.error("Error loading announcements:", err);
  }
}

async function loadEmbeds(docId, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const docSnap = await getDoc(doc(db, "announcements", docId));
  if (docSnap.exists()) {
    const embeds = docSnap.data().embeds || [];
    embeds.forEach(embed => addEmbedInput(containerId, embed));
  }
  
  if (container.children.length === 0) addEmbedInput(containerId);
}

// UI Helper: Add an Embed Input Row
function addEmbedInput(containerId, value = '') {
  const container = document.getElementById(containerId);
  if (container.children.length >= 10) {
    showToast("Maximum limit of 10 reached.", 'warning');
    return;
  }

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '0.5rem';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'embed-input';
  input.placeholder = '<iframe src="..."></iframe>';
  input.value = value;
  input.style.flex = '1';
  input.style.padding = '0.75rem';
  input.style.border = '1px solid #cbd5e1';
  input.style.borderRadius = '0.375rem';
  
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.innerHTML = '✕';
  delBtn.style.padding = '0 1rem';
  delBtn.style.background = '#fee2e2';
  delBtn.style.color = '#b91c1c';
  delBtn.style.border = 'none';
  delBtn.style.borderRadius = '0.375rem';
  delBtn.style.cursor = 'pointer';
  delBtn.onclick = () => row.remove();

  row.appendChild(input);
  row.appendChild(delBtn);
  container.appendChild(row);
}

// UI Helper: Add a Portal Alert Group
function addAlertInput(containerId, data = { isActive: true, title: '', description: '' }) {
  const container = document.getElementById(containerId);
  
  const card = document.createElement('div');
  card.className = 'alert-group';
  card.style.border = '1px solid #e2e8f0';
  card.style.padding = '1rem';
  card.style.borderRadius = '0.5rem';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '1rem';
  card.style.backgroundColor = '#f8fafc';

  const headerRow = document.createElement('div');
  headerRow.style.display = 'flex';
  headerRow.style.justifyContent = 'space-between';
  headerRow.style.alignItems = 'center';

  const statusSelect = document.createElement('select');
  statusSelect.className = 'alert-status';
  statusSelect.style.padding = '0.5rem';
  statusSelect.style.borderRadius = '0.375rem';
  statusSelect.style.border = '1px solid #cbd5e1';
  statusSelect.innerHTML = `
    <option value="active" ${data.isActive ? 'selected' : ''}>Active (Visible)</option>
    <option value="inactive" ${!data.isActive ? 'selected' : ''}>Inactive (Hidden)</option>
  `;

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = 'Remove Alert';
  delBtn.style.padding = '0.5rem 1rem';
  delBtn.style.background = '#fee2e2';
  delBtn.style.color = '#b91c1c';
  delBtn.style.border = 'none';
  delBtn.style.borderRadius = '0.375rem';
  delBtn.style.cursor = 'pointer';
  delBtn.style.fontSize = '0.875rem';
  delBtn.onclick = () => card.remove();

  headerRow.appendChild(statusSelect);
  headerRow.appendChild(delBtn);

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'alert-title';
  titleInput.placeholder = 'Alert Title (e.g. Website Maintenance)';
  titleInput.value = data.title;
  titleInput.style.padding = '0.75rem';
  titleInput.style.border = '1px solid #cbd5e1';
  titleInput.style.borderRadius = '0.375rem';

  const descInput = document.createElement('textarea');
  descInput.className = 'alert-desc';
  descInput.placeholder = 'Alert Description...';
  descInput.value = data.description;
  descInput.rows = 3;
  descInput.style.padding = '0.75rem';
  descInput.style.border = '1px solid #cbd5e1';
  descInput.style.borderRadius = '0.375rem';
  descInput.style.fontFamily = 'inherit';

  card.appendChild(headerRow);
  card.appendChild(titleInput);
  card.appendChild(descInput);
  
  container.appendChild(card);
}

// Handlers
async function handleSaveEmbeds(e, containerId, docId, btnId, name) {
  e.preventDefault();
  const btn = document.getElementById(btnId);
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('.embed-input');
    const embeds = [];
    inputs.forEach(input => {
      const val = input.value.trim();
      if (val) embeds.push(val);
    });

    await setDoc(doc(db, "announcements", docId), { embeds }, { merge: true });
    showToast(`${name} saved successfully!`);
  } catch (err) {
    console.error(`Error saving ${name}:`, err);
    showToast("Failed to save. Ensure you have admin permissions.", 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function handleSavePortalAlerts(e) {
  e.preventDefault();
  const btn = document.getElementById('savePortalBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const container = document.getElementById('alertsContainer');
    const groups = container.querySelectorAll('.alert-group');
    const alerts = [];
    
    groups.forEach(group => {
      const isActive = group.querySelector('.alert-status').value === 'active';
      const title = group.querySelector('.alert-title').value.trim();
      const description = group.querySelector('.alert-desc').value.trim();
      
      if (title || description) {
        alerts.push({ isActive, title, description });
      }
    });

    const payload = {
      alerts: alerts,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "announcements", "portal_announcement"), payload);
    showToast("Portal Alerts saved successfully!");
  } catch (err) {
    console.error("Error saving portal alerts:", err);
    showToast("Failed to save portal alert. Ensure you have admin permissions.", 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
