# 🤖 The Written Entity

> **AI-Powered Meeting Automation System** - Transform meeting recordings into actionable insights, tasks, and follow-ups automatically.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## 🎯 What It Does

The Written Entity automates your entire post-meeting workflow:

1. **📝 Transcribe** - Convert audio/video recordings to text with speaker detection
2. **🧠 Analyze** - Extract key decisions, action items, and risks using AI
3. **✅ Create Tasks** - Automatically generate tasks in Notion with owners and deadlines
4. **📧 Send Follow-ups** - Draft and send personalized emails via Gmail
5. **📁 Archive** - Store comprehensive summaries in Google Drive

**Result:** Reduce 30-60 minutes of post-meeting work to under 2 minutes of automated processing.

---

## ✨ Key Features

### 🤖 **6-Agent AI Pipeline**
- **Orchestrator** - Coordinates the entire workflow
- **Transcriber** - Processes audio/text with Gemini API
- **Analyzer** - Extracts insights and action items
- **Task Agent** - Creates tasks in Notion
- **Comms Agent** - Drafts and sends emails
- **Archiver** - Stores summaries in Drive

### 🔄 **Real-time Updates**
- Live WebSocket connection
- Progress tracking (0-100%)
- Agent status indicators
- Execution logs

### 🛡️ **Robust Error Handling**
- Automatic retry with exponential backoff
- Graceful fallbacks when APIs unavailable
- Works without API keys (local mode)
- Never loses data

### 🔌 **Powerful Integrations**
- **Google Workspace** - Gmail, Calendar, Drive, Meet
- **Notion** - Task management
- **Supabase** - Authentication & database
- **Gemini AI** - Transcription & analysis

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- (Optional) API keys for full functionality

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/the-written-entity.git
cd the-written-entity
```

2. **Install backend dependencies:**
```bash
cd written-entity-backend
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database:**
```bash
npx prisma generate
npx prisma db push
```

5. **Start the backend:**
```bash
npm run build
npm start
```

6. **Start the frontend:**
```bash
cd ../frontend
python -m http.server 5500
```

7. **Open your browser:**
```
http://localhost:5500/the-written-entity.html
```

---

## 📖 Usage

### Basic Upload (No API Keys Required)

1. Click **"New Meeting"** button
2. Upload a `.txt` transcript or audio file (`.mp3`, `.mp4`, `.wav`)
3. Watch the pipeline process your meeting in real-time
4. View outputs: summary, tasks, emails, and archive

### With Full Integration

1. **Configure API keys** in `.env`:
   - `GEMINI_API_KEY` - For AI transcription and analysis
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Gmail/Drive/Calendar
   - `NOTION_CLIENT_SECRET` & `NOTION_DATABASE_ID` - For task management

2. **Sign in with Google** to authorize integrations

3. **Upload a meeting** and watch it:
   - Transcribe audio automatically
   - Create tasks in your Notion workspace
   - Send emails from your Gmail account
   - Archive summaries to your Google Drive

### Google Calendar Auto-Sync

1. Sign in with Google OAuth
2. Grant Calendar permissions
3. Backend automatically monitors your calendar
4. New meetings appear in dashboard automatically

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + TypeScript + Express
- PostgreSQL + Prisma ORM
- WebSocket (real-time updates)
- Bull (job queue)

**Frontend:**
- Pure HTML/CSS/JavaScript
- WebSocket client
- Supabase Auth SDK

**AI & APIs:**
- Google Gemini API
- Google Workspace APIs
- Notion API
- Supabase Auth

### Project Structure

```
the-written-entity/
├── written-entity-backend/
│   ├── src/
│   │   ├── agents/           # 6 AI agents
│   │   │   ├── orchestrator.ts
│   │   │   ├── transcriber.ts
│   │   │   ├── analyzer.ts
│   │   │   ├── taskAgent.ts
│   │   │   ├── commsAgent.ts
│   │   │   └── archiver.ts
│   │   ├── integrations/     # External APIs
│   │   ├── routes/           # API endpoints
│   │   ├── db/               # Database & Prisma
│   │   ├── queue/            # Job queue
│   │   └── utils/            # Helpers
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── frontend/
│   └── the-written-entity.html
├── PROJECT_REPORT.md         # Detailed documentation
└── README.md
```

---

## 🧪 Testing

### Test Without API Keys

The system works in fallback mode without any API keys:

```bash
# Start backend
cd written-entity-backend
npm start

# Start frontend (in another terminal)
cd ../frontend
python -m http.server 5500

# Upload a .txt file and watch the pipeline execute
```

### Test With Gemini API

```bash
# Add to .env
GEMINI_API_KEY=your_key_here

# Restart backend and upload audio files
# System will transcribe and analyze with AI
```

### Full Integration Test

See [PROJECT_REPORT.md](./PROJECT_REPORT.md) for 6 detailed test scenarios.

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Pipeline Execution** | 40-75 seconds (with APIs) |
| **Fallback Mode** | 8-15 seconds (no APIs) |
| **Memory Usage** | ~150-300 MB |
| **Concurrent Meetings** | Unlimited (queue-based) |
| **Retry Attempts** | 3 per agent |

---

## 🔒 Security

- ✅ Supabase Auth with OAuth
- ✅ Encrypted token storage
- ✅ Server-side API key protection
- ✅ CORS configuration
- ✅ SQL injection prevention (Prisma)
- ✅ Input validation
- ✅ Secure session management

---

## 📝 Environment Variables

### Required

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/written_entity
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SESSION_SECRET=random_secret_string
```

### Optional (for full features)

```bash
GEMINI_API_KEY=your_gemini_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NOTION_CLIENT_SECRET=your_notion_secret
NOTION_DATABASE_ID=your_notion_database_id
```

See [.env.example](./written-entity-backend/.env.example) for complete configuration.

---


## 📚 Documentation

- **[Backend README](./written-entity-backend/README.md)** - Backend setup guide
- **API Documentation** - Available at `/api` endpoints

---

## 🛣️ Roadmap

- [ ] Multi-language support
- [ ] Slack integration
- [ ] Microsoft Teams support
- [ ] Custom agent workflows
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Voice commands
- [ ] Live meeting assistant

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI transcription and analysis
- **Supabase** - Authentication and database hosting
- **Notion** - Task management integration
- **Prisma** - Database ORM
- **Bull** - Job queue system

---


<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by Redskull

</div>
