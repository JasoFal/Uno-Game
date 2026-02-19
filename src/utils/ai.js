import { canPlayCard, CARD_TYPES, COLORS } from './deck';

// Analyze hand to find the most common color
export const getMostCommonColor = (hand) => {
  const colorCount = {};
  
  hand.forEach(card => {
    if (card.color !== 'wild') {
      colorCount[card.color] = (colorCount[card.color] || 0) + 1;
    }
  });

  let maxCount = 0;
  let mostCommonColor = COLORS[0];
  
  Object.entries(colorCount).forEach(([color, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonColor = color;
    }
  });

  return mostCommonColor;
};

// Get card priority score (higher = more strategic to play)
const getCardPriority = (card, hand, topCard, players, currentPlayerIndex, gameDirection) => {
  let priority = 0;
  const nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, gameDirection, players.length);
  const nextPlayerCardCount = players[nextPlayerIndex]?.length || 7;

  // Base priority by card type
  switch (card.type) {
    case CARD_TYPES.NUMBER:
      priority = card.value || 0; // Lower numbers = lower priority
      break;
    
    case CARD_TYPES.SKIP:
      priority = 50;
      // Higher priority if next player has few cards
      if (nextPlayerCardCount <= 2) priority += 30;
      break;
    
    case CARD_TYPES.REVERSE:
      priority = 45;
      // Higher priority if next player has few cards
      if (nextPlayerCardCount <= 2) priority += 25;
      break;
    
    case CARD_TYPES.DRAW_TWO:
      priority = 60;
      // Much higher priority if next player has few cards
      if (nextPlayerCardCount <= 2) priority += 40;
      if (nextPlayerCardCount === 1) priority += 30; // Extra high if they have UNO
      break;
    
    case CARD_TYPES.WILD:
      priority = 70;
      // Save wilds for when really needed, unless strategic
      if (hand.length > 3) priority -= 20;
      break;
    
    case CARD_TYPES.WILD_DRAW_FOUR:
      priority = 80;
      // Highest priority against low card count players
      if (nextPlayerCardCount <= 2) priority += 50;
      if (nextPlayerCardCount === 1) priority += 40;
      // Otherwise save it
      if (nextPlayerCardCount > 3 && hand.length > 3) priority -= 30;
      break;
    
    default:
      priority = 10;
  }

  // Prefer cards that match by number over color (more versatile)
  if (card.type === CARD_TYPES.NUMBER && topCard.type === CARD_TYPES.NUMBER) {
    if (card.value === topCard.value) {
      priority += 15; // Number match is valuable
    }
  }

  // Slightly prefer getting rid of cards that don't match most common color
  const mostCommonColor = getMostCommonColor(hand);
  if (card.color !== 'wild' && card.color !== mostCommonColor) {
    priority += 5;
  }

  return priority;
};

// Get next player index
const getNextPlayerIndex = (currentIndex, direction, playerCount) => {
  return (currentIndex + direction + playerCount) % playerCount;
};

// AI decision making for card selection
export const aiSelectCard = (hand, topCard, currentColor, players, currentPlayerIndex, gameDirection) => {
  // Get all playable cards
  const playableCards = hand.filter(card => canPlayCard(card, topCard, currentColor));

  if (playableCards.length === 0) {
    return null; // AI needs to draw
  }

  // If only one card can be played, play it
  if (playableCards.length === 1) {
    return playableCards[0];
  }

  // Score each playable card and select the best one
  let bestCard = playableCards[0];
  let bestScore = -1;

  playableCards.forEach(card => {
    const score = getCardPriority(card, hand, topCard, players, currentPlayerIndex, gameDirection);
    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  });

  return bestCard;
};

// AI decision for wild card color selection
export const aiSelectWildColor = (hand) => {
  return getMostCommonColor(hand);
};

// Simulate AI "thinking" time for realism
export const getAiDelay = () => {
  // Random delay between 800ms and 1800ms
  return 800 + Math.random() * 1000;
};