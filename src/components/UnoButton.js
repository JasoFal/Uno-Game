import React from 'react';

const UnoButton = ({ onUnoClick, targetPlayer, numberOfPlayers, unoMode = 'call', playerTypes = [] }) => {
  // Safeguard: ensure we have valid data
  if (typeof unoMode !== 'string' || unoMode === null) {
    return null;
  }

  // Get the name of the target player safely
  const targetPlayerName = playerTypes[targetPlayer]?.name || `Player ${targetPlayer + 1}`;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-in',
    pointerEvents: 'auto'
  };

  const modalStyle = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    animation: 'scaleIn 0.3s ease-out',
    pointerEvents: 'auto',
    position: 'relative',
    zIndex: 1001
  };

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '30px'
  };

  const playerButtonStyle = (index) => ({
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: index === targetPlayer ? '#4CAF50' : '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
    pointerEvents: 'auto',
    position: 'relative',
    zIndex: 1001
  });

  return (
    <div style={overlayStyle}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
      <div style={modalStyle}>
        <h1 style={{ 
          fontSize: '48px', 
          margin: '0 0 20px 0',
          color: '#ff3333',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          animation: 'pulse 1s ease-in-out infinite'
        }}>
          UNO! 🎴
        </h1>
        <p style={{ 
          fontSize: '20px', 
          marginBottom: '10px',
          color: '#333'
        }}>
          {unoMode === 'call' 
            ? `${targetPlayerName} has 1 card left!`
            : `${targetPlayerName} forgot to call UNO!`
          }
        </p>
        <p style={{ 
          fontSize: '16px', 
          color: '#666',
          marginBottom: '20px'
        }}>
          {unoMode === 'call'
            ? 'Tap your character to call UNO!'
            : 'Tap your character to catch them!'
          }
        </p>
        
        <div style={buttonContainerStyle}>
          {Array.from({ length: numberOfPlayers }, (_, index) => {
            const isTarget = index === targetPlayer;
            const isLocalPlayer = playerTypes[index]?.isLocalHuman;
            const playerName = playerTypes[index]?.name || `Player ${index + 1}`;
            
            // In 'call' mode, only show target player's button
            if (unoMode === 'call') {
              if (!isTarget) return null;
              return (
                <button
                  key={index}
                  style={playerButtonStyle(index)}
                  onClick={() => onUnoClick(index, 'call')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  {isLocalPlayer ? 'I Called UNO! 🎉' : `${playerName} - UNO!`}
                </button>
              );
            }
            
            // In 'catch' mode, show all players except target
            if (unoMode === 'catch') {
              if (isTarget) return null;
              return (
                <button
                  key={index}
                  style={playerButtonStyle(index)}
                  onClick={() => onUnoClick(index, 'catch')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  {isLocalPlayer ? 'Catch Them! 🚨' : `${playerName} - Catch!`}
                </button>
              );
            }
            
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default UnoButton;