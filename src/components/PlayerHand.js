import React from 'react';
import Card from './Card';

const PlayerHand = ({ cards, onCardClick, playableCards, playerNumber, isAI, isHuman, playerName, isRemote, isHidden }) => {
  const getPlayerLabel = () => {
    if (playerName) {
      // Use provided player name (from lobby)
      return playerName;
    }
    
    if (isHuman && !isRemote) {
      return `You (Player ${playerNumber})`;
    }
    if (isAI) {
      return `AI Player ${playerNumber}`;
    }
    if (isRemote) {
      return `Player ${playerNumber}`;
    }
    return `Player ${playerNumber}`;
  };

  const getPlayerIcon = () => {
    if (isAI) {
      return ' 🤖';
    }
    if (isHuman && !isRemote) {
      return ' 👤';
    }
    if (isRemote) {
      return ' 🌐';
    }
    return '';
  };

  return (
    <div style={{ margin: '20px', textAlign: 'center' }}>
      <h3>
        {getPlayerLabel()} ({cards.length} card{cards.length !== 1 ? 's' : ''})
        {getPlayerIcon()}
      </h3>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '5px'
      }}>
        {cards.map((card, idx) => (
          <Card
            key={isHidden ? `hidden-${idx}` : card.id}
            card={card}
            onClick={onCardClick}
            isPlayable={!isHidden && playableCards.includes(card.id)}
            isSmall={cards.length > 10}
            isHidden={isHidden}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;