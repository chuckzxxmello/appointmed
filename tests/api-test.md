# API & Security Rules Testing Guide

AppointMED runs on a **Serverless BaaS Architecture via Firebase Firestore**. In this model, Cloud Firestore Security Rules **"firestore.rules"** serve as the declarative API gateway, validating every incoming **(CRUD)** read, create, update, and delete operations.

This guide provides instructions for testing the **Firestore REST API** to validate authentication, authorization rules, and data payloads.

> **We highly recommend using Postman** as your primary API testing tool for this project. The setup instructions below are tailored for Postman using Environment Variables (`{{base_url}}` and `{{jwt_token}}`) for the fastest workflow. Alternative instructions for Swagger UI and cURL are provided beneath each scenario.

## 1. Acquiring a Firebase JWT Bearer Token

To authenticate REST API requests against protected collections, you must obtain a valid Firebase ID Token (JWT).

1. Open your AppointMED application in Google Chrome.
2. Sign in as an **Admin** or a **Patient**.
3. Open DevTools Console (`F12` -> `Console`) and run:
   ```javascript
   const { getAuth } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");
   const auth = getAuth();
   const token = await auth.currentUser.getIdToken();
   console.log("Bearer Token:\n", token);
   ```
4. Copy the logged JWT token string.

## 2. Postman Environment Setup (Recommended)

To make testing significantly easier, we recommend setting up a **Postman Environment** with the following two variables so you don't have to repeatedly paste them:

1. **`base_url`**: 
   ```text
   https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents
   ```
2. **`jwt_token`**: Paste the token string you extracted from the browser console in Step 1.

You can now use `{{base_url}}` for your request URLs and `{{jwt_token}}` in the **Authorization -> Bearer Token** tab in all subsequent Postman requests!

## 3. How to Find a Document ID (`<DOCUMENT_ID>`)

When you see `<DOCUMENT_ID>` in the testing scenarios below (such as `PATCH` or `DELETE` requests), you must replace it with a real Firestore document ID.

To find a Document ID:
1. Run a `GET` request to list the documents (e.g., `GET {{base_url}}/appointments`).
2. Look at the `"name"` property in the response:
   ```json
   "name": "projects/.../databases/(default)/documents/appointments/B58qSpCx14g4ZpEZxCIB"
   ```
3. The alphanumeric string at the very end (`B58qSpCx14g4ZpEZxCIB`) is the Document ID.
4. Replace `<DOCUMENT_ID>` in your URL with that string.

## 4. REST API Test Endpoints & Scenarios

### A. List All Appointments
* **HTTP Method:** `GET`
* **URL:** `/appointments`
* **Headers:** `Authorization: Bearer <ADMIN_OR_PATIENT_JWT>`
* **Expected Response:** `200 OK`

#### Example Tests
* **Postman:**
  - Method: `GET`
  - URL: `{{base_url}}/appointments`
  - Auth Tab: Bearer Token -> `{{jwt_token}}`
  - Click **Send**.
* **Swagger UI:**
  - Open Swagger UI via `tests/openapi.yaml`.
  - Click **Authorize** and paste your JWT token.
  - Expand `GET /appointments`, click **Try it out**, then **Execute**.
* **cURL:**
  ```bash
  curl -X GET "https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents/appointments" \
    -H "Authorization: Bearer YOUR_FIREBASE_JWT"
  ```

### B. Create a New Clinic Appointment
* **HTTP Method:** `POST`
* **URL:** `/appointments`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>` | `Content-Type: application/json`
* **Expected Response:** `200 OK`

#### Example Tests
* **Postman:**
  - Method: `POST`
  - URL: `{{base_url}}/appointments`
  - Auth Tab: Bearer Token -> `{{jwt_token}}`
  - Body Tab: Select `raw` and `JSON`, then paste the JSON body below.
  - Click **Send**.
* **Swagger UI:**
  - Expand `POST /appointments`, click **Try it out**.
  - Swagger pre-fills the JSON body. Click **Execute**.
* **cURL:**
  ```bash
  curl -X POST "https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents/appointments" \
    -H "Authorization: Bearer YOUR_FIREBASE_JWT" \
    -H "Content-Type: application/json" \
    -d '{ "fields": { "firstName": { "stringValue": "Carlos" }, "appointmentStatus": { "stringValue": "Pending" } } }'
  ```
**JSON Body for Postman:**
```json
{
  "fields": {
    "firstName": { "stringValue": "Carlos" },
    "lastName": { "stringValue": "Mendez" },
    "appointmentStatus": { "stringValue": "Pending" }
  }
}
```

### C. Update Appointment Status (Admin Action)
* **HTTP Method:** `PATCH`
* **URL:** `/appointments/<DOCUMENT_ID>?updateMask.fieldPaths=appointmentStatus`
* **Headers:** `Authorization: Bearer <ADMIN_JWT>` | `Content-Type: application/json`
* **Expected Response:** `200 OK`

#### Example Tests
* **Postman:**
  - Method: `PATCH`
  - URL: `{{base_url}}/appointments/<DOCUMENT_ID>?updateMask.fieldPaths=appointmentStatus` (replace `<DOCUMENT_ID>`)
  - Auth Tab: Bearer Token -> `{{jwt_token}}` (Must be an Admin token)
  - Body Tab: Select `raw` and `JSON`, then paste the JSON body below.
  - Click **Send**.
* **Swagger UI:**
  - Expand `PATCH /appointments/{documentId}`, click **Try it out**.
  - Enter the Document ID in the `documentId` field, and `appointmentStatus` in the `updateMask.fieldPaths` field.
  - Swagger pre-fills the JSON body. Click **Execute**.
* **cURL:**
  ```bash
  curl -X PATCH "https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents/appointments/<DOCUMENT_ID>?updateMask.fieldPaths=appointmentStatus" \
    -H "Authorization: Bearer YOUR_ADMIN_JWT" \
    -H "Content-Type: application/json" \
    -d '{ "fields": { "appointmentStatus": { "stringValue": "Completed" } } }'
  ```
**JSON Body for Postman:**
```json
{
  "fields": {
    "appointmentStatus": { "stringValue": "Completed" }
  }
}
```

### D. Delete Appointment (Admin / Owner Action)
* **HTTP Method:** `DELETE`
* **URL:** `/appointments/<DOCUMENT_ID>`
* **Headers:** `Authorization: Bearer <ADMIN_OR_OWNER_JWT>`
* **Expected Response:** `200 OK`

#### Example Tests
* **Postman:**
  - Method: `DELETE`
  - URL: `{{base_url}}/appointments/<DOCUMENT_ID>` (replace `<DOCUMENT_ID>`)
  - Auth Tab: Bearer Token -> `{{jwt_token}}`
  - Click **Send**.
* **Swagger UI:**
  - Expand `DELETE /appointments/{documentId}`, click **Try it out**.
  - Enter the Document ID in the `documentId` field.
  - Click **Execute**.
* **cURL:**
  ```bash
  curl -X DELETE "https://firestore.googleapis.com/v1/projects/appointment-scheduling-s-57d01/databases/(default)/documents/appointments/<DOCUMENT_ID>" \
    -H "Authorization: Bearer YOUR_FIREBASE_JWT"
  ```

## 5. Security Rules & Negative Testing (RBAC Verification)

Use these tests to verify that Firestore Security Rules strictly block unauthorized access:

| Test Scenario | Request Details | Expected HTTP Code | Validation Outcome |
| :--- | :--- | :--- | :--- |
| **Unauthenticated Read** | `GET {{base_url}}/users` with **NO Token** | `401 Unauthorized` | Rejects unauthenticated requests |
| **Patient Reading Users Collection** | `GET {{base_url}}/users` with **Patient JWT** | `403 Forbidden` | Enforces `isAdmin()` restriction |
| **Patient Modifying Other's Profile** | `PATCH {{base_url}}/users/<OTHER_UID>` with **Patient JWT** | `403 Forbidden` | Enforces `isOwner(userId)` restriction |
| **Patient Deleting Own Profile** | `DELETE {{base_url}}/users/<OWN_UID>` with **Owner JWT** | `200 OK` | Confirms self-service deletion allowed |
| **Admin Deleting Any User** | `DELETE {{base_url}}/users/<ANY_UID>` with **Admin JWT** | `200 OK` | Confirms admin role override |
