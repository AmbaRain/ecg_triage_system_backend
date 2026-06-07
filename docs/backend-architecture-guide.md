# ECG Triage Backend Architecture and Implementation Guide

This document is the working handoff for the Java backend team. It explains the intended backend folder structure, the role of each Java class, and the exact coding responsibilities for each layer of the ECG Triage System.

The backend should follow a strict MVC plus N-tier architecture:

Browser / Frontend
-> Controller layer
-> Service layer
-> DAO layer
-> Database

Each layer should talk only to the layer directly below it. Do not put SQL in servlets. Do not read HTTP request data in DAOs. Do not let model classes contain business logic.

## 1. Project Tree

The backend code should be organized under `src/main/java` using these packages:

```text
src/main/java/
├── controller/
│   ├── AuthServlet.java
│   ├── DashboardServlet.java
│   ├── UploadServlet.java
│   ├── PredictionServlet.java
│   └── PatientServlet.java
├── model/
│   ├── User.java
│   ├── Patient.java
│   ├── Prediction.java
│   └── ECGRecord.java
├── dao/
│   ├── UserDAO.java
│   ├── PatientDAO.java
│   ├── PredictionDAO.java
│   └── ECGRecordDAO.java
├── service/
│   ├── AuthService.java
│   ├── PredictionService.java
│   ├── DashboardService.java
│   └── PatientService.java
└── util/
    ├── DBConnection.java
    ├── FileUploader.java
    └── ValidationUtil.java
```

This structure is intentionally small and clean. It is enough for a school project, but still professional enough to show proper separation of concerns.

## 2. Package Responsibilities

### controller/

This package contains the servlets. Servlets are the entry point for browser and frontend requests.

Their job is to:

1. Read request data from `HttpServletRequest`.
2. Validate that required parameters are present.
3. Call the correct service method.
4. Return JSON or the proper HTTP response code through `HttpServletResponse`.

Controllers should not contain SQL, database access, or complex business logic.

### model/

This package contains plain Java objects that represent database records.

Their job is to:

1. Hold data.
2. Map directly to database tables or query results.
3. Provide constructors, getters, setters, and optionally `toString()`.

Model classes should not perform calculations, file I/O, SQL, or HTTP handling.

### dao/

This package contains Data Access Objects.

Their job is to:

1. Run SQL queries.
2. Use JDBC and `PreparedStatement`.
3. Convert `ResultSet` rows into model objects.
4. Insert, update, delete, and fetch records from MySQL.

DAO classes should never read HTTP parameters or know anything about servlets.

### service/

This package contains the business logic.

Its job is to:

1. Coordinate multiple DAOs.
2. Enforce application rules.
3. Handle authentication logic.
4. Process ECG file workflows.
5. Talk to the Python prediction microservice.

This is the layer that decides what the application should do, not just how to fetch data.

### util/

This package contains shared helper classes.

Its job is to:

1. Provide reusable infrastructure code.
2. Manage database connections.
3. Save uploaded files.
4. Validate input and file sizes.

Utilities should stay generic and reusable.

## 3. Class-by-Class Responsibilities

### controller/AuthServlet.java

Purpose: handles login and logout.

Expected responsibilities:

1. Accept login requests from the frontend.
2. Read username/email and password from the request.
3. Call `AuthService` to verify credentials.
4. Create or destroy the session as needed.
5. Return a JSON response showing success or failure.

Typical endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`

Expected output:

- On success: authenticated user information, session token, or session status.
- On failure: clear error message and `401 Unauthorized`.

### controller/DashboardServlet.java

Purpose: returns the dashboard summary.

Expected responsibilities:

1. Verify that the current user is authenticated.
2. Call `DashboardService`.
3. Return dashboard counts and summary metrics as JSON.

Typical endpoint:

- `GET /api/dashboard`

Expected output:

- Total patients
- Total uploaded ECGs
- Total predictions
- Recent activity or recent records

### controller/UploadServlet.java

Purpose: receives ECG files from the frontend and starts the prediction workflow.

Expected responsibilities:

1. Accept multipart upload requests.
2. Validate file size and file type.
3. Save the uploaded file through `FileUploader`.
4. Pass the saved file path or upload metadata to `PredictionService`.
5. Return the created ECG record and prediction result.

Typical endpoint:

- `POST /api/ecg/upload`

Expected output:

- Upload status
- Stored file path or upload ID
- Prediction result
- Confidence score

### controller/PredictionServlet.java

Purpose: fetches prediction details by ID.

Expected responsibilities:

1. Read the prediction ID from the URL or query string.
2. Call `PredictionService`.
3. Return the prediction record as JSON.

Typical endpoint:

- `GET /api/predictions/{id}`

Expected output:

- Prediction label
- Confidence score
- Timestamp
- Related ECG record or patient reference

### controller/PatientServlet.java

Purpose: manages patient list and patient detail requests.

Expected responsibilities:

1. Return all patients or a single patient record.
2. Call `PatientService` for fetch operations.
3. Return patient profile and history in JSON.

Typical endpoints:

- `GET /api/patients`
- `GET /api/patients/{id}`

Expected output:

- Patient list for tables and search
- Single patient profile
- Prediction history if needed

### model/User.java

Purpose: represents a system user such as a clinician or admin.

Suggested fields:

- `id`
- `username`
- `passwordHash`
- `fullName`
- `role`

What the backend team should code:

1. Private fields.
2. Constructors.
3. Getters and setters.
4. Optional `toString()` for debugging.

### model/Patient.java

Purpose: represents a patient record.

Suggested fields:

- `id`
- `fullName`
- `dob`
- `sex`
- `createdAt`
- `updatedAt`

What the backend team should code:

1. Data-only structure.
2. Standard accessors.
3. Any simple helper constructors needed for DAO mapping.

### model/Prediction.java

Purpose: represents a prediction result from the ECG model.

Suggested fields:

- `id`
- `patientId`
- `recordId`
- `primaryLabel`
- `confidence`
- `predictionTime`
- `notes` or `riskLevel` if needed

What the backend team should code:

1. Store prediction metadata.
2. Allow DAO and service layers to serialize and return results.

### model/ECGRecord.java

Purpose: stores metadata for an uploaded ECG file.

Suggested fields:

- `id`
- `patientId`
- `filePath`
- `fileName`
- `fileFormat`
- `uploadedAt`

What the backend team should code:

1. Keep track of the stored file location.
2. Support linking the file to the prediction result.

### dao/UserDAO.java

Purpose: user lookup and authentication support.

Expected methods:

- `findByUsername(String username)`
- `findByEmail(String email)` if login uses email
- `insert(User user)` if registration is needed

What the backend team should code:

1. SQL for fetching user data.
2. Password hash retrieval for login checks.
3. Mapping `ResultSet` values into `User` objects.

### dao/PatientDAO.java

Purpose: patient database operations.

Expected methods:

- `findAll()`
- `findAll(int limit, int offset)`
- `findById(int id)`
- `insert(Patient patient)`
- `update(Patient patient)` if editing is needed

What the backend team should code:

1. Patient listing queries.
2. Pagination support if patient count grows.
3. Fetching full patient data for profile pages.

### dao/PredictionDAO.java

Purpose: prediction database operations.

Expected methods:

- `insert(Prediction prediction)`
- `findById(int id)`
- `findByPatientId(int patientId)`
- `findLatestByPatientId(int patientId)` if needed

What the backend team should code:

1. Store the model output in the database.
2. Fetch prediction history for patient details.

### dao/ECGRecordDAO.java

Purpose: stores ECG file metadata.

Expected methods:

- `insert(ECGRecord record)`
- `findById(int id)`
- `findByPatientId(int patientId)`

What the backend team should code:

1. Save file metadata after upload.
2. Link the saved file to the patient and prediction.

### service/AuthService.java

Purpose: validates login credentials and manages authentication flow.

Expected responsibilities:

1. Receive login data from `AuthServlet`.
2. Ask `UserDAO` for the matching user record.
3. Compare the password using a secure hash strategy.
4. Return an authenticated result or failure message.

What the backend team should code:

1. Credential verification logic.
2. Session or token creation if required.
3. Login failure handling.

### service/DashboardService.java

Purpose: builds dashboard metrics for the frontend.

Expected responsibilities:

1. Call multiple DAOs for counts and recent records.
2. Aggregate values into a dashboard response object.
3. Keep the servlet thin by doing the aggregation here.

What the backend team should code:

1. Total patient count.
2. Total ECG upload count.
3. Total prediction count.
4. Recent activity summaries.

### service/PredictionService.java

Purpose: runs the ECG prediction workflow.

Expected responsibilities:

1. Receive upload metadata or file path from the servlet.
2. Validate that the file is usable.
3. Send the ECG data to the Python model API.
4. Read the prediction response.
5. Save prediction results through `PredictionDAO`.
6. Return the finished prediction object.

What the backend team should code:

1. REST client integration using `HttpClient` or similar.
2. JSON parsing for the model response.
3. Error handling when the ML service is unavailable.
4. Persistence of the prediction output.

### service/PatientService.java

Purpose: coordinates patient-related logic.

Expected responsibilities:

1. Fetch patient lists.
2. Build full patient profile views.
3. Combine patient data with prediction history when required.

What the backend team should code:

1. Retrieval of patient records.
2. Validation for patient creation or updates.
3. Optional history aggregation for profile pages.

### util/DBConnection.java

Purpose: provides database connections.

Expected responsibilities:

1. Load database driver.
2. Return JDBC connections.
3. Centralize database URL, username, and password configuration.

What the backend team should code:

1. A reusable connection helper.
2. A safe way to close or reuse connections.
3. Standard MySQL connection setup.

### util/FileUploader.java

Purpose: handles file storage on the server.

Expected responsibilities:

1. Accept uploaded ECG files.
2. Save them to a secure location.
3. Return the stored file path or file metadata.

What the backend team should code:

1. Multipart file handling.
2. File naming and folder creation.
3. Safe storage rules for ECG files.

### util/ValidationUtil.java

Purpose: validates input before business logic or storage.

Expected responsibilities:

1. Validate email formats.
2. Validate required text fields.
3. Enforce file size and file type constraints.
4. Normalize or sanitize input where needed.

What the backend team should code:

1. Email validation helpers.
2. String trimming and emptiness checks.
3. ECG file validation rules.

## 4. How the Layers Work Together

### Authentication flow

1. Frontend sends login data to `AuthServlet`.
2. `AuthServlet` calls `AuthService`.
3. `AuthService` calls `UserDAO`.
4. `UserDAO` queries MySQL.
5. The result goes back up to the servlet.
6. The servlet returns JSON to the frontend.

### ECG upload and prediction flow

1. Frontend uploads the ECG file to `UploadServlet`.
2. `UploadServlet` validates and stores the file using `FileUploader`.
3. `UploadServlet` calls `PredictionService`.
4. `PredictionService` sends data to the Python ML service.
5. The ML service returns a result.
6. `PredictionService` saves the result using `PredictionDAO`.
7. The servlet returns the final response to the frontend.

### Patient history flow

1. Frontend requests the patient list or patient details.
2. `PatientServlet` calls `PatientService`.
3. `PatientService` calls the relevant DAO classes.
4. DAO classes fetch patient and prediction records.
5. The servlet returns a JSON response.

## 5. Rules the Backend Team Should Follow

1. Keep servlets thin.
2. Put SQL only in DAO classes.
3. Put application rules only in service classes.
4. Keep model classes as simple data holders.
5. Put reusable helpers in `util`.
6. Use prepared statements for every query.
7. Return clear HTTP status codes.
8. Keep API responses consistent and JSON-based.
9. Handle exceptions gracefully and log useful errors.
10. Never hardcode secrets in source files.

## 6. Suggested Endpoint Map

Use these routes as the backend contract with the frontend:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `POST /api/ecg/upload`
- `GET /api/predictions/{id}`
- `GET /api/patients`
- `GET /api/patients/{id}`

## 7. What Each Backend Developer Should Build First

Recommended build order:

1. `DBConnection.java`
2. Model classes in `model/`
3. DAO classes in `dao/`
4. Service classes in `service/`
5. Servlet endpoints in `controller/`
6. File upload and validation helpers in `util/`

This order is practical because it builds the infrastructure first, then data access, then business logic, then request handling.

## 8. Short Summary for the Team

The backend is a Java Servlet application with five packages: `controller`, `model`, `dao`, `service`, and `util`.

The job of the backend team is to:

1. Keep request handling inside servlets.
2. Keep business logic inside services.
3. Keep database access inside DAOs.
4. Keep data structures inside models.
5. Keep shared helper code inside utilities.

If those rules are followed, the system stays clean, testable, and easy to extend.
