import React, { useState, useEffect, useCallback } from 'react';
import PlayerHand from './PlayerHand';
import DiscardPile from './DiscardPile';
import DrawPile from './DrawPile';
import ColorPicker from './ColorPicker';
import UnoButton from './UnoButton';
import { createDeck, canPlayCard, CARD_TYPES } from '../utils/deck';
import { aiSelectCard, aiSelectWildColor, getAiDelay } from '../utils/ai';

const GameBoard = ({ numberOfPlayers = 4, humanPlayer = 0, onBackToMenu }) => {
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [currentColor, setCurrentColor] = useState(null);
  const [gameDirection, setGameDirection] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [gameMessage, setGameMessage] = useState('');
  const [showUnoButton, setShowUnoButton] = useState(false);
  const [unoTargetPlayer, setUnoTargetPlayer] = useState(null);
  const [unoCalled, setUnoCalled] = useState({});
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Function definitions (in dependency order)
  const startNewGame = useCallback(() => {
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
    setGameMessage(humanPlayer === 0 ? 'Your turn!' : 'AI Player 1\'s turn');
    setUnoCalled({});
    setShowUnoButton(false);
    setUnoTargetPlayer(null);
    setGameOver(false);
  }, [numberOfPlayers, humanPlayer]);

  const drawCard = useCallback((playerIndex, count = 1) => {
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
  }, [deck, players, unoCalled]);

  const nextTurn = useCallback((skip = false) => {
    const nextPlayer = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
    
    if (skip) {
      const skippedPlayer = nextPlayer;
      const afterSkip = (nextPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
      setCurrentPlayer(afterSkip);
      
      const skippedName = skippedPlayer === humanPlayer ? 'You were' : `AI Player ${skippedPlayer + 1} was`;
      const nextName = afterSkip === humanPlayer ? 'Your' : `AI Player ${afterSkip + 1}'s`;
      setGameMessage(`${skippedName} skipped! ${nextName} turn`);
    } else {
      setCurrentPlayer(nextPlayer);
      const nextName = nextPlayer === humanPlayer ? 'Your turn!' : `AI Player ${nextPlayer + 1}'s turn`;
      setGameMessage(nextName);
    }
  }, [currentPlayer, gameDirection, numberOfPlayers, humanPlayer]);

  const handleDrawCard = useCallback(() => {
    if (deck.length === 0) {
      setGameMessage('No more cards to draw!');
      return;
    }

    drawCard(currentPlayer, 1);
    const playerName = currentPlayer === humanPlayer ? 'You' : `AI Player ${currentPlayer + 1}`;
    setGameMessage(`${playerName} drew a card`);
    nextTurn();
  }, [deck.length, drawCard, currentPlayer, humanPlayer, nextTurn]);

  const playCard = useCallback((card, chosenColor = null) => {
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
      const winnerName = currentPlayer === humanPlayer ? 'You win!' : `AI Player ${currentPlayer + 1} wins!`;
      setGameMessage(winnerName);
      setGameOver(true);
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

    const playerName = currentPlayer === humanPlayer ? 'You' : `AI Player ${currentPlayer + 1}`;

    switch (card.type) {
      case CARD_TYPES.SKIP:
        setGameMessage(`${playerName} played Skip!`);
        nextTurn(true);
        break;
      
      case CARD_TYPES.REVERSE:
        setGameDirection(-gameDirection);
        setGameMessage(`${playerName} played Reverse!`);
        nextTurn();
        break;
      
      case CARD_TYPES.DRAW_TWO:
        const nextPlayerIdx = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
        drawCard(nextPlayerIdx, 2);
        const targetName = nextPlayerIdx === humanPlayer ? 'You' : `AI Player ${nextPlayerIdx + 1}`;
        setGameMessage(`${playerName} played Draw Two! ${targetName} draw${nextPlayerIdx === humanPlayer ? '' : 's'} 2 cards`);
        nextTurn(true);
        break;
      
      case CARD_TYPES.WILD:
        setGameMessage(`${playerName} played Wild! Color changed to ${newColor}`);
        nextTurn();
        break;
      
      case CARD_TYPES.WILD_DRAW_FOUR:
        const nextPlayerIdx2 = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
        drawCard(nextPlayerIdx2, 4);
        const targetName2 = nextPlayerIdx2 === humanPlayer ? 'You' : `AI Player ${nextPlayerIdx2 + 1}`;
        setGameMessage(`${playerName} played Wild Draw Four! ${targetName2} draw${nextPlayerIdx2 === humanPlayer ? '' : 's'} 4 cards. Color: ${newColor}`);
        nextTurn(true);
        break;
      
      default:
        setGameMessage(`${playerName} played ${card.value || card.type}`);
        nextTurn();
    }
  }, [players, currentPlayer, discardPile, humanPlayer, unoCalled, gameDirection, numberOfPlayers, drawCard, nextTurn]);

  const handleUnoClick = useCallback((clickingPlayer) => {
    if (unoTargetPlayer === null) return;

    if (clickingPlayer === unoTargetPlayer) {
      // Target player clicked - they're safe!
      setUnoCalled({ ...unoCalled, [clickingPlayer]: true });
      const playerName = clickingPlayer === humanPlayer ? 'You' : `AI Player ${clickingPlayer + 1}`;
      setGameMessage(`${playerName} called UNO!`);
      setShowUnoButton(false);
      setUnoTargetPlayer(null);
    } else {
      // Another player clicked first - target draws 2 cards
      if (deck.length >= 2) {
        drawCard(unoTargetPlayer, 2);
        const catcher = clickingPlayer === humanPlayer ? 'You' : `AI Player ${clickingPlayer + 1}`;
        const caught = unoTargetPlayer === humanPlayer ? 'you' : `AI Player ${unoTargetPlayer + 1}`;
        setGameMessage(`${catcher} caught ${caught}! ${caught === 'you' ? 'You draw' : 'They draw'} 2 cards!`);
      }
      setShowUnoButton(false);
      setUnoTargetPlayer(null);
    }
  }, [unoTargetPlayer, unoCalled, humanPlayer, deck.length, drawCard]);

  const checkForUnoSituation = useCallback(() => {
    // Check if any player has exactly 1 card and hasn't called UNO
    players.forEach((hand, index) => {
      if (hand.length === 1 && !unoCalled[index] && !showUnoButton) {
        // AI players automatically call UNO after a short delay
        if (index !== humanPlayer) {
          const aiUnoDelay = 500 + Math.random() * 1000; // 0.5-1.5 seconds
          setTimeout(() => {
            handleUnoClick(index);
          }, aiUnoDelay);
        }
        
        setShowUnoButton(true);
        setUnoTargetPlayer(index);
      }
    });
  }, [players, unoCalled, showUnoButton, humanPlayer, handleUnoClick]);

  const handleAiTurn = useCallback(() => {
    const topCard = discardPile[discardPile.length - 1];
    const aiHand = players[currentPlayer];
    
    // AI selects best card to play
    const selectedCard = aiSelectCard(
      aiHand,
      topCard,
      currentColor,
      players,
      currentPlayer,
      gameDirection
    );

    if (!selectedCard) {
      // AI needs to draw
      handleDrawCard();
      return;
    }

    // Handle wild cards
    if (selectedCard.type === CARD_TYPES.WILD || selectedCard.type === CARD_TYPES.WILD_DRAW_FOUR) {
      const chosenColor = aiSelectWildColor(aiHand);
      playCard(selectedCard, chosenColor);
    } else {
      playCard(selectedCard);
    }
  }, [discardPile, players, currentPlayer, currentColor, gameDirection, handleDrawCard, playCard]);

  const handleCardPlay = useCallback((card) => {
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
  }, [discardPile, currentColor, playCard]);

  const handleColorSelect = useCallback((color) => {
    setShowColorPicker(false);
    playCard(pendingCard, color);
    setPendingCard(null);
  }, [pendingCard, playCard]);

  const getPlayableCards = useCallback(() => {
    const topCard = discardPile[discardPile.length - 1];
    const currentHand = players[currentPlayer] || [];
    
    return currentHand
      .filter(card => canPlayCard(card, topCard, currentColor))
      .map(card => card.id);
  }, [discardPile, players, currentPlayer, currentColor]);

  // Effects
  // Initialize game
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Check for UNO situation after players state changes
  useEffect(() => {
    if (!gameOver) {
      checkForUnoSituation();
    }
  }, [gameOver, checkForUnoSituation]);

  // AI turn handler
  useEffect(() => {
    if (currentPlayer !== humanPlayer && !gameOver && !showColorPicker && !showUnoButton) {
      setIsAiTurn(true);
      const delay = getAiDelay();
      
      const aiTimer = setTimeout(() => {
        handleAiTurn();
      }, delay);

      return () => clearTimeout(aiTimer);
    } else {
      setIsAiTurn(false);
    }
  }, [currentPlayer, humanPlayer, gameOver, showColorPicker, showUnoButton, handleAiTurn]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>UNO Game</h1>
        <button
          onClick={onBackToMenu}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back to Menu
        </button>
      </div>
      
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
        {isAiTurn && <p style={{ fontSize: '14px', color: '#666', margin: '5px' }}>AI is thinking...</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
        <DrawPile onDraw={currentPlayer === humanPlayer && !isAiTurn ? handleDrawCard : null} cardsRemaining={deck.length} />
        <DiscardPile topCard={discardPile[discardPile.length - 1]} currentColor={currentColor} />
      </div>

      {!gameOver && (
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
      )}

      {gameOver && (
        <button 
          onClick={startNewGame}
          style={{
            display: 'block',
            margin: '20px auto',
            padding: '15px 30px',
            fontSize: '20px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          🎮 Play Again
        </button>
      )}

      {players.map((hand, index) => (
        <div 
          key={index}
          style={{
            border: currentPlayer === index ? '3px solid #4CAF50' : '1px solid #ccc',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: currentPlayer === index ? '#e8f5e9' : 'white',
            opacity: isAiTurn && index !== humanPlayer ? 0.7 : 1
          }}
        >
          <PlayerHand
            cards={hand}
            onCardClick={currentPlayer === index && index === humanPlayer && !isAiTurn ? handleCardPlay : null}
            playableCards={currentPlayer === index && index === humanPlayer ? getPlayableCards() : []}
            playerNumber={index + 1}
            isAI={index !== humanPlayer}
            isHuman={index === humanPlayer}
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