import React from 'react';
import Card from './Card';

const PlayerHand = ({ cards, onCardClick, playableCards, playerNumber, isAI, isHuman }) => {
  const getPlayerLabel = () => {
    if (isHuman) {
      return `You (Player ${playerNumber})`;
    }
    if (isAI) {
      return `AI Player ${playerNumber}`;
    }
    return `Player ${playerNumber}`;
  };

  return (
    <div style={{ margin: '20px', textAlign: 'center' }}>
      <h3>
        {getPlayerLabel()} ({cards.length} card{cards.length !== 1 ? 's' : ''})
        {isHuman && ' 👤'}
        {isAI && ' 🤖'}
      </h3>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '5px'
      }}>
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            onClick={onCardClick}
            isPlayable={playableCards.includes(card.id)}
            isSmall={cards.length > 10}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;