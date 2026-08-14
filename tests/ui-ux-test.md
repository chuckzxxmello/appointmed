# AppointMED UI/UX & Accessibility Testing Guide

This guide outlines manual testing protocols for verifying the visual design, responsive layouts, and accessibility features across the AppointMED platform.

---

## 1. Responsive Design & Layout Tests

### A. Mobile Viewport (iPhone 12 / Pixel 5)
* **Objective:** Ensure the layout adapts gracefully to screens ~390px wide.
* **Steps:**
  1. Open DevTools (`F12`) and enable Device Toolbar (`Ctrl+Shift+M`).
  2. Set the resolution to 390x844 (Mobile).
  3. Navigate through Auth, Admin Dashboard, Patient Profile, and Calendar pages.
* **Expected Result:**
  - Sidebar menus collapse into a "Hamburger" icon.
  - Modals resize to fit within the screen width with scrollable contents.
  - Grid columns (like the calendar) stack vertically or implement horizontal scroll if absolutely necessary.

### B. Tablet Viewport (iPad / Surface Pro)
* **Objective:** Ensure optimal spacing and typography on medium screens (~768px - 1024px).
* **Steps:**
  1. Set the resolution to 768x1024.
  2. Check the Admin Dashboard cards and Calendar grid.
* **Expected Result:**
  - Cards flow nicely (e.g., 2 columns instead of 3 or 4).
  - The calendar days display legibly without overlapping text.

---

## 2. Interaction & Micro-Animations

### A. Hover States and Glassmorphism
* **Objective:** Verify interactive elements provide immediate visual feedback.
* **Steps:**
  1. Hover over all buttons (`.btn-admin-pill`), calendar cells (`.cal-cell`), and appointment pills (`.cal-evt-pill`).
* **Expected Result:**
  - Buttons gently shift background colors and have subtle box-shadow changes.
  - Calendar cells highlight lightly (e.g., `#f8fafc`).
  - Appointment pills slightly dim (`filter: brightness(0.95)`).

### B. Modal Transitions & Drag Zones
* **Objective:** Ensure modals and drag drop zones open and close smoothly.
* **Steps:**
  1. Trigger any modal (e.g., "Add Appointment", "Delete User").
  2. Close the modal using the "X" button, the Cancel button, and the `Esc` key.
  3. Drag an appointment pill to trigger the bottom trash zone.
* **Expected Result:**
  - The background darkens smoothly (`.admin-modal-backdrop`).
  - Modals scale or fade in cleanly without aggressive clipping.
  - The delete drag zone slides up smoothly from the bottom with a red danger aesthetic.

---

## 3. Accessibility (a11y)

### A. Keyboard Navigation
* **Objective:** Verify that core workflows can be completed without a mouse.
* **Steps:**
  1. Use the `Tab` key to navigate through the login page and dashboard.
  2. Use the `Enter` or `Space` key to trigger buttons.
* **Expected Result:**
  - A visible focus ring outlines the currently selected input or button.
  - Modals trap focus (or at least provide an easy way to exit via `Esc`).

### B. Contrast & Readability
* **Objective:** Ensure text contrasts well against backgrounds.
* **Expected Result:**
  - Appointment pills use high-contrast text combinations (e.g., dark text on light colored backgrounds for Pending/Completed status, white text on primary blue).
