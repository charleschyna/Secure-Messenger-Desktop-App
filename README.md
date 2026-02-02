# Secure Messenger Desktop

A desktop messenger application built with Electron, React, and TypeScript, featuring efficient local data storage with SQLite, real-time WebSocket synchronization, and virtualized UI for optimal performance.

## Features

- **Local SQLite Database**: Efficient storage with 200 chats and 20,000+ messages
- **Real-time Sync**: WebSocket-based message synchronization (1-3 second intervals)
- **Connection Management**: Robust connection handling with exponential backoff reconnection
- **Virtualized Lists**: High-performance chat and message rendering using react-window
- **Security Boundaries**: Module-based architecture with encryption/decryption placeholders
- **Material-UI**: Modern, responsive dark-themed interface

## Prerequisites

- **Node.js**: v20+ (v25.5.0 used)
- **npm**: v11+

**Note**: This project uses `sql.js` (pure JavaScript SQLite) instead of `better-sqlite3` to avoid native compilation issues on Windows.

## Setup Instructions

### 1. Install Dependencies

```powershell
npm install
```

### 2. Build the Project

```powershell
# Build both main and renderer processes
npm run build

# Or build them separately
npm run build:main      # Build Electron main process
npm run build:renderer  # Build React renderer
```

### 3. Run the Application

```powershell
# Start the app
npm start

# Or for development with watch mode
npm run watch  # In one terminal
npm start      # In another terminal
```

## Architecture Overview

### Project Structure

```
secure-messenger-desktop/
├── src/
│   ├── main/              # Electron main process
│   │   └── main.ts        # App entry point
│   ├── services/          # Core business logic
│   │   ├── DatabaseService.ts     # SQLite operations
│   │   ├── WebSocketServer.ts     # WebSocket server
│   │   └── SecurityService.ts     # Encryption boundaries
│   ├── store/             # Redux state management
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       ├── chatsSlice.ts
│   │       ├── messagesSlice.ts
│   │       └── connectionSlice.ts
│   ├── components/        # React UI components
│   │   ├── ChatList.tsx          # Virtualized chat list
│   │   ├── ChatItem.tsx
│   │   ├── MessageView.tsx       # Message display
│   │   ├── MessageItem.tsx
│   │   └── ConnectionStatus.tsx  # Connection indicator
│   └── renderer/          # React app
│       ├── index.html
│       ├── index.tsx      # React entry point
│       └── App.tsx        # Main app component
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

### Data Flow

1. **Database Layer** (`DatabaseService.ts`)
   - SQLite database with indexed tables (`chats`, `messages`)
   - Efficient pagination queries (LIMIT/OFFSET)
   - Full-text search on message bodies
   - Seed data generation (200 chats, 20,000+ messages)

2. **WebSocket Layer** (`WebSocketServer.ts`)
   - Local WebSocket server on port 8080
   - Generates random messages every 1-3 seconds
   - Broadcasts to all connected clients
   - Heartbeat/ping mechanism

3. **State Management** (Redux Toolkit)
   - `chatsSlice`: Chat list state, selection, pagination
   - `messagesSlice`: Message history, search results
   - `connectionSlice`: WebSocket connection state machine

4. **UI Layer** (React + Material-UI)
   - Virtualized lists with `react-window` for performance
   - Connection status indicator with simulation controls
   - Real-time message updates via WebSocket events

### Connection Health

The app implements robust connection handling:

- **Connection States**: Connected → Reconnecting → Offline
- **Heartbeat**: Ping/pong every 10 seconds
- **Exponential Backoff**: `delay = min(1000 * 2^attempt, 30000)`
- **Max Attempts**: 10 reconnection attempts before giving up
- **Simulate Disconnect**: Button to test reconnection logic

### Security Boundaries

`SecurityService.ts` provides:

- `encrypt()` / `decrypt()` placeholders for E2E encryption
- `sanitizeForLog()` to prevent message content leaks
- Clear module boundaries for encryption integration

**In a real system:**
- Use Signal Protocol or libsodium for E2E encryption
- Encrypt messages before SQLite storage
- Store keys in secure OS keychain
- Wipe sensitive data from memory after use
- Never log message content (use sanitization)

### Database Schema & Indexes

```sql
CREATE TABLE chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  lastMessageAt INTEGER NOT NULL,
  unreadCount INTEGER DEFAULT 0
);

CREATE INDEX idx_chats_lastMessageAt ON chats(lastMessageAt DESC);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  FOREIGN KEY (chatId) REFERENCES chats(id)
);

CREATE INDEX idx_messages_chatId_ts ON messages(chatId, ts DESC);
CREATE INDEX idx_messages_body ON messages(body);
```

## Trade-offs & Design Decisions

### 1. State Management: Redux Toolkit
**Why?** Centralized state, DevTools integration, thunk middleware for async operations.
**Alternative**: Zustand (lighter), Context API (simpler but less tooling).

### 2. SQLite Library: better-sqlite3
**Why?** Synchronous API (simpler), faster than async alternatives.
**Trade-off**: Requires native compilation (Python + Build Tools).
**Alternative**: `sql.js` (pure JS, no build tools, but slower).

### 3. Virtualization: react-window
**Why?** Lightweight, handles 1000s of items efficiently.
**Trade-off**: Simpler API than react-virtualized but less features.

### 4. Database in Main Process
**Why?** SQLite can't run in renderer (needs node integration).
**Trade-off**: IPC overhead for queries.
**Improvement**: Use preload script + contextBridge for better isolation.

### 5. WebSocket Server in Same Process
**Why?** Simplifies setup, no external dependencies.
**Trade-off**: Not production-ready (should be separate service).

## What Would Be Improved With More Time

### High Priority
1. **IPC Communication**: Use `contextBridge` + `ipcRenderer` instead of `nodeIntegration`
2. **Message List Virtualization**: Apply `react-window` to message view
3. **Database Transactions**: Wrap batch operations for atomicity
4. **Error Handling**: User-facing error messages, retry logic
5. **Unit Tests**: Test database queries, Redux reducers, connection logic

### Medium Priority
6. **Search Across All Chats**: Extend search to all messages (not just current chat)
7. **Pagination State**: Persist scroll position when navigating between chats
8. **Message Timestamps**: Better time grouping (Today, Yesterday, etc.)
9. **Optimistic UI**: Show messages immediately before DB confirmation
10. **Database Migrations**: Version schema changes

### Low Priority
11. **Themes**: Light/dark mode toggle
12. **Settings**: User preferences (notification sounds, etc.)
13. **Message Editing/Deletion**: CRUD operations
14. **File Attachments**: Send/receive files
15. **User Avatars**: Visual identity in chat list

## Security Considerations

### Current Implementation
- ✅ SecurityService module boundary
- ✅ No message content in logs
- ✅ Sanitization helpers

### Production Requirements
- ❌ Real E2E encryption (Signal Protocol)
- ❌ Key management (OS keychain integration)
- ❌ Memory wiping after decryption
- ❌ Secure context isolation (`contextBridge`)
- ❌ Content Security Policy (CSP)
- ❌ Code signing for distribution

### Where Encryption Would Happen
1. **Outgoing**: `encrypt(plaintext)` → SQLite → Network
2. **Incoming**: Network → SQLite (encrypted) → `decrypt()` → Display
3. **Keys**: Stored in OS keychain, never in SQLite/logs
4. **Logs**: Only log sanitized metadata (IDs, timestamps, not content)

## Known Issues

1. **better-sqlite3 Installation**: Requires Python + VS Build Tools on Windows
2. **Node Integration**: Using `nodeIntegration: true` (security risk in production)
3. **Database Path**: Stored in userData, not configurable
4. **WebSocket Reconnect**: Doesn't resume from last state after reconnect
5. **Large Message Bodies**: No truncation/pagination for very long messages

## Development Commands

```powershell
# Install dependencies
npm install

# Build project
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Start Electron app
npm start

# Development mode (build + start)
npm run dev

# Clean build artifacts
npm run clean
```

## Technologies Used

- **Electron** 27.1.0 - Desktop application framework
- **React** 18.2.0 - UI library
- **TypeScript** 5.3.2 - Type-safe JavaScript
- **Redux Toolkit** 2.0.1 - State management
- **Material-UI** 5.14.20 - UI component library
- **sql.js** 1.10.3 - SQLite database (pure JavaScript, no native compilation)
- **ws** 8.16.0 - WebSocket library
- **react-window** 1.8.10 - List virtualization
- **Webpack** 5.89.0 - Module bundler

## License

MIT

## Time Spent

Approximately 4 hours:
- Project setup & configuration: 45 min
- Database layer & services: 60 min
- Redux store & slices: 45 min
- React components & UI: 60 min
- Testing & documentation: 30 min
