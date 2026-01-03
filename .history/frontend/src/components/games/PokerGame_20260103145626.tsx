import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { GameEntry, PoolGameState } from '../../types/game';
import { User } from '../../types/auth';
import { evaluateHand, compareHands, getHandDescription } from '../../utils/pokerHands';

// Card and Poker Types
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

export interface PokerPlayer {
  id: number;
  username: string;
  isCurrentUser: boolean;
  userId: number;
  chips: number;
  currentBet: number;
  totalBet: number;
  holeCards: Card[];
  hasFolded: boolean;
  hasActed: boolean;
  isAllIn: boolean;
  isConnected: boolean;
}

export interface PokerGameState {
  status: 'waiting' | 'ready' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'completed';
  currentPlayer: number;
  dealerPosition: number;
  smallBlind: number;
  bigBlind: number;
  pot: number;
  communityCards: Card[];
  currentBet: number;
  players: PokerPlayer[];
  gameOver: boolean;
  winner: number | null;
  lastAction: string;
  gameType: 'poker_texas_holdem';
  roundNumber: number;
}

// Poker Hand Rankings
export type HandRank = 'high_card' | 'pair' | 'two_pair' | 'three_of_a_kind' | 'straight' | 'flush' | 'full_house' | 'four_of_a_kind' | 'straight_flush' | 'royal_flush';

export interface HandResult {
  rank: HandRank;
  name: string;
  cards: Card[];
  value: number;
}

// Main Poker Game Component
const PokerGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { state: authState } = useAuth();
  const { activeGames, loading, error } = useGame();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<PokerGameState>({
    status: 'waiting',
    currentPlayer: 0,
    dealerPosition: 0,
    smallBlind: 10,
    bigBlind: 20,
    pot: 0,
    communityCards: [],
    currentBet: 0,
    players: [],
    gameOver: false,
    winner: null,
    lastAction: '',
    gameType: 'poker_texas_holdem',
    roundNumber: 1
  });

  const [gameStarted, setGameStarted] = useState(false);
  const [playerAction, setPlayerAction] = useState<string>('');
  const [betAmount, setBetAmount] = useState(0);
  const [showCards, setShowCards] = useState(false);

  // Find the current game from context
  const currentGame = activeGames.find(g => g.id === Number(gameId));

  // Initialize game
  useEffect(() => {
    console.log('PokerGame useEffect triggered');
    console.log('currentGame:', currentGame);
    console.log('authState.user:', authState.user);
    console.log('activeGames:', activeGames);

    if (!currentGame) {
      console.warn('No current game found!');
      return;
    }

    const initializeGame = () => {
      console.log('Initializing Poker Game for:', currentGame);

      // Get game entries - use mock data for now
      const mockEntries: GameEntry[] = currentGame.entries || [
        {
          id: 1,
          user_id: currentGame.creator_id,
          game_id: currentGame.id,
          stake_amount: currentGame.stake_amount,
          joined_at: new Date().toISOString(),
          result: null,
          payout_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: authState.user?.username || 'Player 1',
          user: authState.user
        }
      ];

      // If only one player (creator), add a mock opponent
      if (mockEntries.length === 1 && authState.user) {
        mockEntries.push({
          id: 2,
          user_id: 999, // Mock opponent ID
          game_id: currentGame.id,
          stake_amount: currentGame.stake_amount,
          joined_at: new Date().toISOString(),
          result: null,
          payout_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'AI Opponent',
          user: {
            id: 999,
            username: 'AI Opponent',
            phone_number: '0000000000',
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User
        });
      }

      const initialChips = Math.floor(currentGame.stake_amount * 10); // 10x stake in chips

      setGameState(prev => ({
        ...prev,
        status: 'ready',
        players: mockEntries.map((entry, index) => ({
          id: entry.user_id,
          username: entry.username || `Player ${entry.user_id}`,
          isCurrentUser: entry.user_id === authState.user?.id,
          userId: entry.user_id,
          chips: initialChips,
          currentBet: 0,
          totalBet: 0,
          holeCards: [],
          hasFolded: false,
          hasActed: false,
          isAllIn: false,
          isConnected: true
        })),
        dealerPosition: 0,
        smallBlind: 10,
        bigBlind: Math.min(20, Math.floor(currentGame.stake_amount / 5)),
        pot: 0,
        communityCards: [],
        currentBet: 0
      }));
    };

    initializeGame();
  }, [currentGame, authState.user]);

  // Generate and shuffle deck
  const generateDeck = useCallback((): Card[] => {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];

    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        deck.push({
          suit,
          rank,
          value: index + 1 // A=1, 2=2, ..., K=13
        });
      });
    });

    return shuffleDeck(deck);
  }, []);

  const shuffleDeck = useCallback((deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Deal hole cards
  const dealHoleCards = useCallback((deck: Card[], playerCount: number): { holeCards: Card[][], remainingDeck: Card[] } => {
    const holeCards: Card[][] = Array(playerCount).fill(null).map(() => []);
    let remainingDeck = [...deck];

    // Deal 2 cards to each player
    for (let round = 0; round < 2; round++) {
      for (let player = 0; player < playerCount; player++) {
        if (remainingDeck.length > 0) {
          holeCards[player].push(remainingDeck.pop()!);
        }
      }
    }

    return { holeCards, remainingDeck };
  }, []);

  // Start a new hand
  const startNewHand = useCallback(() => {
    console.log('Starting new hand');
    const deck = generateDeck();
    const { holeCards, remainingDeck } = dealHoleCards(deck, gameState.players.length);

    // Post blinds
    const updatedPlayers = [...gameState.players];
    const smallBlindPlayer = (gameState.dealerPosition + 1) % updatedPlayers.length;
    const bigBlindPlayer = (gameState.dealerPosition + 2) % updatedPlayers.length;

    updatedPlayers[smallBlindPlayer].chips -= gameState.smallBlind;
    updatedPlayers[smallBlindPlayer].currentBet = gameState.smallBlind;
    updatedPlayers[smallBlindPlayer].totalBet += gameState.smallBlind;

    updatedPlayers[bigBlindPlayer].chips -= gameState.bigBlind;
    updatedPlayers[bigBlindPlayer].currentBet = gameState.bigBlind;
    updatedPlayers[bigBlindPlayer].totalBet += gameState.bigBlind;

    // Deal hole cards
    updatedPlayers.forEach((player, index) => {
      player.holeCards = holeCards[index];
      player.hasFolded = false;
      player.hasActed = false;
      player.isAllIn = false;
    });

    const pot = gameState.smallBlind + gameState.bigBlind;

    setGameState(prev => ({
      ...prev,
      status: 'preflop',
      currentPlayer: (gameState.dealerPosition + 3) % updatedPlayers.length, // First to act after big blind
      players: updatedPlayers,
      pot,
      communityCards: [],
      currentBet: gameState.bigBlind,
      lastAction: `Small blind: ${gameState.smallBlind}, Big blind: ${gameState.bigBlind}`,
      roundNumber: prev.roundNumber + 1
    }));

    console.log('New hand started:', {
      holeCards: updatedPlayers.map(p => p.holeCards),
      pot,
      currentPlayer: (gameState.dealerPosition + 3) % updatedPlayers.length
    });
  }, [gameState, generateDeck, dealHoleCards]);

  // Start the poker game
  const startPokerGame = () => {
    console.log('startPokerGame called');
    console.log('currentGame:', currentGame);

    if (!currentGame) {
      console.error('Cannot start game: missing currentGame');
      return;
    }

    try {
      setGameStarted(true);
      setGameState(prev => ({ ...prev, status: 'preflop' }));
      startNewHand();
    } catch (error) {
      console.error('Failed to start poker game:', error);
      setGameStarted(false);
      setGameState(prev => ({ ...prev, status: 'waiting' }));
    }
  };

  // Player actions
  const handleFold = () => {
    const currentPlayerIndex = gameState.currentPlayer;
    const updatedPlayers = [...gameState.players];
    updatedPlayers[currentPlayerIndex].hasFolded = true;
    updatedPlayers[currentPlayerIndex].hasActed = true;

    // Check if only one player remains
    const activePlayers = updatedPlayers.filter(p => !p.hasFolded);
    if (activePlayers.length === 1) {
      endHand(updatedPlayers.findIndex(p => !p.hasFolded)!);
      return;
    }

    // Move to next player
    moveToNextPlayer();
    setPlayerAction('Fold');
  };

  const handleCall = () => {
    const currentPlayerIndex = gameState.currentPlayer;
    const updatedPlayers = [...gameState.players];
    const player = updatedPlayers[currentPlayerIndex];
    
    const callAmount = gameState.currentBet - player.currentBet;
    if (callAmount > player.chips) {
      // All-in
      player.currentBet += player.chips;
      player.totalBet += player.chips;
      player.chips = 0;
      player.isAllIn = true;
    } else {
      player.currentBet += callAmount;
      player.totalBet += callAmount;
      player.chips -= callAmount;
    }
    
    player.hasActed = true;

    setGameState(prev => ({
      ...prev,
      pot: prev.pot + callAmount,
      players: updatedPlayers
    }));

    setPlayerAction(`Call ${callAmount}`);
    moveToNextPlayer();
  };

  const handleCheck = () => {
    const currentPlayerIndex = gameState.currentPlayer;
    const updatedPlayers = [...gameState.players];
    updatedPlayers[currentPlayerIndex].hasActed = true;

    setPlayerAction('Check');
    moveToNextPlayer();
  };

  const handleBet = (amount: number) => {
    const currentPlayerIndex = gameState.currentPlayer;
    const updatedPlayers = [...gameState.players];
    const player = updatedPlayers[currentPlayerIndex];

    if (amount > player.chips) {
      // All-in
      player.currentBet += player.chips;
      player.totalBet += player.chips;
      player.chips = 0;
      player.isAllIn = true;
      setPlayerAction(`All-in ${player.currentBet}`);
    } else {
      player.currentBet += amount;
      player.totalBet += amount;
      player.chips -= amount;
      setPlayerAction(`Bet ${amount}`);
    }

    player.hasActed = true;

    setGameState(prev => ({
      ...prev,
      pot: prev.pot + amount,
      currentBet: prev.currentBet + amount,
      players: updatedPlayers
    }));

    moveToNextPlayer();
  };

  const moveToNextPlayer = () => {
    const updatedPlayers = [...gameState.players];
    
    // Reset all players' current bets and acted status for new betting round
    if (updatedPlayers.every(p => p.hasActed || p.hasFolded || p.isAllIn)) {
      // End of betting round - proceed to next street
      updatedPlayers.forEach(p => {
        p.currentBet = 0;
        p.hasActed = false;
      });

      // Determine next street
      let newStatus: PokerGameState['status'] = 'flop';
      let newCommunityCards: Card[] = [];
      
      switch (gameState.status) {
        case 'preflop':
          newStatus = 'flop';
          // Deal 3 community cards
          const deck = generateDeck();
          newCommunityCards = [deck.pop()!, deck.pop()!, deck.pop()!];
          break;
        case 'flop':
          newStatus = 'turn';
          // Deal 1 community card
          const deck2 = generateDeck();
          newCommunityCards = [...gameState.communityCards, deck2.pop()!];
          break;
        case 'turn':
          newStatus = 'river';
          // Deal 1 community card
          const deck3 = generateDeck();
          newCommunityCards = [...gameState.communityCards, deck3.pop()!];
          break;
        case 'river':
          newStatus = 'showdown';
          showdown();
          return;
      }

      setGameState(prev => ({
        ...prev,
        status: newStatus,
        communityCards: newCommunityCards,
        currentBet: 0,
        players: updatedPlayers,
        currentPlayer: (gameState.dealerPosition + 1) % updatedPlayers.length // Start with player after dealer
      }));

      return;
    }

    // Move to next active player
    let nextPlayer = (gameState.currentPlayer + 1) % updatedPlayers.length;
    while (updatedPlayers[nextPlayer].hasFolded || updatedPlayers[nextPlayer].isAllIn) {
      nextPlayer = (nextPlayer + 1) % updatedPlayers.length;
    }

    setGameState(prev => ({
      ...prev,
      currentPlayer: nextPlayer,
      players: updatedPlayers
    }));
  };

  const showdown = () => {
    console.log('Showdown!');
    
    // Evaluate hands and determine winner
    const activePlayers = gameState.players.filter(p => !p.hasFolded);
    if (activePlayers.length === 1) {
      endHand(gameState.players.findIndex(p => !p.hasFolded)!);
      return;
    }

    // Evaluate each active player's hand
    const playerHands = activePlayers.map(player => {
      const allCards = [...player.holeCards, ...gameState.communityCards];
      const handResult = evaluateHand(allCards);
      return {
        player,
        handResult,
        playerIndex: gameState.players.findIndex(p => p.id === player.id)
      };
    });

    // Sort by hand strength
    playerHands.sort((a, b) => compareHands(b.handResult, a.handResult));

    console.log('Hand evaluations:', playerHands.map(p => ({
      player: p.player.username,
      hand: getHandDescription(p.handResult)
    })));

    // Determine winner (or winners in case of tie)
    const winningHand = playerHands[0].handResult;
    const winners = playerHands.filter(p => p.handResult.value === winningHand.value);

    if (winners.length === 1) {
      // Single winner
      endHand(winners[0].playerIndex);
    } else {
      // Split pot among winners
      const winnerIndexes = winners.map(w => w.playerIndex);
      const potPerWinner = Math.floor(gameState.pot / winners.length);
      
      setGameState(prev => {
        const updatedPlayers = [...prev.players];
        winnerIndexes.forEach(index => {
          updatedPlayers[index].chips += potPerWinner;
        });
        
        return {
          ...prev,
          players: updatedPlayers,
          status: 'completed',
          gameOver: true,
          winner: winners[0].player.id,
          lastAction: `Split pot! ${winners.map(w => w.player.username).join(', ')} tie with ${winningHand.name}`
        };
      });

      console.log(`Split pot among ${winners.length} players`);
    }
  };

  const endHand = (winnerIndex: number) => {
    const winner = gameState.players[winnerIndex];
    const updatedPlayers = [...gameState.players];
    
    // Award pot to winner
    updatedPlayers[winnerIndex].chips += gameState.pot;

    setGameState(prev => ({
      ...prev,
      status: 'completed',
      gameOver: true,
      winner: winner.id,
      players: updatedPlayers,
      lastAction: `${winner.username} wins ${gameState.pot} chips!`
    }));

    console.log(`Hand ended. Winner: ${winner.username}, Pot: ${gameState.pot}`);
  };

  const handleNewHand = () => {
    setGameState(prev => ({
      ...prev,
      status: 'waiting',
      gameOver: false,
      winner: null,
      lastAction: '',
      pot: 0,
      communityCards: [],
      currentBet: 0
    }));
    setPlayerAction('');
    setShowCards(false);
    setGameStarted(false);
  };

  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      // TODO: Implement forfeit logic
      console.log('Game forfeited');
      navigate('/games');
    }
  };

  // Card display component
  const CardComponent: React.FC<{ card: Card; hidden?: boolean }> = ({ card, hidden = false }) => {
    if (hidden) {
      return (
        <div className="w-12 h-16 bg-blue-900 border-2 border-blue-700 rounded-lg flex items-center justify-center">
          <div className="w-8 h-12 bg-blue-800 rounded"></div>
        </div>
      );
    }

    const suitSymbols = {
      hearts: '♥️',
      diamonds: '♦️',
      clubs: '♣️',
      spades: '♠️'
    };

    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

    return (
      <div className={`w-12 h-16 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div className="text-xs font-bold">{card.rank}</div>
        <div className="text-sm">{suitSymbols[card.suit]}</div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading game...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!currentGame) {
    return <div className="text-center py-8">Game not found</div>;
  }

  const currentPlayer = gameState.players[gameState.currentPlayer];
  const isMyTurn = currentPlayer?.isCurrentUser;
  const myPlayer = gameState.players.find(p => p.isCurrentUser);

  return (
    <div className="min-h-screen bg-green-800 text-white">
      {/* Game Header */}
      <div className="p-4 bg-green-900 border-b border-green-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">♠️ Texas Hold'em - {currentGame.game_code}</h2>
          <div className="text-lg">
            Stake: ${currentGame.stake_amount} | Status: {gameState.status}
          </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative h-96 mx-4 mt-4 bg-green-700 rounded-lg border-4 border-yellow-600 flex flex-col">
        {/* Community Cards */}
        <div className="flex justify-center items-center h-24 mt-4">
          <div className="flex space-x-2">
            {gameState.communityCards.map((card, index) => (
              <CardComponent key={index} card={card} />
            ))}
            {/* Placeholder cards */}
            {Array.from({ length: 5 - gameState.communityCards.length }, (_, i) => (
              <div key={`empty-${i}`} className="w-12 h-16 bg-green-600 border-2 border-green-500 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Pot Information */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 px-4 py-2 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-300">Pot</div>
            <div className="text-xl font-bold text-yellow-400">${gameState.pot}</div>
          </div>
        </div>

        {/* Current Bet */}
        {gameState.currentBet > 0 && (
          <div className="absolute top-2 right-4 bg-black bg-opacity-70 px-4 py-2 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-300">Current Bet</div>
              <div className="text-xl font-bold text-red-400">${gameState.currentBet}</div>
            </div>
          </div>
        )}

        {/* Player Positions */}
        <div className="flex justify-around items-end h-full pb-4">
          {gameState.players.map((player, index) => (
            <div key={player.id} className={`flex flex-col items-center ${index === gameState.currentPlayer ? 'ring-4 ring-yellow-400 rounded-lg p-2' : ''}`}>
              {/* Player Info */}
              <div className={`text-center mb-2 ${player.hasFolded ? 'opacity-50' : ''}`}>
                <div className="font-bold text-sm">{player.username}</div>
                <div className="text-xs text-gray-300">${player.chips}</div>
                {player.currentBet > 0 && (
                  <div className="text-xs text-yellow-400">Bet: ${player.currentBet}</div>
                )}
                {player.isAllIn && (
                  <div className="text-xs text-red-400 font-bold">ALL-IN!</div>
                )}
              </div>

              {/* Hole Cards */}
              <div className="flex space-x-1">
                {player.holeCards.map((card, cardIndex) => (
                  <CardComponent 
                    key={cardIndex} 
                    card={card} 
                    hidden={!player.isCurrentUser && !gameState.gameOver && gameState.status !== 'showdown'}
                  />
                ))}
              </div>

              {/* Status Indicators */}
              {player.hasFolded && (
                <div className="text-xs text-red-400 font-bold mt-1">FOLDED</div>
              )}
              {index === gameState.dealerPosition && (
                <div className="text-xs bg-yellow-600 text-black px-1 rounded mt-1">DEALER</div>
              )}
              {index === (gameState.dealerPosition + 1) % gameState.players.length && (
                <div className="text-xs bg-blue-600 text-white px-1 rounded mt-1">SB</div>
              )}
              {index === (gameState.dealerPosition + 2) % gameState.players.length && (
                <div className="text-xs bg-red-600 text-white px-1 rounded mt-1">BB</div>
              )}
            </div>
          ))}
        </div>

        {/* Game Status */}
        {gameState.lastAction && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 px-4 py-2 rounded-lg">
            <div className="text-center text-sm">{gameState.lastAction}</div>
          </div>
        )}
      </div>

      {/* Action Panel */}
      <div className="mt-4 mx-4">
        {!gameStarted && gameState.status === 'ready' && (
          <div className="text-center">
            <button
              onClick={startPokerGame}
              disabled={gameState.players.length < 2}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-600"
            >
              Start Game
            </button>
          </div>
        )}

        {gameStarted && !gameState.gameOver && isMyTurn && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">Your Turn</h3>
              <p className="text-sm text-gray-300">Chips: ${myPlayer?.chips} | Current Bet: ${gameState.currentBet}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <button
                onClick={handleFold}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Fold
              </button>

              {gameState.currentBet === 0 ? (
                <button
                  onClick={handleCheck}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={handleCall}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Call ${gameState.currentBet - (myPlayer?.currentBet || 0)}
                </button>
              )}

              <button
                onClick={() => {
                  const betAmount = Math.min(myPlayer?.chips || 0, gameState.currentBet * 2);
                  if (betAmount > 0) {
                    handleBet(betAmount);
                  }
                }}
                disabled={(myPlayer?.chips || 0) <= gameState.currentBet}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600"
              >
                Raise
              </button>
            </div>

            {/* Custom Bet Amount */}
            <div className="flex justify-center items-center space-x-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                min="0"
                max={myPlayer?.chips || 0}
                className="bg-gray-700 text-white px-3 py-2 rounded w-24"
                placeholder="Amount"
              />
              <button
                onClick={() => handleBet(betAmount)}
                disabled={betAmount <= 0 || betAmount > (myPlayer?.chips || 0)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600"
              >
                Bet
              </button>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="text-center bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Game Over!</h3>
            <p className="text-lg text-yellow-400 mb-4">
              {gameState.players.find(p => p.id === gameState.winner)?.username} wins!
            </p>
            <div className="space-x-2">
              <button
                onClick={handleNewHand}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                New Hand
              </button>
              <button
                onClick={handleForfeit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Leave Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-4 mx-4 p-4 bg-gray-900 rounded-lg text-xs">
        <h4 className="font-bold mb-2">Debug Info:</h4>
        <div>Status: {gameState.status}</div>
        <div>Current Player: {currentPlayer?.username}</div>
        <div>Pot: ${gameState.pot}</div>
        <div>Round: {gameState.roundNumber}</div>
        <div>Player Action: {playerAction}</div>
      </div>
    </div>
  );
};

export default PokerGame;