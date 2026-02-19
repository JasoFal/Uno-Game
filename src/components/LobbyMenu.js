import React, { useState } from 'react';

const LobbyMenu = ({ onCreateLobby, onJoinLobby, onBack }) => {
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [playerName, setPlayerName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    maxWidth: '500px',
    width: '100%'
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '30px',
    textAlign: 'center'
  };

  const buttonStyle = {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '15px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  };

  const backButtonStyle = {
    ...buttonStyle,
    background: '#ccc',
    color: '#333'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '15px',
    boxSizing: 'border-box'
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    gap: '10px'
  };

  const errorStyle = {
    color: '#f5576c',
    fontSize: '14px',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold'
  };

  const handleCreateLobby = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateLobby(playerName, usePassword ? password : null);
    } catch (err) {
      setError(err.error || 'Failed to create lobby');
      setLoading(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!lobbyCode.trim()) {
      setError('Please enter lobby code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onJoinLobby(lobbyCode.toUpperCase(), playerName, password || null);
    } catch (err) {
      setError(err.error || 'Failed to join lobby');
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>🎮 Multiplayer Lobby</h1>
          
          <button
            style={primaryButtonStyle}
            onClick={() => setMode('create')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Create Lobby
          </button>

          <button
            style={secondaryButtonStyle}
            onClick={() => setMode('join')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Join Lobby
          </button>

          <button
            style={backButtonStyle}
            onClick={onBack}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Create Lobby</h1>

          {error && <div style={errorStyle}>{error}</div>}

          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={inputStyle}
            maxLength={20}
          />

          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="usePassword"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="usePassword" style={{ fontSize: '16px', cursor: 'pointer' }}>
              Password Protect Lobby
            </label>
          </div>

          {usePassword && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              maxLength={20}
            />
          )}

          <button
            style={primaryButtonStyle}
            onClick={handleCreateLobby}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Creating...' : 'Create Lobby'}
          </button>

          <button
            style={backButtonStyle}
            onClick={() => {
              setMode(null);
              setError('');
              setPlayerName('');
              setPassword('');
              setUsePassword(false);
            }}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Join Lobby</h1>

          {error && <div style={errorStyle}>{error}</div>}

          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={inputStyle}
            maxLength={20}
          />

          <input
            type="text"
            placeholder="Lobby Code"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
            style={inputStyle}
            maxLength={6}
          />

          <input
            type="password"
            placeholder="Password (if required)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            maxLength={20}
          />

          <button
            style={primaryButtonStyle}
            onClick={handleJoinLobby}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Joining...' : 'Join Lobby'}
          </button>

          <button
            style={backButtonStyle}
            onClick={() => {
              setMode(null);
              setError('');
              setPlayerName('');
              setLobbyCode('');
              setPassword('');
            }}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }
};

export default LobbyMenu;
