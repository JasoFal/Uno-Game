import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket && this.connected) {
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket.id);
        this.connected = true;
        resolve(this.socket);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Lobby events
  createLobby(playerName, password = null) {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-lobby', { playerName, password });

      this.socket.once('lobby-created', (lobby) => {
        resolve(lobby);
      });

      this.socket.once('error', (error) => {
        reject(error);
      });
    });
  }

  joinLobby(code, playerName, password = null) {
    return new Promise((resolve, reject) => {
      this.socket.emit('join-lobby', { code, playerName, password });

      this.socket.once('lobby-joined', (lobby) => {
        resolve(lobby);
      });

      this.socket.once('join-error', (error) => {
        reject(error);
      });
    });
  }

  leaveLobby(code) {
    if (this.socket) this.socket.emit('leave-lobby', { code });
  }

  addAI(code) {
    if (this.socket) this.socket.emit('add-ai', { code });
  }

  removeAI(code, aiId) {
    if (this.socket) this.socket.emit('remove-ai', { code, aiId });
  }

  toggleReady(code) {
    if (this.socket) this.socket.emit('toggle-ready', { code });
  }

  startGame(code) {
    if (this.socket) this.socket.emit('start-game', { code });
  }

  // Game events
  sendGameAction(code, action, data) {
    if (this.socket) this.socket.emit('game-action', { code, action, data });
  }

  // Event listeners
  onLobbyUpdated(callback) {
    if (this.socket) this.socket.on('lobby-updated', callback);
  }

  onPlayerLeft(callback) {
    if (this.socket) this.socket.on('player-left', callback);
  }

  onGameStarted(callback) {
    if (this.socket) this.socket.on('game-started', callback);
  }

  onGameAction(callback) {
    if (this.socket) this.socket.on('game-action', callback);
  }

  onError(callback) {
    if (this.socket) this.socket.on('error', callback);
  }

  // Remove listeners
  offLobbyUpdated(callback) {
    if (this.socket) this.socket.off('lobby-updated', callback);
  }

  offPlayerLeft(callback) {
    if (this.socket) this.socket.off('player-left', callback);
  }

  offGameStarted(callback) {
    if (this.socket) this.socket.off('game-started', callback);
  }

  offGameAction(callback) {
    if (this.socket) this.socket.off('game-action', callback);
  }

  offError(callback) {
    if (this.socket) this.socket.off('error', callback);
  }

  getSocketId() {
    return this.socket?.id;
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

const socketService = new SocketService();
export default socketService;
