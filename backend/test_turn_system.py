"""
Test script for the new turn-based 8-ball pool system
"""

import sys
sys.path.insert(0, '/home/ndegwa/GAME_LOGIC')

from backend.app.services.turn_coordinator import TurnCoordinator
from backend.app.services.pool_physics import PoolPhysicsEngine

def test_turn_system():
    """Test the complete turn system"""
    print("Testing 8-Ball Pool Turn System...")
    print("=" * 50)
    
    # Create coordinator
    coordinator = TurnCoordinator(game_id=1, player1_id=100, player2_id=200)
    print("✓ Turn coordinator created")
    
    # Configure AI opponent
    coordinator.set_ai_opponent(difficulty='medium', personality='balanced')
    print("✓ AI opponent configured")
    
    # Start game
    coordinator.start_game()
    print("✓ Game started")
    
    # Test break shot
    print("\n--- Testing Break Shot ---")
    break_shot = {
        'cue_ball_id': 0,
        'power': 0.8,
        'angle': 0,
        'spin': 0
    }
    
    break_result = coordinator.take_break_shot(break_shot)
    print(f"✓ Break shot executed: {break_result.get('success', False)}")
    
    if break_result.get('game_over'):
        print(f"  Game over on break! Winner: {break_result.get('winner')}")
    else:
        print(f"  Next player: {break_result.get('next_player')}")
        print(f"  Player groups: {break_result.get('player_groups')}")
    
    # Test AI move
    print("\n--- Testing AI Move ---")
    ai_move = coordinator.get_ai_move()
    if ai_move.get('success'):
        print(f"✓ AI move generated")
        print(f"  Strategy: {ai_move.get('strategy')}")
        print(f"  Confidence: {ai_move.get('confidence', 0):.2f}")
        print(f"  Target ball: {ai_move.get('ai_move', {}).get('target_ball_id')}")
    else:
        print(f"✗ AI move failed: {ai_move.get('error')}")
    
    # Test turn system
    print("\n--- Testing Turn System ---")
    game_status = coordinator.get_game_status()
    print(f"✓ Game status retrieved")
    print(f"  Game over: {game_status.get('game_over')}")
    print(f"  Break taken: {game_status.get('break_shot_taken')}")
    print(f"  Current player: {game_status.get('turn_state', {}).get('current_player_id')}")
    
    # Test physics engine
    print("\n--- Testing Physics Engine ---")
    physics = PoolPhysicsEngine()
    physics.setup_standard_game()
    print(f"✓ Physics engine initialized")
    print(f"  Balls in play: {len([b for b in physics.balls if not b.is_pocketed])}")
    
    # Test shot simulation
    shot_result = physics.simulate_shot(cue_ball_id=0, power=0.5, angle=0)
    print(f"✓ Shot simulation completed")
    print(f"  Balls pocketed: {len(shot_result.get('pocketed_balls', []))}")
    print(f"  Frames simulated: {shot_result.get('frames_simulated')}")
    
    print("\n" + "=" * 50)
    print("All tests completed successfully!")
    return True

def test_turn_state_machine():
    """Test turn state machine specifically"""
    print("\n\nTesting Turn State Machine...")
    print("=" * 50)
    
    from backend.app.services.turn_state_machine import TurnStateMachine, TurnPhase
    
    tsm = TurnStateMachine(game_id=2, player1_id=101, player2_id=201)
    
    # Test initial state
    assert tsm.current_phase == TurnPhase.WAITING
    print("✓ Initial phase is WAITING")
    
    # Test starting turn
    result = tsm.start_turn(player_id=101, player_group='solid')
    assert result == True
    assert tsm.current_phase == TurnPhase.AIMING
    print("✓ Turn started, phase is AIMING")
    
    # Test recording shot
    shot_result = {
        'pocketed_balls': [1],
        'foul': False,
        'scratch': False
    }
    result = tsm.record_shot(shot_result)
    assert result == True
    print("✓ Shot recorded")
    
    # Test ending turn
    result = tsm.end_turn()
    assert result == True
    assert tsm.current_phase == TurnPhase.TURN_END
    print("✓ Turn ended, phase is TURN_END")
    
    # Test switching player
    result = tsm.switch_player()
    assert result == True
    assert tsm.current_player_id == 201
    print("✓ Player switched")
    
    # Test getting state
    state = tsm.get_state()
    assert 'current_player_id' in state
    assert 'turn_history' in state
    print("✓ State retrieved")
    
    print("=" * 50)
    print("Turn state machine tests passed!")
    return True

def test_game_state_manager():
    """Test game state manager"""
    print("\n\nTesting Game State Manager...")
    print("=" * 50)
    
    from backend.app.services.game_state_manager import GameStateManager
    
    gsm = GameStateManager(game_id=3, player1_id=102, player2_id=202)
    
    # Test initial state
    assert gsm.state.status == "setup"
    print("✓ Initial status is 'setup'")
    
    # Test starting game
    gsm.start_game()
    assert gsm.state.status == "in_progress"
    print("✓ Game started, status is 'in_progress'")
    
    # Test break shot
    break_result = {
        'pocketed_balls': [1, 9],
        'frames_simulated': 120
    }
    result = gsm.record_break_shot(break_result)
    assert result['game_state']['status'] == 'in_progress'
    print("✓ Break shot recorded")
    
    # Test assigning groups
    gsm.assign_groups('solid')
    assert gsm.state.player1_group == 'solid'
    assert gsm.state.player2_group == 'stripe'
    print("✓ Groups assigned")
    
    # Test regular shot
    shot_result = {
        'pocketed_balls': [2],
        'foul': False,
        'scratch': False
    }
    result = gsm.record_shot(shot_result)
    assert result['game_state']['status'] == 'in_progress'
    print("✓ Regular shot recorded")
    
    # Test ending turn
    result = gsm.end_turn()
    assert result['next_player'] == 202
    print("✓ Turn ended, next player is 202")
    
    # Test getting state
    state = gsm.get_state()
    assert 'balls' in state
    assert 'shot_history' in state
    print("✓ State retrieved")
    
    print("=" * 50)
    print("Game state manager tests passed!")
    return True

if __name__ == '__main__':
    try:
        test_turn_state_machine()
        test_game_state_manager()
        test_turn_system()
        print("\n✅ ALL TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)