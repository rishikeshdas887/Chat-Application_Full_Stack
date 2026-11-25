# SyncPulse — Full-Stack Real-Time Messaging Platform

> A modern, production-ready full-stack chat application built with **React 19**, **Spring Boot 3**, **WebSocket STOMP**, **PostgreSQL**, **Universal Cross-Platform File Sharing**, **RFC 6238 TOTP Authenticator 2FA**, and **Privacy-First On-Device AI**.

---

## 🌟 Highlights & Key Features

### 1. 💬 Modern Real-Time Messaging
- **Bi-directional WebSocket (STOMP)** with graceful reconnect logic and resilient REST fallback.
- **Direct & Group Conversations**: Create private direct messages or multi-participant team chats with instant membership resolution.
- **Rapid User Discovery**: Look up registered users by phone number or username with instant direct chat creation.
- **Privacy-First Interface**: Internal database IDs are strictly hidden across all user-facing screens.

### 2. 📎 Universal Cross-Platform Attachment Engine
- **Supported Formats**: Photos & Images (JPEG, PNG, WebP, GIF), Documents (PDF, DOCX, XLSX, PPTX, TXT, ZIP).
- **Universal Capture**: Integrated in-browser Camera capture with viewfinder, image preview, and caption staging.
- **Desktop & Mobile Ergonomics**: Drag-and-drop dropzone, system clipboard image pasting, multi-file selection, and file removal before sending.
- **Rich Message Cards**: Interactive image viewer with full-screen lightbox modal and document download cards with file size indicators.

### 3. ✨ On-Device Local AI Assistant & Summarizer
- **100% Local Browser Execution**: Runs completely inside browser memory using WebLLM / local heuristics. Zero chat content is ever sent to external cloud AI providers (OpenAI, Gemini, Anthropic).
- **Consensus Conclusion of Decisions**: Automatically detects agreements and decisions across languages (English, Hindi, Hinglish, Spanish, French, German) and synthesizes an authoritative consensus conclusion.
- **Interactive Local AI Chat Box**: Ask arbitrary questions about the conversation (decisions, action items, participants, recaps) with sub-50ms instant response times and 1-tap quick action chips.

### 4. 🔐 Free Authenticator App 2FA (RFC 6238 TOTP)
- **Zero Telecom Fees**: 100% free forever with unlimited verifications using **Google Authenticator**, **Microsoft Authenticator**, or **Authy**.
- **Instant Setup**: Generates cryptographic Base32 secrets and instant QR code Data URLs for mobile scanning.
- **Enterprise Security**: Argon2/BCrypt hashed passwords, stateless JWT authentication, and rate-limited endpoints.

---

## 📁 Repository Structure

```
Chat-Application_Full_Stack/
├── frontend/                     # React 19 Client
│   ├── src/
│   │   ├── api/                  # Axios REST API clients
│   │   ├── components/
│   │   │   ├── auth/             # Phone, TOTP, and credentials forms
│   │   │   ├── chat/             # Message threads, attachments, modals, AI drawer
│   │   │   ├── layout/           # Sidebar, Chat Header, Message Input
│   │   │   └── ui/               # Reusable design system primitives
│   │   ├── context/              # Auth, Chat, and Theme Context providers
│   │   ├── hooks/                # WebSocket, AI Summarizer, File Selector hooks
│   │   ├── services/             # Local AI, TOTP, File Upload services
│   │   └── pages/                # AuthPage and ChatPage
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/                      # Spring Boot 3 Server
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/rishikesh/chat/
│   │   │   │   ├── config/       # Security, JWT, WebSocket STOMP configuration
│   │   │   │   ├── controller/   # REST API Controllers (Auth, Chat, Messages, Files)
│   │   │   │   ├── dto/          # Data Transfer Objects
│   │   │   │   ├── entity/       # JPA Entities (User, Conversation, Message)
│   │   │   │   ├── repository/   # Spring Data JPA Repositories
│   │   │   │   └── service/      # Auth, TOTP, Message, and File services
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                 # Integration and unit tests
│   ├── pom.xml
│   ├── mvnw
│   └── .env.example
│
├── .gitignore                    # Universal root gitignore (secrets, build files, uploads)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+** and **Maven 3.8+**
- **Node.js 18+** and **npm**
- **PostgreSQL 14+**

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Configure Database & Secrets**:
   Copy the example environment file and set your credentials:
   ```bash
   cp .env.example .env
   ```
   Set your environment variables (or export them in your shell):
   ```bash
   export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/chat_application
   export SPRING_DATASOURCE_USERNAME=your_db_user
   export SPRING_DATASOURCE_PASSWORD=your_db_password
   export JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
   ```

3. **Build and run the Spring Boot server**:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend server starts on `http://localhost:8081`.

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment** (Optional):
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(By default, the Vite dev server automatically proxies `/api` and `/ws` to `localhost:8081`)*.

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Privacy Practices

- **Zero Hardcoded Secrets**: All private passwords, database credentials, and cryptographic signing keys are externalized into environment variables and excluded via `.gitignore`.
- **Stateless Tokens**: Authentication uses secure HMAC-SHA256 JWT tokens with automatic expiration.
- **Client-Side AI Inference Guarantee**: On-device AI processing executes strictly in local browser memory without transmitting conversation logs to any third-party AI APIs.

---

## 📄 License

This project is licensed under the MIT License.
