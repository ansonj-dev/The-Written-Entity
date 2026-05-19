# Contributing to The Written Entity

Thank you for your interest in contributing to The Written Entity! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please:
- Check existing issues first
- Describe the feature and its use case
- Explain why it would be valuable
- Consider implementation complexity

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes:**
   - Ensure backend starts without errors
   - Test the pipeline end-to-end
   - Verify WebSocket updates work

5. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add new agent for X"
   git commit -m "fix: resolve issue with Y"
   git commit -m "docs: update README with Z"
   ```

6. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Code Style

### TypeScript/JavaScript
- Use TypeScript for backend code
- Follow existing naming conventions
- Use async/await over promises
- Add JSDoc comments for public functions
- Keep functions small and focused

### Example:
```typescript
/**
 * Process a meeting through the AI pipeline
 * @param meetingId - Unique meeting identifier
 * @returns Pipeline execution result
 */
export async function runPipeline(meetingId: string): Promise<PipelineRun> {
  // Implementation
}
```

### Database
- Use Prisma for all database operations
- Never write raw SQL
- Add migrations for schema changes

### Frontend
- Keep vanilla JavaScript simple
- Use semantic HTML
- Follow existing CSS variable system
- Ensure responsive design

## 🧪 Testing Guidelines

Before submitting a PR:

1. **Start the backend:**
   ```bash
   cd written-entity-backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   python -m http.server 5500
   ```

3. **Test basic upload:**
   - Upload a .txt file
   - Verify pipeline completes
   - Check outputs display correctly

4. **Test error handling:**
   - Try invalid file types
   - Test with missing API keys
   - Verify fallback mechanisms

## 🏗️ Project Structure

```
written-entity-backend/
├── src/
│   ├── agents/          # Add new agents here
│   ├── integrations/    # Add new API integrations
│   ├── routes/          # Add new API endpoints
│   ├── db/              # Database configuration
│   └── utils/           # Shared utilities
```

## 🔧 Adding a New Agent

1. Create agent file in `src/agents/`:
```typescript
// src/agents/myAgent.ts
export async function runMyAgent(meetingId: string, input: any) {
  // Agent logic
  return result;
}
```

2. Update orchestrator in `src/agents/orchestrator.ts`:
```typescript
import { runMyAgent } from './myAgent';

// Add to pipeline
const result = await timedStep('myAgent', 
  () => withRetry(() => runMyAgent(meetingId, input)), 
  run.id, 
  meetingId
);
```

3. Update progress map:
```typescript
const progressMap: Record<string, number> = {
  orchestrator: 10,
  transcriber: 20,
  myAgent: 30,  // Add here
  // ...
};
```

## 🔌 Adding a New Integration

1. Create integration file in `src/integrations/`:
```typescript
// src/integrations/myService.ts
export async function callMyService(data: any) {
  // API call logic
}
```

2. Add environment variables to `.env.example`:
```bash
MY_SERVICE_API_KEY=your_key_here
MY_SERVICE_ENDPOINT=https://api.myservice.com
```

3. Update README with setup instructions

## 📚 Documentation

When adding features:
- Update README.md
- Add JSDoc comments
- Update PROJECT_REPORT.md if architecture changes
- Include usage examples

## 🐛 Debugging

### Backend Logs
```bash
tail -f backend-local.log
tail -f backend-local.err.log
```

### Database Inspection
```bash
npx prisma studio
```

### WebSocket Testing
Use browser console to monitor WebSocket messages:
```javascript
// In browser console
window.ws.addEventListener('message', (event) => {
  console.log('WS:', JSON.parse(event.data));
});
```

## ⚡ Performance Considerations

- Keep agent execution under 30 seconds when possible
- Use database indexes for frequently queried fields
- Implement pagination for large result sets
- Cache API responses when appropriate
- Use WebSocket for real-time updates, not polling

## 🔒 Security

- Never commit API keys or credentials
- Use environment variables for secrets
- Validate all user inputs
- Sanitize data before database insertion
- Use Prisma to prevent SQL injection
- Keep dependencies updated

## 📋 Commit Message Format

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add Slack integration for notifications
fix: resolve WebSocket reconnection issue
docs: update API endpoint documentation
refactor: simplify transcriber error handling
```

## 🎯 Priority Areas

We're especially interested in contributions for:

- [ ] Additional AI model integrations (OpenAI, Anthropic)
- [ ] More task management integrations (Jira, Asana, Trello)
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Performance optimizations
- [ ] Test coverage improvements
- [ ] Documentation enhancements

## 💬 Questions?

- Open a GitHub issue
- Check existing documentation
- Review closed issues for similar questions

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## 🙏 Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping make The Written Entity better!

---

Happy coding! 🚀
