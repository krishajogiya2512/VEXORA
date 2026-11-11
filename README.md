# 🛡️ VEXORA
### AI-Powered Fake Social Media Account Detection Platform

<p align="center">
  <strong>Detect. Analyze. Protect.</strong>
</p>

VEXORA is an AI-powered cybersecurity platform designed to identify suspicious and potentially fake social media accounts through profile analysis, behavioral indicators, and intelligent risk assessment.

The platform aims to help security analysts identify suspicious digital identities, manage supporting evidence, track reported accounts, and streamline the reporting process.

---

## 📌 Problem Statement

**Fake Social Media Accounts and Their Detection**

Social media platforms are increasingly being exploited through fake accounts for impersonation, misinformation, fraudulent activities, and other malicious purposes.

Identifying these accounts manually is difficult due to their large volume and constantly changing behavior.

VEXORA addresses this challenge by providing an intelligent platform that analyzes publicly available profile information, identifies suspicious indicators, calculates risk scores, and supports structured reporting for further investigation.

**Proposed by:** Indo-Tibetan Border Police (ITBP), Ministry of Home Affairs  
**Domain:** Blockchain & Cybersecurity  
**Category:** Software  
**Year:** 2024

---

## 🎯 Project Objectives

- Identify potentially fake and suspicious social media profiles.
- Analyze profile metadata and behavioral patterns.
- Apply AI/ML techniques for intelligent account classification.
- Generate explainable risk scores for suspicious accounts.
- Maintain supporting evidence and investigation records.
- Provide a centralized dashboard for monitoring detections and reports.
- Support authorized human review and structured reporting.

---

## ✨ Key Features

### 1. Intelligent Profile Analysis
- Analyze profiles from Instagram, Facebook, X (Twitter), and other platforms.
- Examine publicly available profile information.
- Identify unusual profile characteristics.
- Support manual profile information submission.

### 2. AI-Based Fake Account Detection
- Hybrid rule-based and machine learning detection.
- Suspicious behavior identification.
- Risk score generation.
- Explainable detection results.

### 3. Risk Assessment System

Each analyzed profile receives a risk score between 0 and 100.

| Risk Score | Classification |
|---|---|
| 0–29 | 🟢 Low Risk |
| 30–59 | 🟡 Medium Risk |
| 60–79 | 🟠 High Risk |
| 80–100 | 🔴 Critical Risk |

### 4. Evidence Management
- Maintain supporting evidence.
- Upload relevant images and documents.
- Associate evidence with detection records.
- Maintain investigation history.

### 5. Report & Case Management
- Submit suspicious account reports.
- Generate unique case IDs.
- Track investigation status.
- Maintain analyst notes.
- Support authorized case review.

### 6. Security Dashboard
- Total profiles analyzed.
- Suspicious account statistics.
- Platform-wise detection insights.
- Risk distribution analytics.
- Recent detection activity.
- Pending investigation reports.

---

## 🧠 Detection Methodology

VEXORA uses a proposed hybrid detection approach combining rule-based analysis and machine learning.

**Suspicious indicators include:**

- Unusual follower-to-following ratios.
- Missing profile pictures.
- Incomplete or suspicious biographies.
- Unusually low account activity.
- Recently created accounts, when creation dates are available.
- Repetitive posting patterns.
- Inconsistent profile information.

The detection engine evaluates multiple indicators to generate an explainable risk assessment.

**Important:** A suspicious indicator does not independently prove that an account is fake. Detection results are intended to support further human verification.

---

## 🏗️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Backend Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcryptjs |
| Machine Learning | Python, Scikit-learn |
| API Testing | Postman |
| Version Control | Git & GitHub |

---

## 📂 Project Structure

```text
VEXORA/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── frontend/
│   └── ...
│
├── README.md
└── .gitignore
```

*The structure may evolve as development progresses.*

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB
- Git
- Python (for the machine learning service)

### 1. Clone the Repository

```bash
git clone https://github.com/krishajogiya2512/VEXORA.git
```

### 2. Navigate to the Project

```bash
cd VEXORA
```

### 3. Setup Backend

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory.

Use `.env.example` as a reference.

Configure your environment variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
UPLOAD_MAX_SIZE=5242880
```

Never commit your actual `.env` file or expose credentials publicly.

### 5. Start the Backend

Use the start command configured in `backend/package.json`.

For a direct Node.js start, if `server.js` is the backend entry point:

```bash
node server.js
```

### 6. Start the Frontend

Open another terminal and navigate to the frontend directory.

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 API Architecture

The backend follows a RESTful API architecture.

The main API modules include:

| Module | Responsibility |
|---|---|
| Authentication | Registration, login and authorization |
| Profiles | Social media profile management |
| Detection | Fake account analysis and risk scoring |
| Evidence | Supporting document management |
| Reports | Suspicious account reporting |
| Dashboard | Detection analytics and statistics |

**Base API URL (local development):**

```text
http://localhost:5000/api
```

---

## 🔐 Security & Privacy

VEXORA follows security-conscious development practices:

- JWT-based authentication.
- Password hashing.
- Role-based access control.
- Secure API endpoints.
- Input validation.
- Rate limiting.
- Secure file upload handling.
- Environment-based configuration.

The platform is designed to use permitted, publicly available information and authorized data sources. It does not bypass social media privacy restrictions or automatically suspend accounts.

Final verification and enforcement remain subject to authorized human review and the respective platform's official reporting procedures.

---

## 👥 Team Members

**Project Team**

- Aryan Kumar
- Samruddhi Meshram
- Krisha Jogiya

**Institution:** Ajeenkya DY Patil University (ADYPU)  
**Program:** B.Tech – Computer Science

---

## 🚀 Future Scope

- Integration with official social media APIs.
- Improved machine learning models.
- Real-time suspicious activity monitoring using permitted data sources.
- Advanced behavioral pattern analysis.
- Centralized investigation and case management.
- Integration with authorized reporting workflows.
- Improved detection accuracy through continuously evaluated datasets.

---

## 📌 Project Status

**VEXORA – Under Development**

This project is being developed as a major academic project to explore AI-driven cybersecurity solutions for fake social media account detection.

---

## 📄 License

This project is developed for academic and research purposes.

---

<p align="center">
  <strong>VEXORA – Making Digital Spaces Safer.</strong>
  <br/>
  Detect. Analyze. Protect. 🛡️
</p>