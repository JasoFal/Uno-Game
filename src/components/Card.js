import React from 'react';

const Card = ({ card, onClick, isPlayable, isSmall }) => {
  const getCardDisplay = () => {
    switch (card.type) {
      case 'number':
        return card.value;
      case 'skip':
        return '🚫';
      case 'reverse':
        return '🔄';
      case 'drawTwo':
        return '+2';
      case 'wild':
        return 'W';
      case 'wildDrawFour':
        return 'W+4';
      default:
        return '?';
    }
  };

  const cardStyle = {
    width: isSmall ? '60px' : '80px',
    height: isSmall ? '90px' : '120px',
    backgroundColor: card.color === 'wild' ? '#333' : card.color,
    border: '2px solid #000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isSmall ? '20px' : '28px',
    fontWeight: 'bold',
    color: '#fff',
    cursor: isPlayable ? 'pointer' : 'not-allowed',
    opacity: isPlayable ? 1 : 0.6,
    transition: 'transform 0.2s',
    margin: '5px'
  };

  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick(card);
    }
  };

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={(e) => isPlayable && (e.currentTarget.style.transform = 'translateY(-10px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {getCardDisplay()}
    </div>
  );
};

export default Card;