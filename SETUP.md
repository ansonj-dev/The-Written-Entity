# 🚀 Setup Guide - The Written Entity

Complete setup instructions for running The Written Entity locally or in production.

## 📋 Prerequisites

### Required
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **PostgreSQL** database ([Download](https://www.postgresql.org/download/))

### Optional (for full features)
- **Google Cloud Account** (for Gmail, Calendar, Drive, Meet)
- **Gemini API Key** (for AI transcription/analysis)
- **Notion Account** (for task management)
- **Supabase Account** (for authentication)
- **Redis** (for job queue - future use)

---

## 🔧 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/the-written-entity.git
cd the-written-entity
```

### 2. Backend Setup

```bash
cd written-entity-backend
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. **Install PostgreSQL** if not already installed

2. **Create database:**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE written_entity;

# Exit
\q
```

3. **Update DATABASE_URL in .env:**
```bash
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/written_entity
```

#### Option B: Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy database connection string from Settings → Database
4. Update `.env` with Supabase connection string

### 4. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Minimum configuration (works without API keys):**
```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=*
DATABASE_URL=postgresql://postgres:password@localhost:5432/written_entity
SESSION_SECRET=change_this_to_random_string
```

### 5. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 6. Build Backend

```bash
npm run build
```

### 7. Start Backend

```bash
# Production mode
npm start

# OR Development mode (auto-reload)
npm run dev
```

You should see:
```
The Written Entity backend running on http://localhost:3001
WebSocket available at ws://localhost:3001/ws
```

### 8. Frontend Setup

```bash
# Open new terminal
cd ../frontend

# Start simple HTTP server
python -m http.server 5500

# OR use Node.js http-server
npx http-server -p 5500
```

### 9. Access Application

Open browser and navigate to:
```
http://localhost:5500/the-written-entity.html
```

---

## 🔑 API Keys Setup (Optional)

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env`:
```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Supabase Authentication

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy URL and anon key
4. Add to `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

5. Enable Google OAuth in Supabase:
   - Go to Authentication → Providers
   - Enable Google
   - Add Google Client ID and Secret

### Google OAuth (for Gmail, Calendar, Drive)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Meet API

4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Create OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3001/auth/google/callback`

5. Add to `.env`:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-project.supabase.co/auth/v1/callback
```

6. Add credentials to Supabase:
   - Go to Authentication → Providers → Google
   - Paste Client ID and Client Secret

### Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create new integration
3. Copy Internal Integration Token
4. Create a database in Notion for tasks
5. Share database with your integration
6. Copy database ID from URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
   ```

7. Add to `.env`:
```bash
NOTION_CLIENT_SECRET=your_integration_token
NOTION_DATABASE_ID=your_database_id
```

---

## ✅ Verification

### Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2026-05-19T..."}
```

### Test Frontend

1. Open `http://localhost:5500/the-written-entity.html`
2. Check browser console for errors
3. Verify WebSocket connection (should see "Connected" status)

### Test Upload

1. Click "New Meeting" or go to "Upload" tab
2. Create a test file:
```bash
echo "Speaker 1: This is a test meeting transcript." > test-meeting.txt
```
3. Upload the file
4. Watch pipeline execute
5. Check outputs in right panel

---

## 🐛 Troubleshooting

### Backend won't start

**Error: `Cannot find module`**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error: `Database connection failed`**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Test connection:
npx prisma db push
```

### Frontend can't connect

**WebSocket connection failed:**
- Check backend is running on port 3001
- Verify no firewall blocking
- Check browser console for errors

**CORS errors:**
- Update `FRONTEND_URL` in backend `.env`
- Restart backend after changes

### Pipeline fails

**Transcriber fails:**
- Check if file format is supported
- Verify GEMINI_API_KEY if using audio
- System will use fallback if API unavailable

**Task Agent fails:**
- Check NOTION_CLIENT_SECRET
- Verify database is shared with integration
- Tasks will save locally if Notion unavailable

**Comms Agent fails:**
- Check Google OAuth is configured
- Verify user has authorized Gmail
- Emails will save as drafts if sending fails

---

## 🚀 Production Deployment

### Environment Variables

Update `.env` for production:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:pass@production-db:5432/db
SESSION_SECRET=long_random_production_secret
WEBHOOK_BASE_URL=https://your-backend-domain.com
```

### Security Checklist

- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS for specific domain
- [ ] Use production database with backups
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Use environment-specific API keys
- [ ] Enable database connection pooling
- [ ] Set up logging aggregation
- [ ] Configure WebSocket SSL (wss://)

### Deployment Platforms

**Backend:**
- Railway
- Render
- Heroku
- DigitalOcean
- AWS/GCP/Azure

**Frontend:**
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

**Database:**
- Supabase (recommended)
- Railway PostgreSQL
- AWS RDS
- DigitalOcean Managed Database

---

## 📊 Performance Optimization

### Database

```bash
# Create indexes for frequently queried fields
# Add to Prisma schema:
@@index([userId])
@@index([status])
@@index([createdAt])
```

### Caching

Consider adding Redis for:
- Session storage
- API response caching
- Job queue (Bull)

### Monitoring

Set up monitoring for:
- API response times
- Database query performance
- WebSocket connection count
- Error rates
- Pipeline execution times

---

## 🔄 Updating

```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd written-entity-backend
npm install

# Update database schema
npx prisma generate
npx prisma db push

# Rebuild
npm run build

# Restart backend
npm start
```

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud APIs](https://cloud.google.com/apis)
- [Notion API](https://developers.notion.com)
- [Gemini API](https://ai.google.dev/docs)

---

## 💬 Need Help?

- Check [PROJECT_REPORT.md](./PROJECT_REPORT.md) for detailed documentation
- Review [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub
- Check existing issues for solutions

---

**Happy building! 🎉**
