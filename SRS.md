# Software Requirements Specification (SRS)

## For Intelligent Health Monitoring System Using Predictive Analytics

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) document is to provide a detailed description of the Intelligent Health Monitoring System Using Predictive Analytics. This document outlines the system's functional and non-functional requirements, its architecture, and external interfaces based on the project's synopsis and README.

### 1.2 Scope
The Intelligent Health Monitoring System is a web-based platform designed to shift healthcare from reactive treatment to proactive prevention. The system allows users to input clinical and biometric parameters (e.g., from wearable devices or clinical tests) to receive a real-time risk assessment for cardiovascular diseases (CVDs). Using a core predictive engine built on a Random Forest machine learning model, it analyzes 13 critical health attributes based on the UCI Heart Disease Dataset to identify potential health risks. The platform features an interactive dashboard to track historical trends, facilitating early medical consultations and positive lifestyle modifications.

### 1.3 Definitions, Acronyms, and Abbreviations
- **API**: Application Programming Interface
- **CVD**: Cardiovascular Disease
- **ECG**: Electrocardiogram
- **EHR**: Electronic Health Record
- **JWT**: JSON Web Token
- **ML**: Machine Learning
- **REST**: Representational State Transfer
- **UCI**: University of California, Irvine (referring to the Heart Disease dataset)
- **UI/UX**: User Interface / User Experience

### 1.4 References
1. Breiman, L. (2001). *Random Forests*. Machine Learning, 45(1), 5-32.
2. UCI Machine Learning Repository. (1988). *Heart Disease Data Set*.
3. World Health Organization (WHO). (2021). *Cardiovascular diseases (CVDs) Fact Sheet*.

---

## 2. Overall Description

### 2.1 Product Perspective
The system follows a multi-tier microservice architecture consisting of:
- **Client Tier**: A dynamic user interface built with React.js and React Router.
- **Server Tier**: A central RESTful API built with Node.js and Express.js to handle business logic, data validation, and proxying.
- **Database Tier**: A MySQL relational database for persistent storage of user credentials, medical logs, and historical predictions.
- **Analytics Tier**: An isolated Python/Flask microservice that loads a pre-trained scikit-learn Random Forest model (`model.pkl`) to calculate predictive risk scores.

### 2.2 Product Functions
- **User Authentication**: Secure registration and login using JWT and bcrypt.
- **Health Parameter Entry**: A frictionless UI for inputting 13 specific clinical/biometric data points via sliders and toggles.
- **Real-Time Risk Calculation**: Execution of the Random Forest model to return a quantitative risk percentage for potential heart disease.
- **Longitudinal Trend Tracking**: Visualizing the user's historical risk scores through interactive line charts and radial gauges.
- **Health Recommendations**: Providing actionable, risk-level-specific advice based on analytical results.

### 2.3 User Classes and Characteristics
- **General Consumers/Patients**: Individuals looking to actively monitor their cardiovascular health using existing lab results or wearable data. Requires zero technical or medical background; relies on the system's intuitive tooltips and GUI.
- **Medical Professionals**: May use the platform as an advisory aid to track a patient's historical records safely.

### 2.4 Operating Environment
- **Client-Side**: Any modern web browser supporting HTML5 and JavaScript (Chrome, Firefox, Edge, Safari) running on desktops, tablets, or smartphones.
- **Server-Side**: 
  - Node.js environment (v18.x or newer) for the API server.
  - Python environment (v3.8 or newer) running Flask and scikit-learn for the ML service.
- **Database**: MySQL Server.

### 2.5 Design and Implementation Constraints
- The prediction model strictly relies on the 13 feature parameters defined in the UCI Heart Disease Dataset.
- The outcome is an advisory probabilistic risk score, not a legally binding medical diagnosis.
- Data privacy is crucial; password hashes must be consistently maintained and user tokens securely managed.

---

## 3. System Features (Functional Requirements)

### 3.1 User Authentication Module
- **Description**: The system must allow users to register and securely log into their accounts.
- **Inputs**: Username, Password, Email.
- **Processing**: The Node.js server hashes the physical password using Bcrypt.js before saving it to the MySQL database. Upon login validation, a JWT is issued.
- **Outputs**: Successful authentication token mapping to a secure session; otherwise, an error response.

### 3.2 Predictive Analytics Engine
- **Description**: The system must process health parameters to calculate cardiovascular risk.
- **Inputs**: Array of 13 features (Age, Sex, Chest Pain Type, Resting BP, Cholesterol, FBS, ECG results, Max Heart Rate, Exercise Angina, ST Depression, ST Slope, Major Vessels, Thalassemia).
- **Processing**: The Node API sends a POST request to the Flask microservice. Flask invokes `predict_proba()` on the trained Random Forest `.pkl` model.
- **Outputs**: A finite probability score and binary classification (0: low risk, 1: high risk).

### 3.3 Dashboard and Trend Visualization
- **Description**: The system must present the user's current risk assessment and historical data visually.
- **Inputs**: Prediction history fetched from the MySQL `prediction_history` table tied securely to the user's ID.
- **Processing**: Aggregates timestamps and risk scores to form chronological datasets.
- **Outputs**: Rendered interactive charts (via Chart.js) such as a sweeping chronological line chart and radial gauges for immediate status.

### 3.4 Data Entry Interface
- **Description**: An intuitive form allowing users to enter clinical data with embedded validations and tooltips.
- **Inputs**: Numerical and categorical data via visual sliders and toggles.
- **Outputs**: Validated data object ready for transmission to the backend API.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- A premium, medical-themed front-end layout utilizing dynamic color-coding (Mint Green for Safe status; Warning Red for Critical Risk).
- Responsive design tailored for all display sizes to ensure high accessibility.
- Informational tooltips to translate medical jargon for a layman audience.

### 4.2 Hardware Interfaces
- No direct hardware API interfaces are configured; data typically stems from external sphygmomanometers, blood lab panels, and ECG evaluations manually input by the user.

### 4.3 Software Interfaces
- **MySQL Database**: Connected via Node.js SQL drivers to manage entity tables (`users`, `heart_disease_inputs`, `predictions`, `prediction_history`, `health_recommendations`).
- **Python ML Microservice**: Local HTTP server running on port `5001`. The Node platform serves as a client to this ML endpoint.

### 4.4 Communication Interfaces
- **REST APIs**: The primary architectural style utilizing standard HTTP methods (GET, POST, etc.) for cross-component communication.
- JSON payloads are expected universally as the standard data formatting metric.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- **Latency**: The ML microservice proxying cycle must process prediction payloads and deliver a response back to the client UI within ~800 milliseconds to preserve a "real-time" analytic feel.
- **Scalability**: The distinct division of React frontend, Node utility, and Python ML computation ensures each node scales vertically/horizontally independently matching system strain.

### 5.2 Security and Privacy
- Stateless session authentication executed exclusively via HTTP header-delivered JSON Web Tokens (JWT).
- Secure persistent storage of hashed credentials restricting exposed plain-text risk.

### 5.3 Reliability and Availability
- The Random Forest classifier mandates a predictive accuracy index of 85% to 92%, substantially outperforming raw heuristic guesswork.
- Controlled API fallback handling ensuring precise error messaging if database or ML server outages temporarily occur.

### 5.4 Maintainability
- Loosely coupled `.pkl` serial model ensuring the core intelligence formula can be swapped iteratively with newly improved training sets without restructuring the Node backend or React application logics.
