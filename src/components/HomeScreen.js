import React from 'react';

const HomeScreen = ({ onQuickPlay, onLobby }) => {
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  };

  const titleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '4px 4px 8px rgba(0, 0, 0, 0.3)',
    marginBottom: '20px',
    animation: 'bounce 2s ease-in-out infinite'
  };

  const subtitleStyle = {
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '60px',
    textAlign: 'center'
  };

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '300px'
  };

  const buttonStyle = {
    padding: '20px 40px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '2px'
  };

  const quickPlayButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  };

  const lobbyButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  };

  const cardDecorStyle = {
    fontSize: '100px',
    animation: 'float 3s ease-in-out infinite',
    position: 'absolute',
    opacity: 0.2
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(10deg); }
          }
        `}
      </style>

      {/* Decorative cards */}
      <div style={{ ...cardDecorStyle, top: '10%', left: '10%', animationDelay: '0s' }}>🎴</div>
      <div style={{ ...cardDecorStyle, top: '20%', right: '15%', animationDelay: '0.5s' }}>🃏</div>
      <div style={{ ...cardDecorStyle, bottom: '15%', left: '15%', animationDelay: '1s' }}>🎴</div>
      <div style={{ ...cardDecorStyle, bottom: '10%', right: '10%', animationDelay: '1.5s' }}>🃏</div>

      <h1 style={titleStyle}>UNO! 🎴</h1>
      <p style={subtitleStyle}>The Classic Card Game</p>

      <div style={buttonContainerStyle}>
        <button
          style={quickPlayButtonStyle}
          onClick={onQuickPlay}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
          }}
        >
          ⚡ Quick Play
        </button>

        <button
          style={lobbyButtonStyle}
          onClick={onLobby}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
          }}
        >
          🎮 Lobby
        </button>
      </div>

      <p style={{ 
        color: 'rgba(255, 255, 255, 0.7)', 
        marginTop: '60px',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        Quick Play: Play against 3 AI opponents<br/>
        Lobby: Coming soon!
      </p>
    </div>
  );
};

export default HomeScreen;