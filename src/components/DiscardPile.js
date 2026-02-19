import React from 'react';
import Card from './Card';

const DiscardPile = ({ topCard, currentColor }) => {
  return (
    <div style={{ textAlign: 'center', margin: '20px' }}>
      <h3>Discard Pile</h3>
      {currentColor && (
        <p style={{ 
          color: currentColor, 
          fontWeight: 'bold',
          fontSize: '18px',
          textTransform: 'uppercase'
        }}>
          Current Color: {currentColor}
        </p>
      )}
      {topCard && <Card card={topCard} isPlayable={false} />}
    </div>
  );
};

export default DiscardPile;