import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';

const LobbyRoom = ({ lobby: initialLobby, onStartGame, onLeaveLobby }) => {
  const [lobby, setLobby] = useState(initialLobby);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const currentPlayerId = socketService.getSocketId();
  
  const currentPlayer = lobby.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const allPlayers = [...lobby.players, ...lobby.aiPlayers];

  useEffect(() => {
    const handleLobbyUpdate = (updatedLobby) => {
      console.log('=== Received lobby-updated ===');
      console.log('Updated lobby:', updatedLobby);
      console.log('Players:');
      updatedLobby.players.forEach((p, idx) => {
        console.log(`  [${idx}] name="${p.name}", id="${p.id}", host=${p.isHost}`);
      });
      console.log('AI players:');
      updatedLobby.aiPlayers.forEach((ai, idx) => {
        console.log(`  [${updatedLobby.players.length + idx}] name="${ai.name}"`);
      });
      setLobby(updatedLobby);
    };

    const handleError = (err) => {
      setError(err.error || 'An error occurred');
      setTimeout(() => setError(''), 3000);
    };

    const handlePlayerLeft = (data) => {
      console.log('Player left:', data.playerId);
    };

    socketService.onLobbyUpdated(handleLobbyUpdate);
    socketService.onError(handleError);
    socketService.onPlayerLeft(handlePlayerLeft);

    return () => {
      socketService.offLobbyUpdated(handleLobbyUpdate);
      socketService.offError(handleError);
      socketService.offPlayerLeft(handlePlayerLeft);
    };
  }, []);

  const handleAddAI = () => {
    socketService.addAI(lobby.code);
  };

  const handleRemoveAI = (aiId) => {
    socketService.removeAI(lobby.code, aiId);
  };

  const handleToggleReady = () => {
    socketService.toggleReady(lobby.code);
  };

  const handleStartGame = () => {
    socketService.startGame(lobby.code);
  };

  const handleLeave = () => {
    socketService.leaveLobby(lobby.code);
    onLeaveLobby();
  };

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    maxWidth: '700px',
    width: '100%'
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '10px',
    textAlign: 'center'
  };

  const codeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px'
  };

  const codeStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#764ba2',
    letterSpacing: '4px',
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px'
  };

  const copyButtonStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    background: copied ? '#4CAF50' : '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const playerListStyle = {
    marginBottom: '30px'
  };

  const playerItemStyle = (isCurrentPlayer) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: isCurrentPlayer ? '#e8f5e9' : '#f5f5f5',
    borderRadius: '10px',
    border: isCurrentPlayer ? '2px solid #4CAF50' : '2px solid transparent'
  });

  const playerInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 'bold'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  };

  const buttonStyle = {
    flex: 1,
    minWidth: '150px',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  const successButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
  };

  const errorStyle = {
    color: '#f5576c',
    fontSize: '14px',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
    padding: '10px',
    backgroundColor: '#ffe6e6',
    borderRadius: '8px'
  };

  const canStartGame = isHost && 
    allPlayers.length >= 2 && 
    lobby.players.every(p => p.isReady || p.isHost);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>🎮 Lobby</h1>

        <div style={codeContainerStyle}>
          <span style={codeStyle}>{lobby.code}</span>
          <button
            style={copyButtonStyle}
            onClick={copyLobbyCode}
            onMouseEnter={(e) => !copied && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        {lobby.password && (
          <div style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
            🔒 Password Protected
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <div style={playerListStyle}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>
            Players ({allPlayers.length}/{lobby.maxPlayers})
          </h3>

          {allPlayers.map((player) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isAI = player.isAI;

            return (
              <div key={player.id} style={playerItemStyle(isCurrentPlayer)}>
                <div style={playerInfoStyle}>
                  <span>{isAI ? '🤖' : '👤'}</span>
                  <span>{player.name}</span>
                  {player.isHost && <span style={{ color: '#FFD700' }}>👑</span>}
                  {player.isReady && !player.isHost && <span style={{ color: '#4CAF50' }}>✓</span>}
                </div>

                {isHost && isAI && (
                  <button
                    style={{
                      padding: '5px 15px',
                      fontSize: '14px',
                      background: '#f5576c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRemoveAI(player.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={buttonContainerStyle}>
          {isHost && allPlayers.length < lobby.maxPlayers && (
            <button
              style={primaryButtonStyle}
              onClick={handleAddAI}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              + Add AI Player
            </button>
          )}

          {!isHost && (
            <button
              style={currentPlayer?.isReady ? dangerButtonStyle : successButtonStyle}
              onClick={handleToggleReady}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
            </button>
          )}
        </div>

        <div style={buttonContainerStyle}>
          {isHost && (
            <button
              style={{
                ...successButtonStyle,
                opacity: canStartGame ? 1 : 0.5,
                cursor: canStartGame ? 'pointer' : 'not-allowed'
              }}
              onClick={handleStartGame}
              disabled={!canStartGame}
              onMouseEnter={(e) => canStartGame && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Start Game
            </button>
          )}

          <button
            style={dangerButtonStyle}
            onClick={handleLeave}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Leave Lobby
          </button>
        </div>

        {!canStartGame && isHost && (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginTop: '10px' }}>
            {allPlayers.length < 2 
              ? 'Need at least 2 players to start' 
              : 'All players must be ready to start'}
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyRoom;
