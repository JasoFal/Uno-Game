import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import GameBoard from './components/GameBoard';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState('menu'); // 'menu', 'quickplay', 'lobby'

  const handleQuickPlay = () => {
    setGameMode('quickplay');
  };

  const handleLobby = () => {
    alert('Lobby feature coming soon! 🎮');
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
  };

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
    </div>
  );
}

export default App;