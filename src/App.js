import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import GameBoard from './components/GameBoard';
import LobbyMenu from './components/LobbyMenu';
import LobbyRoom from './components/LobbyRoom';
import socketService from './services/socket';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState('menu'); // 'menu', 'quickplay', 'lobby', 'lobbyRoom', 'multiplayerGame'
  const [currentLobby, setCurrentLobby] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (socketService.isConnected()) {
        socketService.disconnect();
      }
    };
  }, []);

  const handleQuickPlay = () => {
    setGameMode('quickplay');
  };

  const handleLobby = async () => {
    try {
      await socketService.connect();
      setGameMode('lobby');
      setConnectionError(false);
    } catch (error) {
      console.error('Failed to connect to server:', error);
      setConnectionError(true);
      alert('Failed to connect to server. Please make sure the server is running on port 3001.');
    }
  };

  const handleCreateLobby = async (playerName, password) => {
    try {
      const lobby = await socketService.createLobby(playerName, password);
      setCurrentLobby(lobby);
      setGameMode('lobbyRoom');
    } catch (error) {
      console.error('Failed to create lobby:', error);
      throw error;
    }
  };

  const handleJoinLobby = async (code, playerName, password) => {
    try {
      const lobby = await socketService.joinLobby(code, playerName, password);
      setCurrentLobby(lobby);
      setGameMode('lobbyRoom');
    } catch (error) {
      console.error('Failed to join lobby:', error);
      throw error;
    }
  };

  const handleStartGame = () => {
    setGameMode('multiplayerGame');
  };

  const handleLeaveLobby = () => {
    setCurrentLobby(null);
    setGameMode('lobby');
  };

  const handleBackToMenu = () => {
    if (currentLobby) {
      socketService.leaveLobby(currentLobby.code);
      setCurrentLobby(null);
    }
    if (socketService.isConnected()) {
      socketService.disconnect();
    }
    setGameMode('menu');
  };

  useEffect(() => {
    if (gameMode === 'lobbyRoom' && currentLobby) {
      const handleGameStarted = (lobby) => {
        console.log('Game started!', lobby);
        setCurrentLobby(lobby);
        setGameMode('multiplayerGame');
      };

      socketService.onGameStarted(handleGameStarted);

      return () => {
        socketService.offGameStarted(handleGameStarted);
      };
    }
  }, [gameMode, currentLobby]);

  return (
    <div className="App">
      {gameMode === 'menu' && (
        <HomeScreen onQuickPlay={handleQuickPlay} onLobby={handleLobby} />
      )}
      
      {gameMode === 'quickplay' && (
        <GameBoard 
          numberOfPlayers={4} 
          humanPlayer={0} 
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {gameMode === 'lobby' && (
        <LobbyMenu
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
          onBack={handleBackToMenu}
        />
      )}
      
      {gameMode === 'lobbyRoom' && currentLobby && (
        <LobbyRoom
          lobby={currentLobby}
          onStartGame={handleStartGame}
          onLeaveLobby={handleLeaveLobby}
        />
      )}
      
      {gameMode === 'multiplayerGame' && currentLobby && (
        <GameBoard 
          numberOfPlayers={currentLobby.players.length + currentLobby.aiPlayers.length}
          humanPlayer={currentLobby.players.findIndex(p => p.id === socketService.getSocketId())}
          onBackToMenu={handleBackToMenu}
          isMultiplayer={true}
          lobby={currentLobby}
        />
      )}
    </div>
  );
}

export default App;