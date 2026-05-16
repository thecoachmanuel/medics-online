# 🏥 Medics-Online (Fullstack Next.js Monolith)

**Medics-Online** is a state-of-the-art online doctor appointment booking and consultation platform. This application has been migrated from a separate Frontend/Backend architecture to a **Unified Next.js Monolith**, combining the power of the App Router with a persistent custom Node.js server for real-time medical monitoring.

## ✨ Core Features

### 👥 For Patients
- **Secure Authentication** - Native Next.js auth flow with JWT and `localStorage` state management.
- **Hybrid Cryptography** - All sensitive data (Medical history, profile, login) is protected using a **Diffie-Hellman Key Exchange** system, encrypting request/response payloads with SHA-256 and AES-256.
- **Live Health Monitoring** - Real-time integration with hardware pulse oximeters to display BPM and SpO2 levels during appointment booking.
- **Payment Integration** - Secure payments via **Paystack**.

### 👨‍⚕️ For Doctors
- **Real-time Consultations** - HD Video/Audio consultations powered by **WebRTC** and **Socket.IO**.
- **Unified Dashboard** - Manage appointments, patient vitals, and professional availability from a single interface.

### 🔧 For Administrators
- **Full Platform Oversight** - Manage doctor approvals, patient records, and appointment scheduling.

## 🛠️ Unified Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Real-time:** Socket.IO (Custom HTTP Server)
- **Security:** CryptoJS (Diffie-Hellman, AES-256, SHA-256)
- **Database:** MongoDB (Mongoose)
- **Styling:** Tailwind CSS & Vanilla CSS
- **Storage:** Cloudinary
- **Payments:** Paystack

## 📁 Project Structure (Monolith)

```
Medics-Online/
├── 🖥️ frontend/             # THE CORE APP (Fullstack)
│   ├── 📁 app/               # Next.js App Router (UI & API Routes)
│   ├── 📁 src/               # Application Logic
│   │   ├── 📁 backend/       # Migrated Backend (Models, Controllers, Config)
│   │   ├── 📁 components/    # React Components
│   │   ├── 📁 context/       # State Management
│   │   └── 📁 utils/         # Cryptography & API Clients
│   ├── 📁 hardware/          # Arduino Firmware for Sensors
│   ├── 📄 server.js          # Custom Server (Socket.IO & Vitals Receiver)
│   └── 📦 package.json       # Unified Dependencies
└── 📄 README.md              # Project Documentation
```

## 🚀 Getting Started

### 1. Setup Environment
Rename `frontend/.env.local` and provide your credentials:
```env
MONGODB_URI=...
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET_KEY=...
PAYSTACK_SECRET_KEY=...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
```

### 2. Installation & Launch
```bash
cd frontend
npm install
npm run dev
```
The application will start on **`http://localhost:3000`**.

## 🔌 Hardware Integration (Pulse Oximeter)
The firmware is located in `frontend/hardware/pulseoximeter/`.
1. Open `pulseoximeter.ino` in Arduino IDE.
2. Update the `ssid` and `password` for your WiFi.
3. Flash to your NodeMCU/ESP8266.
4. The device will automatically stream live vitals to the Next.js server on port 3000.

---
**Unified for better performance, security, and healthcare accessibility.**
