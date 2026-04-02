import React, { useState } from 'react';
// Note: TournamentBracket component has been replaced by PoolTournamentBracket
// This demo file uses the original component - import from legacy source if needed
const TournamentBracket: React.FC<any> = () => <div className="text-white p-4">Tournament Bracket Demo - Component refactored. See PoolTournamentBracket for new implementation.</div>;
import { AdminTournamentControls } from './AdminTournamentControls';
import { TournamentBracketProvider, useTournamentBracket } from '../../contexts/TournamentBracketContext';
import { Tournament, TournamentBracket as TournamentBracketType, TournamentRound, TournamentMatch } from '../../types/tournament';

// Mock data for testing
const createMockTournament = (): Tournament => ({
  id: 1,
  name: 'Demo Tournament Championship',
  game_type: 'draw_1v1',
  entry_fee: 100,
  max_players: 8,
  status: 'in_progress',
  format: 'single_elimination',
  current_round: 2,
  total_rounds: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  entries: [
    { id: 1, user_id: 1, tournament_id: 1, joined_at: new Date().toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), username: 'player1' },
    { id: 2, user_id: 2, tournament_id: 1, joined_at: new Date().toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), username: 'player2' },
    { id: 3, user_id: 3, tournament_id: 1, joined_at: new Date().toISOString(), status: 'eliminated', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), username: 'player3' },
    { id: 4, user_id: 4, tournament_id: 1, joined_at: new Date().toISOString(), status: 'eliminated', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), username: 'player4' },
    { id: 5, user_id: 5, tournament_id: 1, joined_at: new Date().toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), username: 'player5' },
    { id: 6, user_id: 6, tournament_id: 1, joined_at: new Date().toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), username: 'player6' }
  ]
});

const createMockBracket = (): TournamentBracketType => {
  const round1Matches: TournamentMatch[] = [
    {
      id: '1_0',
      round: 1,
      match_index: 0,
      player1_id: 1,
      player2_id: 2,
      player1_username: 'player1',
      player2_username: 'player2',
      winner_id: 1,
      winner_username: 'player1',
      status: 'completed'
    },
    {
      id: '1_1',
      round: 1,
      match_index: 1,
      player1_id: 3,
      player2_id: 4,
      player1_username: 'player3',
      player2_username: 'player4',
      winner_id: 3,
      winner_username: 'player3',
      status: 'completed'
    },
    {
      id: '1_2',
      round: 1,
      match_index: 2,
      player1_id: 5,
      player2_id: 6,
      player1_username: 'player5',
      player2_username: 'player6',
      winner_id: 5,
      winner_username: 'player5',
      status: 'completed'
    },
    {
      id: '1_3',
      round: 1,
      match_index: 3,
      player1_id: 7,
      player2_id: 8,
      player1_username: 'player7',
      player2_username: 'player8',
      winner_id: 7,
      winner_username: 'player7',
      status: 'completed'
    }
  ];

  const round2Matches: TournamentMatch[] = [
    {
      id: '2_0',
      round: 2,
      match_index: 0,
      player1_id: 1,
      player2_id: 3,
      player1_username: 'player1',
      player2_username: 'player3',
      status: 'active'
    },
    {
      id: '2_1',
      round: 2,
      match_index: 1,
      player1_id: 5,
      player2_id: 7,
      player1_username: 'player5',
      player2_username: 'player7',
      status: 'active'
    }
  ];

  const round3Matches: TournamentMatch[] = [
    {
      id: '3_0',
      round: 3,
      match_index: 0,
      status: 'pending'
    }
  ];

  const rounds: TournamentRound[] = [
    { round: 1, matches: round1Matches, name: 'Quarter Finals', is_completed: true },
    { round: 2, matches: round2Matches, name: 'Semi Finals', is_completed: false },
    { round: 3, matches: round3Matches, name: 'Final', is_completed: false }
  ];

  return {
    rounds,
    total_rounds: 3,
    current_round: 2,
    format: 'single_elimination'
  };
};

const DemoContent: React.FC = () => {
  const [tournament] = useState(createMockTournament());
  const [bracket] = useState(createMockBracket());
  const { state } = useTournamentBracket();

  const handleTournamentUpdate = () => {
    console.log('Tournament updated!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Bracket System Demo</h1>
          <p className="text-gray-600">
            This demo showcases the complete tournament bracket system including visual bracket display,
            admin controls, and tournament management features.
          </p>
        </div>

        {/* Status Display */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-2">System Status</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Context Loading:</span>
              <div className="font-medium">{state.isLoading ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <span className="text-gray-600">Current Tournament:</span>
              <div className="font-medium">{state.currentTournament?.name || 'None'}</div>
            </div>
            <div>
              <span className="text-gray-600">Selected Match:</span>
              <div className="font-medium">{state.selectedMatch?.id || 'None'}</div>
            </div>
            <div>
              <span className="text-gray-600">Admin Mode:</span>
              <div className="font-medium">{state.adminMode ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </div>

        {/* Tournament Bracket */}
        <div className="mb-8">
          <TournamentBracket
            tournament={tournament}
            bracket={bracket}
            currentUserId={1}
            isAdmin={true}
            showAdminControls={true}
          />
        </div>

        {/* Admin Controls */}
        <div className="mb-8">
          <AdminTournamentControls
            tournament={tournament}
            bracket={bracket}
            onTournamentUpdate={handleTournamentUpdate}
          />
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">✨ Key Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Visual bracket display with round-by-round progression</li>
              <li>• Single and double elimination tournament formats</li>
              <li>• Real-time match status tracking</li>
              <li>• Admin controls for tournament management</li>
              <li>• Winner advancement and bracket progression</li>
              <li>• Prize pool calculation and distribution</li>
              <li>• Match detail views with player information</li>
              <li>• Responsive design for all screen sizes</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">🎮 Tournament Flow</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <div className="font-medium">Registration Phase</div>
                  <div className="text-gray-600">Players join tournaments with entry fees</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <div className="font-medium">Bracket Generation</div>
                  <div className="text-gray-600">Automatic bracket creation based on format</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <div className="font-medium">Match Progression</div>
                  <div className="text-gray-600">Admin manages match outcomes and advancement</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <div className="font-medium">Champion Declaration</div>
                  <div className="text-gray-600">Winner receives prize pool (85% of total)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Structure */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">🏗️ Component Architecture</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Core Components</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• TournamentBracket - Main visual bracket display</li>
                <li>• AdminTournamentControls - Admin management panel</li>
                <li>• TournamentDetail - Tournament detail page</li>
                <li>• TournamentCard - Tournament list item</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">State Management</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• TournamentBracketContext - Global state</li>
                <li>• Tournament types and interfaces</li>
                <li>• API integration layer</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Backend Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tournament models with bracket support</li>
                <li>• TournamentMatch model for match tracking</li>
                <li>• RESTful API endpoints</li>
                <li>• Winner advancement logic</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TournamentBracketDemo: React.FC = () => {
  return (
    <TournamentBracketProvider>
      <DemoContent />
    </TournamentBracketProvider>
  );
};

export default TournamentBracketDemo;