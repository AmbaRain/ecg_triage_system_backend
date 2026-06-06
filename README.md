## ECG Triage Backend — Java Servlet System
This is the core Java backend engine for the AI-Powered ECG Triage Web Application. It acts as the orchestration layer between our Vanilla JS frontend client and the downstream Python ML microservice (CNN + BiLSTM model), while natively managing persistent application state in MySQL.

### 🏗️ Architecture Overview
The backend strictly follows an N-Tier Architecture and MVC (Model-View-Controller) design pattern. To maintain a clean separation of concerns and avoid merge conflicts, ensure you follow The Golden Rule: Layers only communicate with their immediate neighbors.

[ Frontend Client ]
        │  (HTTP / JSON Requests)
        ▼
   [ Controller ]  --> Java Servlets (Read HTTP, format JSON responses)
        │
        ▼
    [ Service ]     --> Business Logic (Rules, processing, ML routing)
        │
        ▼
      [ DAO ]       --> Data Access Objects (Strictly JDBC and raw SQL)
        │
        ▼
   [ Database ]     --> MySQL Persistent Storage
### 📂 Directory & Package Breakdown
Our codebase is organized into 5 major packages under src/. Here is the exact blueprint of what you are responsible for coding in each layer:

#### 1. src/model/ — Data Containers
Purpose: Standard POJOs (Plain Old Java Objects) that act as an exact 1:1 mirror of our MySQL database tables.

What to code: Private fields matching database columns, constructors, getters, setters, and toString() overrides. Keep these entirely free of business logic.

Key Files:

User.java: Clinician profiles (id, username, password_hash, full_name, role).

Patient.java: Demographics (id, full_name, dob, created_at).

Prediction.java: AI diagnostics (id, patient_id, record_id, primary_label, confidence, timestamp).

ECGRecord.java: File metadata (id, patient_id, file_path, format).

#### 2. src/util/ — Shared Tools
Purpose: Global helper classes providing common infrastructure components used across multiple layers.

What to code: Static helper methods and configuration configurations.

Key Files:

DBConnection.java: A thread-safe Singleton pattern managing a standard JDBC connection pool. Hand out active database connections seamlessly.

FileUploader.java: Handles disk I/O. Must parse incoming multipart form data, securely write .csv or .dat/.hea pairs to the server's dedicated disk storage, and return absolute paths.

ValidationUtil.java: Enforces incoming payload integrity. Checks email syntaxes, sanitizes strings to prevent SQL injections, and hard-checks file upload size limits (10MB per file, 25MB total max).

#### 3. src/dao/ — Data Access Objects
Purpose: The exclusive home for data mutation and querying. No SQL queries are permitted anywhere else in the application.

What to code: Explicit PreparedStatement definitions, transaction management, and mapping raw ResultSet records back into model objects. Catch SQLException locally and bubble up descriptive runtime exceptions.

Key Files:

UserDAO.java: Handles user checks (findByUsername).

PatientDAO.java: Handles profiles with native sorting and pagination (findAll(int limit, int offset), findById, insert).

PredictionDAO.java: Records diagnoses and aggregates logs (insert, findById, findByPatientId).

ECGRecordDAO.java: Logs structural file pointer paths to the database (insert).

#### 4. src/service/ — Core Business Brains
Purpose: Implements application use-cases, runs validations, and coordinates multiple DAOs or external network layers.

What to code: Business flows, credential hashing verification (e.g., BCrypt), and REST execution wrappers.

Key Files:

AuthService.java: Verifies passwords against UserDAO data and securely mints session payloads/JWTs.

PredictionService.java: The heaviest orchestration logic. It grabs local file targets via the controller, executes an HTTP request using Java’s native HttpClient to send data to the Python ML API, parses the deep learning response (diagnoses, model weights, downsampled signal matrix), and saves the outcome using PredictionDAO.

DashboardService.java: Runs rapid aggregation calls across various DAOs to yield real-time metric analytics dashboards.

PatientService.java: Aggregates unified patient file objects coupled with their comprehensive medical history timelines.

#### 5. src/controller/ — The API Endpoints
Purpose: Standard Java Servlets acting as our ingress and egress points. They communicate exclusively via standard JSON payloads with the frontend client.

What to code: Extend HttpServlet, override HTTP verb methods (doGet, doPost, etc.), extract parameters/JSON bodies, hand them down to the service layer, and write clean JSON responses using Gson or Jackson.

Key Files & Routes:

AuthServlet.java ➔ POST /api/auth/login, POST /api/auth/logout

UploadServlet.java ➔ POST /api/ecg/upload (Handles multipart/form-data)

PredictionServlet.java ➔ GET /api/predictions/{id} (Returns Plotly-ready coordinates)

PatientServlet.java ➔ GET /api/patients, GET /api/patients/{id}

DashboardServlet.java ➔ GET /api/dashboard

### 🛠️ Tech Stack & Requirements
Language/SDK: Java 11 or higher

Server Framework: Java Servlet API (Jakarta / javax.servlet)

Database Driver: MySQL Connector/J

JSON Processing: Google Gson or Jackson Databind

Target Container: Apache Tomcat (v9.x or v10.x depending on your servlet namespace)
