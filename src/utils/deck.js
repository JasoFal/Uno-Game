// Deck utility functions
export const COLORS = ['red', 'blue', 'green', 'yellow'];
export const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'drawTwo',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wildDrawFour'
};

// Create a full Uno deck
export const createDeck = () => {
  const deck = [];
  let id = 0;

  // Number cards (0-9 for each color)
  COLORS.forEach(color => {
    // One 0 card per color
    deck.push({ id: id++, color, value: 0, type: CARD_TYPES.NUMBER });
    
    // Two of each 1-9 per color
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: id++, color, value: i, type: CARD_TYPES.NUMBER });
      deck.push({ id: id++, color, value: i, type: CARD_TYPES.NUMBER });
    }

    // Action cards (2 of each per color)
    [CARD_TYPES.SKIP, CARD_TYPES.REVERSE, CARD_TYPES.DRAW_TWO].forEach(type => {
      deck.push({ id: id++, color, type });
      deck.push({ id: id++, color, type });
    });
  });

  // Wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: id++, color: 'wild', type: CARD_TYPES.WILD });
    deck.push({ id: id++, color: 'wild', type: CARD_TYPES.WILD_DRAW_FOUR });
  }

  return shuffleDeck(deck);
};

// Shuffle deck
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Check if a card can be played
export const canPlayCard = (card, topCard, currentColor) => {
  // Wild cards can always be played
  if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    return true;
  }

  // Match color
  if (card.color === currentColor || card.color === topCard.color) {
    return true;
  }

  // Match number
  if (card.type === CARD_TYPES.NUMBER && topCard.type === CARD_TYPES.NUMBER) {
    return card.value === topCard.value;
  }

  // Match action type
  if (card.type === topCard.type) {
    return true;
  }

  return false;
};