# AppointMED API & Security Rules Testing Guide

AppointMED runs on a **Serverless BaaS Architecture via Firebase Firestore**. In this model, Cloud Firestore Security Rules ([firestore.rules](file:///c:/projects/appointmed/firestore.rules)) serve as the declarative API gateway, validating every incoming read, create, update, and delete operation.

This guide provides instructions for testing the **Firestore REST API** directly using **Postman**, **Insomnia**, or **cURL** to validate authentication, authorization rules, and data payloads.

---

## 1. Acquiring a Firebase JWT Bearer Token

To authenticate REST API requests against protected collections, you must obtain a valid Firebase ID Token (JWT).

1. Open your AppointMED application in Google Chrome.
2. Sign in as an **Admin** or a **Patient**.
3. Open DevTools Console (`F12` -> `Console`) and run:
   ```javascript
   import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
   const auth = getAuth();
   const token = await auth.currentUser.getIdToken();
   console.log("Bearer Token:\n", token);
   ```
4. Copy the logged JWT token string.

---

## 2. REST API Base Configuration

- **Base URL:**
  ```text
  https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents
  ```
- **Authentication Header:**
  ```http
  Authorization: Bearer <YOUR_JWT_TOKEN>
  ```
- **Content-Type:**
  ```http
  Content-Type: application/json
  ```

---

## 3. REST API Test Endpoints & Scenarios

### A. List All Appointments
* **HTTP Method:** `GET`
* **URL:** `{{base_url}}/appointments`
* **Headers:** `Authorization: Bearer <ADMIN_OR_PATIENT_JWT>`
* **Expected Response:** `200 OK`
* **Sample Response Body:**
  ```json
  {
    "documents": [
      {
        "name": "projects/appointment-scheduling-s-57d01/databases/(default)/documents/appointments/doc123",
        "fields": {
          "firstName": { "stringValue": "Jane" },
          "lastName": { "stringValue": "Doe" },
          "email": { "stringValue": "jane.doe@example.com" },
          "appointmentDate": { "stringValue": "2026-08-20" },
          "appointmentTimeStart": { "stringValue": "10:00" },
          "appointmentTimeEnd": { "stringValue": "11:00" },
          "appointmentType": { "stringValue": "Physical Therapy" },
          "doctor": { "stringValue": "Dr. Smith" },
          "appointmentStatus": { "stringValue": "Confirmed" }
        },
        "createTime": "2026-08-14T02:30:00.000000Z",
        "updateTime": "2026-08-14T02:30:00.000000Z"
      }
    ]
  }
  ```

---

### B. Create a New Clinic Appointment
* **HTTP Method:** `POST`
* **URL:** `{{base_url}}/appointments`
* **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`
* **JSON Body:**
  ```json
  {
    "fields": {
      "firstName": { "stringValue": "Carlos" },
      "lastName": { "stringValue": "Mendez" },
      "email": { "stringValue": "carlos.mendez@example.com" },
      "phone": { "stringValue": "09171234567" },
      "appointmentDate": { "stringValue": "2026-08-25" },
      "appointmentTimeStart": { "stringValue": "14:00" },
      "appointmentTimeEnd": { "stringValue": "15:00" },
      "appointmentType": { "stringValue": "Occupational Therapy" },
      "doctor": { "stringValue": "Dr. Lee" },
      "appointmentStatus": { "stringValue": "Pending" },
      "createdAt": { "stringValue": "2026-08-14T11:00:00.000Z" }
    }
  }
  ```
* **Expected Response:** `200 OK` with the newly created document metadata.

---

### C. Update Appointment Status (Admin Action)
* **HTTP Method:** `PATCH`
* **URL:** `{{base_url}}/appointments/<DOCUMENT_ID>?updateMask.fieldPaths=appointmentStatus`
* **Headers:**
  - `Authorization: Bearer <ADMIN_JWT>`
  - `Content-Type: application/json`
* **JSON Body:**
  ```json
  {
    "fields": {
      "appointmentStatus": { "stringValue": "Completed" }
    }
  }
  ```
* **Expected Response:** `200 OK`

---

### D. Delete Appointment (Admin / Owner Action)
* **HTTP Method:** `DELETE`
* **URL:** `{{base_url}}/appointments/<DOCUMENT_ID>`
* **Headers:** `Authorization: Bearer <ADMIN_OR_OWNER_JWT>`
* **Expected Response:** `200 OK` (Empty response object `{}`)

---

## 4. Security Rules & Negative Testing (RBAC Verification)

Use these tests to verify that Firestore Security Rules strictly block unauthorized access:

| Test Scenario | Request Details | Expected HTTP Code | Validation Outcome |
| :--- | :--- | :--- | :--- |
| **Unauthenticated Read** | `GET {{base_url}}/users` with **NO Token** | `401 Unauthorized` | Rejects unauthenticated requests |
| **Patient Reading Users Collection** | `GET {{base_url}}/users` with **Patient JWT** | `403 Forbidden` | Enforces `isAdmin()` restriction |
| **Patient Modifying Other's Profile** | `PATCH {{base_url}}/users/<OTHER_UID>` with **Patient JWT** | `403 Forbidden` | Enforces `isOwner(userId)` restriction |
| **Patient Deleting Own Profile** | `DELETE {{base_url}}/users/<OWN_UID>` with **Owner JWT** | `200 OK` | Confirms self-service deletion allowed |
| **Admin Deleting Any User** | `DELETE {{base_url}}/users/<ANY_UID>` with **Admin JWT** | `200 OK` | Confirms admin role override |

---

## 5. Quick cURL Examples for Terminal Testing

### Test Public Announcement Fetch (Unauthenticated):
```bash
curl -X GET "https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents/announcements/portal_announcement"
```

### Test Protected Appointments List (Authenticated):
```bash
curl -X GET "https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents/appointments" \
  -H "Authorization: Bearer YOUR_FIREBASE_JWT"
```
