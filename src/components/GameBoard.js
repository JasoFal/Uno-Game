import React, { useState, useEffect, useCallback } from 'react';
import PlayerHand from './PlayerHand';
import DiscardPile from './DiscardPile';
import DrawPile from './DrawPile';
import ColorPicker from './ColorPicker';
import UnoButton from './UnoButton';
import { createDeck, canPlayCard, CARD_TYPES } from '../utils/deck';
import { aiSelectCard, aiSelectWildColor, getAiDelay } from '../utils/ai';
import socketService from '../services/socket';

const GameBoard = ({ numberOfPlayers = 4, humanPlayer = 0, onBackToMenu, isMultiplayer = false, lobby = null }) => {
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
  const [unoMode, setUnoMode] = useState(null); // 'call' for player to call UNO, 'catch' for others to catch
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Multiplayer player mapping
  const playerTypes = useCallback(() => {
    if (!isMultiplayer || !lobby) {
      // Single player mode: only humanPlayer is human, rest are AI
      return Array(numberOfPlayers).fill(null).map((_, i) => ({
        isLocalHuman: i === humanPlayer,
        isRemoteHuman: false,
        isAI: i !== humanPlayer,
        name: i === humanPlayer ? 'You' : `AI Player ${i + 1}`,
        socketId: null
      }));
    }

    // Multiplayer mode: map lobby players
    const types = [];
    const mySocketId = socketService.getSocketId();
    
    // Validate that we have a valid socket ID
    if (!mySocketId) {
      console.error('ERROR: Socket ID is not available! playerTypes() cannot identify local player');
      console.log('Current socket ID:', mySocketId);
      console.log('Lobby players:', lobby.players.map(p => ({ id: p.id, name: p.name })));
    }
    
    // Add human players from lobby
    lobby.players.forEach((player, index) => {
      const isLocal = player.id === mySocketId;
      if (isLocal && !mySocketId) {
        console.error(`ERROR: Player ${player.name} (${player.id}) is identified as local but socket ID is ${mySocketId}`);
      }
      types.push({
        isLocalHuman: isLocal,
        isRemoteHuman: !isLocal,
        isAI: false,
        name: isLocal ? 'You' : player.name,
        socketId: player.id
      });
    });
    
    // Add AI players from lobby
    lobby.aiPlayers.forEach((ai, index) => {
      types.push({
        isLocalHuman: false,
        isRemoteHuman: false,
        isAI: true,
        name: ai.name,
        socketId: null
      });
    });
    
    return types;
  }, [isMultiplayer, lobby, numberOfPlayers, humanPlayer]);

  // Function definitions (in dependency order)
  const startNewGame = useCallback(() => {
    if (isMultiplayer && lobby) {
      const expectedPlayers = lobby.players.length + lobby.aiPlayers.length;
      if (numberOfPlayers !== expectedPlayers) {
        console.error(`ERROR: numberOfPlayers mismatch!`);
        console.error(`  numberOfPlayers prop: ${numberOfPlayers}`);
        console.error(`  Expected from lobby: ${expectedPlayers}`);
        console.error(`  Lobby players: ${lobby.players.length}, Lobby AI: ${lobby.aiPlayers.length}`);
      }
    }
    
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
    setUnoMode(null);
    setGameOver(false);
  }, [numberOfPlayers, humanPlayer, isMultiplayer, lobby]);

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
      const types = playerTypes();
      const nextName = types[nextPlayer]?.isLocalHuman ? 'Your turn!' : `${types[nextPlayer]?.name}'s turn`;
      setGameMessage(nextName);
    }
  }, [currentPlayer, gameDirection, numberOfPlayers, humanPlayer, playerTypes]);

  const handleDrawCard = useCallback(() => {
    if (deck.length === 0) {
      setGameMessage('No more cards to draw!');
      return;
    }

    drawCard(currentPlayer, 1);
    const types = playerTypes();
    const playerName = types[currentPlayer]?.name || 'Player';
    setGameMessage(`${playerName} drew a card`);
    
    // Broadcast draw action in multiplayer
    if (isMultiplayer && lobby) {
      socketService.sendGameAction(lobby.code, 'draw-card', { playerIndex: currentPlayer });
    }
    
    nextTurn();
  }, [deck.length, drawCard, currentPlayer, nextTurn, playerTypes, isMultiplayer, lobby]);

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

    // Calculate next player BEFORE any state changes
    let nextPlayer = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
    let skipped = false;
    
    // Check for Skip card effects
    if (card.type === CARD_TYPES.SKIP) {
      nextPlayer = (nextPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
      skipped = true;
    } else if (card.type === CARD_TYPES.DRAW_TWO || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
      // Next player will be skipped after drawing in the local nextTurn call
      nextPlayer = (nextPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
      skipped = true;
    }

    // Broadcast play action in multiplayer
    if (isMultiplayer && lobby) {
      socketService.sendGameAction(lobby.code, 'play-card', { 
        card, 
        chosenColor,
        playerIndex: currentPlayer,
        cardType: card.type,
        nextPlayer: nextPlayer,
        skipped: skipped,
        direction: gameDirection
      });
    }

    // Check for winner
    if (playerHand.length === 0) {
      const types = playerTypes();
      const winnerName = types[currentPlayer]?.isLocalHuman ? 'You win! 🎉' : `${types[currentPlayer]?.name} wins! 🏆`;
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

    const types = playerTypes();
    const playerName = types[currentPlayer]?.name || 'Player';

    switch (card.type) {
      case CARD_TYPES.SKIP:
        setGameMessage(`${playerName} played Skip!`);
        nextTurn(true);
        break;
      
      case CARD_TYPES.REVERSE:
        setGameDirection(-gameDirection);
        setGameMessage(`${playerName} played Reverse!`);
        if (isMultiplayer && lobby) {
          socketService.sendGameAction(lobby.code, 'direction-change', { direction: -gameDirection });
        }
        nextTurn();
        break;
      
      case CARD_TYPES.DRAW_TWO:
        const nextPlayerIdx = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
        drawCard(nextPlayerIdx, 2);
        const targetName = types[nextPlayerIdx]?.name || 'Player';
        setGameMessage(`${playerName} played Draw Two! ${targetName} draw${types[nextPlayerIdx]?.isLocalHuman ? '' : 's'} 2 cards`);
        nextTurn(true);
        break;
      
      case CARD_TYPES.WILD:
        setGameMessage(`${playerName} played Wild! Color changed to ${newColor}`);
        nextTurn();
        break;
      
      case CARD_TYPES.WILD_DRAW_FOUR:
        const nextPlayerIdx2 = (currentPlayer + gameDirection + numberOfPlayers) % numberOfPlayers;
        drawCard(nextPlayerIdx2, 4);
        const targetName2 = types[nextPlayerIdx2]?.name || 'Player';
        setGameMessage(`${playerName} played Wild Draw Four! ${targetName2} draw${types[nextPlayerIdx2]?.isLocalHuman ? '' : 's'} 4 cards. Color: ${newColor}`);
        nextTurn(true);
        break;
      
      default:
        setGameMessage(`${playerName} played ${card.value || card.type}`);
        nextTurn();
    }
  }, [players, currentPlayer, discardPile, unoCalled, gameDirection, numberOfPlayers, drawCard, nextTurn, playerTypes, isMultiplayer, lobby]);

  const handleUnoClick = useCallback((clickingPlayer, action) => {
    if (unoTargetPlayer === null || unoTargetPlayer === undefined) {
      console.warn('Invalid targetPlayer for UNO click:', unoTargetPlayer);
      return;
    }
    const types = playerTypes();

    if (action === 'call' && clickingPlayer === unoTargetPlayer) {
      // Target player called UNO successfully
      setUnoCalled({ ...unoCalled, [clickingPlayer]: true });
      const playerName = types[clickingPlayer]?.name || 'Player';
      setGameMessage(`${playerName} called UNO!`);
      setShowUnoButton(false);
      setUnoTargetPlayer(null);
      setUnoMode(null);
    } else if (action === 'catch' && clickingPlayer !== unoTargetPlayer) {
      // Another player caught the target for not calling UNO
      if (deck.length >= 2) {
        drawCard(unoTargetPlayer, 2);
        const types = playerTypes();
        const catcher = types[clickingPlayer]?.name || 'Player';
        const caught = types[unoTargetPlayer]?.isLocalHuman ? 'you' : types[unoTargetPlayer]?.name || 'player';
        setGameMessage(`${catcher} caught ${caught}! ${types[unoTargetPlayer]?.isLocalHuman ? 'You draw' : 'They draw'} 2 cards!`);
      }
      setShowUnoButton(false);
      setUnoTargetPlayer(null);
      setUnoMode(null);
    }
  }, [unoTargetPlayer, unoCalled, deck.length, drawCard, playerTypes]);

  const checkForUnoSituation = useCallback(() => {
    // Check if any player has exactly 1 card and hasn't called UNO
    players.forEach((hand, index) => {
      if (hand.length === 1 && !unoCalled[index]) {
        const types = playerTypes();
        const playerWithOneCard = types[index];

        // Show UNO popup for any player with 1 card
        if (playerWithOneCard) {
          setUnoTargetPlayer(index);
          setUnoMode('call');
          setShowUnoButton(true);
        }
      }
    });
  }, [players, unoCalled, playerTypes]);



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

  // Validate multiplayer sync - only after game is initialized
  useEffect(() => {
    if (isMultiplayer && lobby && players.length > 0) {
      const expectedPlayers = lobby.players.length + lobby.aiPlayers.length;
      const actualPlayers = players.length;
      
      if (numberOfPlayers !== expectedPlayers || actualPlayers !== numberOfPlayers) {
        console.error(`WARNING: Player count mismatch!`);
        console.error(`  numberOfPlayers prop: ${numberOfPlayers}`);
        console.error(`  Expected from lobby: ${expectedPlayers}`);
        console.error(`  Actual player hands: ${actualPlayers}`);
        console.error(`  currentPlayer index: ${currentPlayer}`);
        console.error(`  Lobby human players:`);
        lobby.players.forEach((p, idx) => {
          console.error(`    [${idx}] name="${p.name}", id="${p.id}", isHost=${p.isHost}`);
        });
        console.error(`  Lobby AI players:`);
        lobby.aiPlayers.forEach((ai, idx) => {
          console.error(`    [${lobby.players.length + idx}] name="${ai.name}"`);
        });
      } else {
        console.log(`✓ Multiplayer sync OK: ${actualPlayers} players initialized`);
      }
    }
  }, [isMultiplayer, lobby, players.length, numberOfPlayers, currentPlayer]);

  // Check for UNO situation after players state changes
  useEffect(() => {
    if (!gameOver) {
      checkForUnoSituation();
    }
  }, [gameOver, checkForUnoSituation]);

  // AI turn handler
  useEffect(() => {
    const types = playerTypes();
    const currentPlayerType = types[currentPlayer];
    
    // Only trigger AI if current player is actually AI (not remote human in multiplayer)
    if (currentPlayerType?.isAI && !gameOver && !showColorPicker && !showUnoButton) {
      setIsAiTurn(true);
      const delay = getAiDelay();
      
      const aiTimer = setTimeout(() => {
        handleAiTurn();
      }, delay);

      return () => clearTimeout(aiTimer);
    } else {
      setIsAiTurn(false);
    }
  }, [currentPlayer, humanPlayer, gameOver, showColorPicker, showUnoButton, handleAiTurn, playerTypes]);

  // AI UNO response handler (for calling and catching)
  useEffect(() => {
    if (!showUnoButton || unoMode === null || unoTargetPlayer === null) return;

    const types = playerTypes();
    const targetPlayer = types[unoTargetPlayer];
    const timers = [];

    if (unoMode === 'call') {
      // If target is AI, auto-call UNO after a delay
      if (targetPlayer?.isAI) {
        const aiUnoDelay = 500 + Math.random() * 1000;
        const timer = setTimeout(() => {
          handleUnoClick(unoTargetPlayer, 'call');
        }, aiUnoDelay);
        timers.push(timer);
      }

      // After 3 seconds, if UNO wasn't called, transition to catch phase
      const catchPhaseTimer = setTimeout(() => {
        setUnoMode(prevMode => {
          // Check if player already called UNO
          if (unoCalled[unoTargetPlayer]) {
            return prevMode;
          }
          // Transition to catch phase
          return 'catch';
        });
      }, 3000);
      timers.push(catchPhaseTimer);
    } else if (unoMode === 'catch') {
      // Other AI players try to catch the target
      const aiPlayers = [];
      types.forEach((type, index) => {
        if (type?.isAI && index !== unoTargetPlayer) {
          aiPlayers.push(index);
        }
      });

      if (aiPlayers.length > 0) {
        // First AI player to respond catches them
        const catcherIndex = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        const aiCatchDelay = 800 + Math.random() * 1200; // Give humans more time
        const timer = setTimeout(() => {
          handleUnoClick(catcherIndex, 'catch');
        }, aiCatchDelay);
        timers.push(timer);
      }
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [showUnoButton, unoMode, unoTargetPlayer, unoCalled, handleUnoClick, playerTypes]);

  // Multiplayer game action listener
  useEffect(() => {
    if (!isMultiplayer || !lobby) return;

    const handleGameAction = ({ action, data, playerId }) => {
      // Ignore actions from local player
      if (playerId === socketService.getSocketId()) return;

      console.log('Received game action:', action, data);

      // Apply remote player actions to our game state
      switch(action) {
        case 'play-card': {
          const { card, chosenColor, playerIndex, nextPlayer, skipped, direction } = data;
          console.log(`Player ${playerIndex} played ${card.value || card.type}, next player: ${nextPlayer}`);
          
          // Update player's hand - remove the card
          setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            const hand = newPlayers[playerIndex];
            const cardIndex = hand.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
              hand.splice(cardIndex, 1);
            }
            return newPlayers;
          });
          
          // Add to discard pile
          setDiscardPile(prevPile => [...prevPile, card]);
          
          // Update current color if changed
          const newColor = chosenColor || card.color;
          if (newColor !== 'wild') {
            setCurrentColor(newColor);
          }
          
          // Update game direction if it was a reverse
          if (direction !== undefined) {
            setGameDirection(direction);
          }
          
          // Move to next player
          if (nextPlayer !== undefined) {
            setCurrentPlayer(nextPlayer);
            const types = playerTypes();
            const nextName = types[nextPlayer]?.isLocalHuman ? 'Your turn!' : `${types[nextPlayer]?.name}'s turn`;
            const skipText = skipped ? ' (skipped)' : '';
            setGameMessage(nextName + skipText);
          }
          
          // Check if player won
          setPlayers(prevPlayers => {
            if (prevPlayers[playerIndex].length === 0) {
              const types = playerTypes();
              const winnerName = types[playerIndex]?.name || 'Player';
              setGameMessage(`${winnerName} wins! 🏆`);
              setGameOver(true);
            }
            return prevPlayers;
          });
          
          break;
        }

        case 'draw-card': {
          const { playerIndex } = data;
          console.log(`Player ${playerIndex} drew a card`);
          
          // We don't know what card was drawn, so just increment their card count
          setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            // Note: In a real implementation, we'd draw from deck and remove from it
            // For now, we simulate by adding a placeholder
            newPlayers[playerIndex] = [...newPlayers[playerIndex], { id: Math.random(), color: 'unknown', type: 'drawn' }];
            return newPlayers;
          });
          
          break;
        }

        case 'next-turn': {
          const { nextPlayerIndex, skipped } = data;
          console.log(`Next turn - Player ${nextPlayerIndex}'s turn (skipped: ${skipped})`);
          setCurrentPlayer(nextPlayerIndex);
          
          const types = playerTypes();
          const nextName = types[nextPlayerIndex]?.isLocalHuman ? 'Your turn!' : `${types[nextPlayerIndex]?.name}'s turn`;
          setGameMessage(nextName);
          
          break;
        }

        case 'direction-change': {
          console.log('Game direction reversed');
          setGameDirection(prevDir => -prevDir);
          break;
        }

        default:
          console.log('Unknown action:', action);
      }
    };

    socketService.onGameAction(handleGameAction);

    return () => {
      socketService.offGameAction(handleGameAction);
    };
  }, [isMultiplayer, lobby, playerTypes]);

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
            onCardClick={currentPlayer === index && playerTypes()[index]?.isLocalHuman && !isAiTurn ? handleCardPlay : null}
            playableCards={currentPlayer === index && playerTypes()[index]?.isLocalHuman ? getPlayableCards() : []}
            playerNumber={index + 1}
            isAI={playerTypes()[index]?.isAI}
            isHuman={playerTypes()[index]?.isLocalHuman || playerTypes()[index]?.isRemoteHuman}
            playerName={playerTypes()[index]?.name}
            isRemote={playerTypes()[index]?.isRemoteHuman}
            isHidden={!playerTypes()[index]?.isLocalHuman}
          />
        </div>
      ))}

      {showColorPicker && <ColorPicker onColorSelect={handleColorSelect} />}
      
      {showUnoButton && unoTargetPlayer !== null && unoTargetPlayer !== undefined && unoMode && (
        <UnoButton 
          onUnoClick={handleUnoClick}
          targetPlayer={unoTargetPlayer}
          numberOfPlayers={numberOfPlayers}
          unoMode={unoMode}
          playerTypes={playerTypes()}
        />
      )}
    </div>
  );
};

export default GameBoard;