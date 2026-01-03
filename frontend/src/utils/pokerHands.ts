import { Card, HandRank, HandResult } from '../components/games/PokerGame';

// Convert card rank to numerical value for comparisons
export const getCardValue = (card: Card): number => {
  const rankValues: { [key: string]: number } = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, 
    '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankValues[card.rank] || parseInt(card.rank);
};

// Evaluate poker hand from 7 cards (2 hole + 5 community)
export const evaluateHand = (cards: Card[]): HandResult => {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate hand');
  }

  // Generate all possible 5-card combinations
  const combinations = generateCombinations(cards, 5);
  let bestHand: HandResult = {
    rank: 'high_card',
    name: 'High Card',
    cards: [],
    value: 0
  };

  // Evaluate each combination
  for (const combination of combinations) {
    const hand = evaluateFiveCardHand(combination);
    if (hand.value > bestHand.value) {
      bestHand = hand;
    }
  }

  return bestHand;
};

// Generate combinations of cards
const generateCombinations = (cards: Card[], size: number): Card[][] => {
  if (size === 1) return cards.map(card => [card]);
  if (size === cards.length) return [cards];

  const combinations: Card[][] = [];
  
  for (let i = 0; i <= cards.length - size; i++) {
    const firstCard = cards[i];
    const smallerCombinations = generateCombinations(cards.slice(i + 1), size - 1);
    
    for (const combination of smallerCombinations) {
      combinations.push([firstCard, ...combination]);
    }
  }
  
  return combinations;
};

// Evaluate a 5-card hand
const evaluateFiveCardHand = (cards: Card[]): HandResult => {
  const sortedCards = cards.slice().sort((a, b) => getCardValue(b) - getCardValue(a));
  const ranks = sortedCards.map(card => getCardValue(card));
  const suits = sortedCards.map(card => card.suit);
  
  // Count occurrences of each rank
  const rankCounts: { [key: number]: number } = {};
  ranks.forEach(rank => {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  });
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isFlush = suits.every(suit => suit === suits[0]);
  const isStraight = checkStraight(ranks);
  
  // Check for specific hands
  if (isStraight && isFlush && ranks[0] === 14) {
    return {
      rank: 'royal_flush',
      name: 'Royal Flush',
      cards: sortedCards,
      value: 9000000 + ranks[0]
    };
  }
  
  if (isStraight && isFlush) {
    return {
      rank: 'straight_flush',
      name: 'Straight Flush',
      cards: sortedCards,
      value: 8000000 + ranks[0]
    };
  }
  
  if (counts[0] === 4) {
    const fourKind = parseInt(Object.keys(rankCounts).find(key => rankCounts[parseInt(key)] === 4)!);
    const kicker = ranks.find(rank => rank !== fourKind)!;
    return {
      rank: 'four_of_a_kind',
      name: 'Four of a Kind',
      cards: sortedCards,
      value: 7000000 + fourKind * 100 + kicker
    };
  }
  
  if (counts[0] === 3 && counts[1] === 2) {
    const threeKind = parseInt(Object.keys(rankCounts).find(key => rankCounts[parseInt(key)] === 3)!);
    const pair = parseInt(Object.keys(rankCounts).find(key => rankCounts[parseInt(key)] === 2)!);
    return {
      rank: 'full_house',
      name: 'Full House',
      cards: sortedCards,
      value: 6000000 + threeKind * 100 + pair
    };
  }
  
  if (isFlush) {
    return {
      rank: 'flush',
      name: 'Flush',
      cards: sortedCards,
      value: 5000000 + ranks.reduce((sum, rank, i) => sum + rank * Math.pow(100, 4 - i), 0)
    };
  }
  
  if (isStraight) {
    return {
      rank: 'straight',
      name: 'Straight',
      cards: sortedCards,
      value: 4000000 + ranks[0]
    };
  }
  
  if (counts[0] === 3) {
    const threeKind = parseInt(Object.keys(rankCounts).find(key => rankCounts[parseInt(key)] === 3)!);
    const kickers = ranks.filter(rank => rank !== threeKind).sort((a, b) => b - a);
    return {
      rank: 'three_of_a_kind',
      name: 'Three of a Kind',
      cards: sortedCards,
      value: 3000000 + threeKind * 10000 + kickers[0] * 100 + kickers[1]
    };
  }
  
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = Object.keys(rankCounts)
      .filter(key => rankCounts[parseInt(key)] === 2)
      .map(key => parseInt(key))
      .sort((a, b) => b - a);
    const kicker = ranks.find(rank => !pairs.includes(rank))!;
    return {
      rank: 'two_pair',
      name: 'Two Pair',
      cards: sortedCards,
      value: 2000000 + pairs[0] * 10000 + pairs[1] * 100 + kicker
    };
  }
  
  if (counts[0] === 2) {
    const pair = parseInt(Object.keys(rankCounts).find(key => rankCounts[parseInt(key)] === 2)!);
    const kickers = ranks.filter(rank => rank !== pair).sort((a, b) => b - a);
    return {
      rank: 'pair',
      name: 'Pair',
      cards: sortedCards,
      value: 1000000 + pair * 1000000 + kickers[0] * 10000 + kickers[1] * 100 + kickers[2]
    };
  }
  
  // High card
  return {
    rank: 'high_card',
    name: 'High Card',
    cards: sortedCards,
    value: ranks.reduce((sum, rank, i) => sum + rank * Math.pow(100, 4 - i), 0)
  };
};

// Check if ranks form a straight
const checkStraight = (ranks: number[]): boolean => {
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
  
  // Check for regular straight
  if (uniqueRanks.length === 5) {
    for (let i = 1; i < uniqueRanks.length; i++) {
      if (uniqueRanks[i] - uniqueRanks[i - 1] !== 1) {
        return false;
      }
    }
    return true;
  }
  
  // Check for A-2-3-4-5 straight (wheel)
  if (uniqueRanks.length === 5 && 
      uniqueRanks.includes(2) && 
      uniqueRanks.includes(3) && 
      uniqueRanks.includes(4) && 
      uniqueRanks.includes(5) && 
      uniqueRanks.includes(14)) {
    return true;
  }
  
  return false;
};

// Compare two hands
export const compareHands = (hand1: HandResult, hand2: HandResult): number => {
  return hand1.value - hand2.value;
};

// Get hand ranking name
export const getHandRankingName = (rank: HandRank): string => {
  const names: { [key in HandRank]: string } = {
    'high_card': 'High Card',
    'pair': 'Pair',
    'two_pair': 'Two Pair',
    'three_of_a_kind': 'Three of a Kind',
    'straight': 'Straight',
    'flush': 'Flush',
    'full_house': 'Full House',
    'four_of_a_kind': 'Four of a Kind',
    'straight_flush': 'Straight Flush',
    'royal_flush': 'Royal Flush'
  };
  return names[rank];
};

// Get hand strength description
export const getHandDescription = (hand: HandResult): string => {
  return `${hand.name} (${hand.cards.map(card => card.rank + card.suit[0]).join(', ')})`;
};