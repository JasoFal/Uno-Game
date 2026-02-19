const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Store active lobbies
const lobbies = new Map();

// Utility functions
function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createLobby(hostId, hostName, password = null) {
  const code = generateLobbyCode();
  const lobby = {
    code,
    hostId,
    password,
    players: [
      {
        id: hostId,
        name: hostName,
        isAI: false,
        isReady: false,
        isHost: true
      }
    ],
    aiPlayers: [],
    maxPlayers: 4,
    gameStarted: false,
    gameState: null
  };
  lobbies.set(code, lobby);
  return lobby;
}

function addPlayerToLobby(code, playerId, playerName) {
  const lobby = lobbies.get(code);
  if (!lobby) return { success: false, error: 'Lobby not found' };
  
  if (lobby.players.length + lobby.aiPlayers.length >= lobby.maxPlayers) {
    return { success: false, error: 'Lobby is full' };
  }
  
  if (lobby.gameStarted) {
    return { success: false, error: 'Game already started' };
  }
  
  lobby.players.push({
    id: playerId,
    name: playerName,
    isAI: false,
    isReady: false,
    isHost: false
  });
  
  return { success: true, lobby };
}

function addAIToLobby(code) {
  const lobby = lobbies.get(code);
  if (!lobby) return { success: false, error: 'Lobby not found' };
  
  if (lobby.players.length + lobby.aiPlayers.length >= lobby.maxPlayers) {
    return { success: false, error: 'Lobby is full' };
  }
  
  const aiNumber = lobby.aiPlayers.length + 1;
  lobby.aiPlayers.push({
    id: `ai-${Date.now()}-${aiNumber}`,
    name: `AI Player ${aiNumber}`,
    isAI: true,
    isReady: true
  });
  
  return { success: true, lobby };
}

function removeAIFromLobby(code, aiId) {
  const lobby = lobbies.get(code);
  if (!lobby) return { success: false, error: 'Lobby not found' };
  
  lobby.aiPlayers = lobby.aiPlayers.filter(ai => ai.id !== aiId);
  
  // Rename remaining AI players
  lobby.aiPlayers.forEach((ai, index) => {
    ai.name = `AI Player ${index + 1}`;
  });
  
  return { success: true, lobby };
}

function removePlayerFromLobby(code, playerId) {
  const lobby = lobbies.get(code);
  if (!lobby) return;
  
  lobby.players = lobby.players.filter(p => p.id !== playerId);
  
  // If host left, assign new host or delete lobby
  if (lobby.players.length === 0) {
    lobbies.delete(code);
    return null;
  }
  
  // If old host left, assign new host
  const hasHost = lobby.players.some(p => p.isHost);
  if (!hasHost) {
    lobby.players[0].isHost = true;
    lobby.hostId = lobby.players[0].id;
  }
  
  return lobby;
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create lobby
  socket.on('create-lobby', ({ playerName, password }) => {
    const lobby = createLobby(socket.id, playerName, password);
    socket.join(lobby.code);
    socket.emit('lobby-created', lobby);
    console.log(`Lobby ${lobby.code} created by ${playerName}`);
  });

  // Join lobby
  socket.on('join-lobby', ({ code, playerName, password }) => {
    const lobby = lobbies.get(code);
    
    if (!lobby) {
      socket.emit('join-error', { error: 'Lobby not found' });
      return;
    }
    
    if (lobby.password && lobby.password !== password) {
      socket.emit('join-error', { error: 'Incorrect password' });
      return;
    }
    
    const result = addPlayerToLobby(code, socket.id, playerName);
    
    if (!result.success) {
      socket.emit('join-error', { error: result.error });
      return;
    }
    
    socket.join(code);
    socket.emit('lobby-joined', lobby);
    io.to(code).emit('lobby-updated', lobby);
    console.log(`${playerName} joined lobby ${code}`);
  });

  // Add AI player
  socket.on('add-ai', ({ code }) => {
    const lobby = lobbies.get(code);
    
    if (!lobby) {
      socket.emit('error', { error: 'Lobby not found' });
      return;
    }
    
    // Check if requester is host
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { error: 'Only host can add AI players' });
      return;
    }
    
    const result = addAIToLobby(code);
    
    if (!result.success) {
      socket.emit('error', { error: result.error });
      return;
    }
    
    io.to(code).emit('lobby-updated', lobby);
    console.log(`AI added to lobby ${code}`);
  });

  // Remove AI player
  socket.on('remove-ai', ({ code, aiId }) => {
    const lobby = lobbies.get(code);
    
    if (!lobby) {
      socket.emit('error', { error: 'Lobby not found' });
      return;
    }
    
    // Check if requester is host
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { error: 'Only host can remove AI players' });
      return;
    }
    
    const result = removeAIFromLobby(code, aiId);
    
    if (!result.success) {
      socket.emit('error', { error: result.error });
      return;
    }
    
    io.to(code).emit('lobby-updated', lobby);
    console.log(`AI removed from lobby ${code}`);
  });

  // Player ready toggle
  socket.on('toggle-ready', ({ code }) => {
    const lobby = lobbies.get(code);
    if (!lobby) return;
    
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;
    
    player.isReady = !player.isReady;
    io.to(code).emit('lobby-updated', lobby);
  });

  // Start game
  socket.on('start-game', ({ code }) => {
    const lobby = lobbies.get(code);
    
    if (!lobby) {
      socket.emit('error', { error: 'Lobby not found' });
      return;
    }
    
    // Check if requester is host
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { error: 'Only host can start the game' });
      return;
    }
    
    // Check if all players are ready
    const allReady = lobby.players.every(p => p.isReady || p.isHost);
    if (!allReady && lobby.players.length > 1) {
      socket.emit('error', { error: 'All players must be ready' });
      return;
    }
    
    // Need at least 2 players (including AI)
    if (lobby.players.length + lobby.aiPlayers.length < 2) {
      socket.emit('error', { error: 'Need at least 2 players to start' });
      return;
    }
    
    lobby.gameStarted = true;
    io.to(code).emit('game-started', lobby);
    console.log(`Game started in lobby ${code}`);
  });

  // Game actions
  socket.on('game-action', ({ code, action, data }) => {
    const lobby = lobbies.get(code);
    if (!lobby || !lobby.gameStarted) return;
    
    // Broadcast game action to all players in lobby
    io.to(code).emit('game-action', { action, data, playerId: socket.id });
  });

  // Leave lobby
  socket.on('leave-lobby', ({ code }) => {
    const lobby = removePlayerFromLobby(code, socket.id);
    socket.leave(code);
    
    if (lobby) {
      io.to(code).emit('lobby-updated', lobby);
      io.to(code).emit('player-left', { playerId: socket.id });
    }
    
    console.log(`Player ${socket.id} left lobby ${code}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from any lobby they're in
    lobbies.forEach((lobby, code) => {
      const remainingLobby = removePlayerFromLobby(code, socket.id);
      if (remainingLobby) {
        io.to(code).emit('lobby-updated', remainingLobby);
        io.to(code).emit('player-left', { playerId: socket.id });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 UNO Game Server running on port ${PORT}`);
});
