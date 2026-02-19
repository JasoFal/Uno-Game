# UNO Game - Multiplayer Setup Guide

## 🎮 Features
- **Quick Play**: Play against 3 AI opponents locally
- **Multiplayer Lobby System**:
  - Create password-protected lobbies
  - Join lobbies with a 6-character code
  - Max 4 players per lobby
  - Add/remove AI players dynamically
  - Host controls to start the game

## 🚀 Installation & Setup

### 1. Install Dependencies

#### Frontend (React)
```bash
npm install
```

#### Backend (Server)
```bash
cd server
npm install
cd ..
```

### 2. Run the Application

You need to run both the frontend and backend servers:

#### Terminal 1 - Backend Server
```bash
cd server
npm start
```
The server will run on `http://localhost:3001`

#### Terminal 2 - Frontend React App
```bash
npm start
```
The app will run on `http://localhost:3000`

## 🎯 How to Play Multiplayer

### Creating a Lobby
1. Click **"Lobby"** from the main menu
2. Click **"Create Lobby"**
3. Enter your name
4. (Optional) Enable password protection
5. Share the 6-character lobby code with friends

### Joining a Lobby
1. Click **"Lobby"** from the main menu
2. Click **"Join Lobby"**
3. Enter your name
4. Enter the lobby code
5. Enter password if required

### Lobby Controls (Host)
- **Add AI Player**: Add computer opponents to fill empty slots
- **Remove AI**: Remove AI players before starting
- **Start Game**: Begin the game when all players are ready

### Lobby Controls (Players)
- **Ready/Not Ready**: Toggle your ready status
- **Leave Lobby**: Exit the lobby

## 🛠️ Technologies Used

### Frontend
- React 19
- Socket.IO Client
- CSS-in-JS styling

### Backend
- Node.js
- Express
- Socket.IO Server
- CORS

## 🔧 Configuration

### Server Port
The server runs on port `3001` by default. To change:

Edit `server/index.js`:
```javascript
const PORT = process.env.PORT || YOUR_PORT;
```

Edit `src/services/socket.js`:
```javascript
const SOCKET_URL = 'http://localhost:YOUR_PORT';
```

### Environment Variables
Create a `.env` file in the root directory:
```
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 📝 Notes

- The server must be running for multiplayer features to work
- Quick Play works offline without the server
- Lobbies are temporary and deleted when empty
- Maximum 4 players per lobby (human + AI combined)
- Game state is synchronized in real-time

## 🐛 Troubleshooting

### "Failed to connect to server"
- Make sure the backend server is running on port 3001
- Check if another application is using port 3001
- Verify firewall settings

### "Lobby not found"
- Lobby codes expire when empty
- Verify you're entering the correct 6-character code
- Case-insensitive code entry

### Game state issues
- Refresh the page if players appear stuck
- Check browser console for errors
- Ensure all players are on the same game version

## 🎲 Game Rules

Standard UNO rules apply:
- Match cards by color or number
- Action cards: Skip, Reverse, Draw Two
- Wild cards change the color
- Wild Draw Four forces next player to draw 4 cards
- First player to empty their hand wins!

Enjoy playing UNO with your friends! 🎴
