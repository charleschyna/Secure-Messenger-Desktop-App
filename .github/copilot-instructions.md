<!-- Secure Messenger Desktop - Project Guidelines -->

## Project Overview
Electron + React + TypeScript desktop messenger with SQLite, WebSocket sync, and virtualized UI.

## Completed Setup
- [x] Project structure scaffolded
- [x] Configuration files created (package.json, tsconfig, webpack)
- [x] Core services implemented (DatabaseService, WebSocketServer, SecurityService)
- [x] Redux store with slices (chats, messages, connection)
- [x] React components with Material-UI
- [x] README.md with architecture and setup instructions

## Pending Installation
- [ ] npm install (requires Visual Studio Build Tools for better-sqlite3)
- [ ] npm run build
- [ ] npm start

## Important Notes
- **Security**: Never log message content - use SecurityService.sanitizeForLog()
- **Performance**: Use virtualization for large lists (react-window)
- **Database**: All queries use indexes and pagination (no full table loads)
- **Connection**: Implements exponential backoff reconnection strategy

## Next Steps
1. Wait for Visual Studio Build Tools installation to complete
2. Run `npm install` to install all dependencies
3. Run `npm run build` to compile TypeScript and webpack
4. Run `npm start` to launch the Electron app
