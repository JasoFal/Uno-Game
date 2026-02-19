import React, { useState, useEffect } from 'react';
import PlayerHand from './PlayerHand';
import DiscardPile from './DiscardPile';
import DrawPile from './DrawPile';
import ColorPicker from './ColorPicker';
import UnoButton from './UnoButton';  // Add this import
import { createDeck, canPlayCard, CARD_TYPES } from '../utils/deck';

const GameBoard = () => {
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [currentColor, setCurrentColor] = useState(null);
  const [gameDirection, setGameDirection] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [gameMessage, setGameMessage] = useState('');
  const [showUnoButton, setShowUnoButton] = useState(false);  // Add this
  const [unoTargetPlayer, setUnoTargetPlayer] = useState(null);  // Add this
  const [unoCalled, setUnoCalled] = useState({});  // Track who has called UNO
  const numberOfPlayers = 2;

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  // Check for UNO situation after players state changes
  useEffect(() => {
    checkForUnoSituation();
  }, [players]);

  const startNewGame = () => {
    const newDeck = createDeck();
    const newPlayers = [];
    
    // Deal 7 cards to each player
    let deckIndex = 0;
    for (let i = 0; i < numberOfPlayers; i++) {
      newPlayers.push(newDeck.slice(deckIndex, deckIndex + 7));
      deckIndex += 7;
    }

    // Find first non-wild card for discard pile
    let firstCard = newDeck[deckIndex];
    while (firstCard.color === 'wild') {
      deckIndex++;
      firstCard = newDeck[deckIndex];
    }
    
    setPlayers(newPlayers);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color);
    setDeck(newDeck.slice(deckIndex + 1));
    setCurrentPlayer(0);
    setGameDirection(1);
    setGameMessage('Game started! Player 1\'s turn');
    setUnoCalled({});  // Reset UNO calls
    setShowUnoButton(false);
    setUnoTargetPlayer(null);
  };

  const checkForUnoSituation = () => {
    // Check if any player has exactly 1 card and hasn't called UNO
    players.forEach((hand, index) => {
      if (hand.length === 1 && !unoCalled[index]) {
        setShowUnoButton(true);
        setUnoTargetPlayer(index);
      }
    });
  };

  const handleUnoClick = (clickingPlayer) => {
    if (unoTargetPlayer === null) return;

    if (clickingPlayer === unoTargetPlayer) {
      // Target player clicked - they're safe!
      setUnoCalled({ ...unoCalled, [clickingPlayer]: true });
      setGameMessage(`Player ${clickingPlayer + 1} called UNO!`);
      setShowUnoButton(false);
      setUnoTargetPlayer(null);
    } else {
      // Another player clicked first - target draws 2 cards
      if (deck.length >= 2) {
        drawCard(unoTargetPlayer, 2);
        setGameMessage(`Player ${clickingPlayer + 1} caught Player ${unoTargetPlayer + 1}! Player ${unoTargetPlayer + 1} draws 2 cards!`);
      }
      setShowUnoButton(false);
      setUnoTargetPlayer(null);
    }
  };

  const drawCard = (playerIndex, count = 1) => {
    const newDeck = [...deck];
    const newPlayers = [...players];
    const drawnCards = newDeck.splice(0, Math.min(count, newDeck.length));
    
    newPlayers[playerIndex] = [...newPlayers[playerIndex], ...drawnCards];
    
    setDeck(newDeck);
    setPlayers(newPlayers);
    
    // If player draws cards, they no longer have UNO
    if (unoCalled[playerIndex]) {
      const newUnoCalled = { ...unoCalled };
      delete newUnoCalled[playerIndex];
      setUnoCalled(newUnoCalled);
    }
    
    return drawnCards;
  };

  const handleDrawCard = () => {
    if (deck.length === 0) {
      setGameMessage('No more cards to draw!');
      return;
    }

    drawCard(currentPlayer, 1);
    setGameMessage(`Player ${currentPlayer + 1} drew a card`);
    nextTurn();
  };

  const nextTurn = (skip = false) => {
    const nextPlayer = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
    
    if (skip) {
      const skippedPlayer = nextPlayer;
      const afterSkip = (nextPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
      setCurrentPlayer(afterSkip);
      setGameMessage(`Player ${skippedPlayer + 1} was skipped! Player ${afterSkip + 1}'s turn`);
    } else {
      setCurrentPlayer(nextPlayer);
      setGameMessage(`Player ${nextPlayer + 1}'s turn`);
    }
  };

  const handleCardPlay = (card) => {
    const topCard = discardPile[discardPile.length - 1];
    
    if (!canPlayCard(card, topCard, currentColor)) {
      setGameMessage('Cannot play that card!');
      return;
    }

    // Handle wild cards
    if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
      setPendingCard(card);
      setShowColorPicker(true);
      return;
    }

    playCard(card);
  };

  const playCard = (card, chosenColor = null) => {
    const newPlayers = [...players];
    const playerHand = newPlayers[currentPlayer];
    const cardIndex = playerHand.findIndex(c => c.id === card.id);
    
    if (cardIndex === -1) return;

    // Remove card from player's hand
    playerHand.splice(cardIndex, 1);
    newPlayers[currentPlayer] = playerHand;

    // Add to discard pile
    const newDiscardPile = [...discardPile, card];
    setDiscardPile(newDiscardPile);
    setPlayers(newPlayers);

    // Check for winner
    if (playerHand.length === 0) {
      setGameMessage(`Player ${currentPlayer + 1} wins!`);
      setShowUnoButton(false);
      return;
    }

    // If player now has more than 1 card, remove their UNO status
    if (playerHand.length > 1 && unoCalled[currentPlayer]) {
      const newUnoCalled = { ...unoCalled };
      delete newUnoCalled[currentPlayer];
      setUnoCalled(newUnoCalled);
    }

    // Handle card effects
    const newColor = chosenColor || card.color;
    setCurrentColor(newColor);

    switch (card.type) {
      case CARD_TYPES.SKIP:
        setGameMessage(`Player ${currentPlayer + 1} played Skip!`);
        nextTurn(true);
        break;
      
      case CARD_TYPES.REVERSE:
        setGameDirection(-gameDirection);
        setGameMessage(`Player ${currentPlayer + 1} played Reverse!`);
        nextTurn();
        break;
      
      case CARD_TYPES.DRAW_TWO:
        const nextPlayerIdx = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
        drawCard(nextPlayerIdx, 2);
        setGameMessage(`Player ${currentPlayer + 1} played Draw Two! Player ${nextPlayerIdx + 1} draws 2 cards`);
        nextTurn(true);
        break;
      
      case CARD_TYPES.WILD:
        setGameMessage(`Player ${currentPlayer + 1} played Wild! Color changed to ${newColor}`);
        nextTurn();
        break;
      
      case CARD_TYPES.WILD_DRAW_FOUR:
        const nextPlayerIdx2 = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
        drawCard(nextPlayerIdx2, 4);
        setGameMessage(`Player ${currentPlayer + 1} played Wild Draw Four! Player ${nextPlayerIdx2 + 1} draws 4 cards. Color: ${newColor}`);
        nextTurn(true);
        break;
      
      default:
        setGameMessage(`Player ${currentPlayer + 1} played ${card.value || card.type}`);
        nextTurn();
    }
  };

  const handleColorSelect = (color) => {
    setShowColorPicker(false);
    playCard(pendingCard, color);
    setPendingCard(null);
  };

  const getPlayableCards = () => {
    const topCard = discardPile[discardPile.length - 1];
    const currentHand = players[currentPlayer] || [];
    
    return currentHand
      .filter(card => canPlayCard(card, topCard, currentColor))
      .map(card => card.id);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>UNO Game</h1>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px' }}>
          {gameMessage}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
        <DrawPile onDraw={handleDrawCard} cardsRemaining={deck.length} />
        <DiscardPile topCard={discardPile[discardPile.length - 1]} currentColor={currentColor} />
      </div>

      <button 
        onClick={startNewGame}
        style={{
          display: 'block',
          margin: '20px auto',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        New Game
      </button>

      {players.map((hand, index) => (
        <div 
          key={index}
          style={{
            border: currentPlayer === index ? '3px solid #4CAF50' : '1px solid #ccc',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: currentPlayer === index ? '#e8f5e9' : 'white'
          }}
        >
          <PlayerHand
            cards={hand}
            onCardClick={currentPlayer === index ? handleCardPlay : null}
            playableCards={currentPlayer === index ? getPlayableCards() : []}
            playerNumber={index + 1}
          />
        </div>
      ))}

      {showColorPicker && <ColorPicker onColorSelect={handleColorSelect} />}
      
      {showUnoButton && (
        <UnoButton 
          onUnoClick={handleUnoClick}
          targetPlayer={unoTargetPlayer}
          numberOfPlayers={numberOfPlayers}
        />
      )}
    </div>
  );
};

export default GameBoard;