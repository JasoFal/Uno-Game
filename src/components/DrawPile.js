import React from 'react';

const DrawPile = ({ onDraw, cardsRemaining }) => {
  const isDisabled = !onDraw;
  
  const cardBackStyle = {
    width: '80px',
    height: '120px',
    backgroundColor: '#1a1a1a',
    border: '2px solid #000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    margin: '20px auto',
    transition: 'transform 0.2s',
    opacity: isDisabled ? 0.5 : 1
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Draw Pile</h3>
      <p>{cardsRemaining} cards remaining</p>
      <div
        style={cardBackStyle}
        onClick={isDisabled ? null : onDraw}
        onMouseEnter={(e) => !isDisabled && (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        UNO
      </div>
    </div>
  );
};

export default DrawPile;