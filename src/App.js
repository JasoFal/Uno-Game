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
    } catch (error) {
      console.error('Failed to connect to server:', error);
      alert('Failed to connect to server. Please make sure the server is running on port 3001.');
    }
  };

  const handleCreateLobby = async (playerName, password) => {
    try {
      const lobby = await socketService.createLobby(playerName, password);
      console.log('=== LOBBY CREATED ===');
      console.log('Received lobby:', lobby);
      console.log('My socket ID:', socketService.getSocketId());
      console.log('Players in lobby:');
      lobby.players.forEach((p, idx) => {
        console.log(`  [${idx}] ${p.name} (id: ${p.id}, host: ${p.isHost})`);
      });
      console.log('AI players:');
      lobby.aiPlayers.forEach((ai, idx) => {
        console.log(`  [${lobby.players.length + idx}] ${ai.name}`);
      });
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
      console.log('=== LOBBY JOINED ===');
      console.log('Received lobby:', lobby);
      console.log('My socket ID:', socketService.getSocketId());
      console.log('Players in lobby:');
      lobby.players.forEach((p, idx) => {
        console.log(`  [${idx}] ${p.name} (id: ${p.id}, host: ${p.isHost})`);
      });
      console.log('AI players:');
      lobby.aiPlayers.forEach((ai, idx) => {
        console.log(`  [${lobby.players.length + idx}] ${ai.name}`);
      });
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
        console.log('=== GAME STARTED ===');
        console.log('Received lobby:', lobby);
        console.log('My socket ID:', socketService.getSocketId());
        console.log('Players in lobby:');
        lobby.players.forEach((p, idx) => {
          console.log(`  [${idx}] ${p.name} (id: ${p.id}, host: ${p.isHost})`);
        });
        console.log('AI players:');
        lobby.aiPlayers.forEach((ai, idx) => {
          console.log(`  [${lobby.players.length + idx}] ${ai.name}`);
        });
        
        setCurrentLobby(lobby);
        setGameMode('multiplayerGame');
      };

      const handleLobbyUpdated = (updatedLobby) => {
        console.log('=== Lobby Updated ===');
        console.log('Updated lobby:', updatedLobby);
        setCurrentLobby(updatedLobby);
      };

      socketService.onGameStarted(handleGameStarted);
      socketService.onLobbyUpdated(handleLobbyUpdated);

      return () => {
        socketService.offGameStarted(handleGameStarted);
        socketService.offLobbyUpdated(handleLobbyUpdated);
      };
    }
  }, [gameMode, currentLobby]);

  // Log when rendering multiplayer game
  useEffect(() => {
    if (gameMode === 'multiplayerGame' && currentLobby) {
      console.log('=== Rendering Multiplayer GameBoard ===');
      console.log('currentLobby:', currentLobby);
      console.log('numberOfPlayers:', currentLobby.players.length + currentLobby.aiPlayers.length);
      console.log('My socket ID:', socketService.getSocketId());
      console.log('humanPlayer index:', Math.max(0, currentLobby.players.findIndex(p => p.id === socketService.getSocketId())));
      console.log('Players:');
      currentLobby.players.forEach((p, idx) => {
        console.log(`  [${idx}] name="${p.name}", id="${p.id}", isAI="${p.isAI || false}"`);
      });
      console.log('AI players:');
      currentLobby.aiPlayers.forEach((ai, idx) => {
        console.log(`  [${currentLobby.players.length + idx}] name="${ai.name}"`);
      });

      // Listen for lobby updates during game (for player disconnects/AI takeover)
      const handleLobbyUpdated = (updatedLobby) => {
        console.log('=== Lobby Updated During Game ===');
        console.log('Updated lobby:', updatedLobby);
        console.log('Players:');
        updatedLobby.players.forEach((p, idx) => {
          console.log(`  [${idx}] name="${p.name}", id="${p.id}", isAI="${p.isAI || false}"`);
        });
        setCurrentLobby(updatedLobby);
      };

      socketService.onLobbyUpdated(handleLobbyUpdated);

      return () => {
        socketService.offLobbyUpdated(handleLobbyUpdated);
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
          humanPlayer={Math.max(0, currentLobby.players.findIndex(p => p.id === socketService.getSocketId()))}
          onBackToMenu={handleBackToMenu}
          isMultiplayer={true}
          lobby={currentLobby}
        />
      )}
    </div>
  );
}

export default App;