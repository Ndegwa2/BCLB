# Frontend Wireframes & UI/UX Design

This document contains the wireframes and design specifications for the Gaming Platform frontend.

## 1. Authentication Pages

### 1.1 Login Page Wireframe
```svg
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="600" fill="#f3f4f6"/>
  
  <!-- Header -->
  <rect width="400" height="80" fill="#1f2937"/>
  <text x="200" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">
    GameLogic Platform
  </text>
  
  <!-- Main Card -->
  <rect x="50" y="120" width="300" height="400" rx="10" fill="white" stroke="#e5e7eb"/>
  
  <!-- Login Form -->
  <text x="200" y="160" text-anchor="middle" fill="#111827" font-family="Arial" font-size="20" font-weight="bold">
    Sign In
  </text>
  
  <!-- Username Field -->
  <text x="70" y="200" fill="#374151" font-family="Arial" font-size="14">Username or Email</text>
  <rect x="70" y="210" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="235" fill="#9ca3af" font-family="Arial" font-size="12">Enter your username</text>
  
  <!-- Password Field -->
  <text x="70" y="270" fill="#374151" font-family="Arial" font-size="14">Password</text>
  <rect x="70" y="280" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="305" fill="#9ca3af" font-family="Arial" font-size="12">Enter your password</text>
  
  <!-- Remember Me -->
  <circle cx="80" cy="340" r="8" fill="none" stroke="#d1d5db"/>
  <text x="100" y="344" fill="#374151" font-family="Arial" font-size="12">Remember me</text>
  
  <!-- Sign In Button -->
  <rect x="70" y="370" width="260" height="45" rx="5" fill="#3b82f6"/>
  <text x="200" y="397" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">
    Sign In
  </text>
  
  <!-- Divider -->
  <line x1="70" y1="430" x2="180" y2="430" stroke="#e5e7eb"/>
  <text x="200" y="435" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="12">or</text>
  <line x1="220" y1="430" x2="330" y2="430" stroke="#e5e7eb"/>
  
  <!-- Register Link -->
  <text x="200" y="460" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
    Don't have an account?
    <tspan fill="#3b82f6" font-weight="bold">Sign Up</tspan>
  </text>
  
  <!-- Footer -->
  <rect x="0" y="540" width="400" height="60" fill="#1f2937"/>
  <text x="200" y="575" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
    © 2025 GameLogic. All rights reserved.
  </text>
</svg>
```

### 1.2 Register Page Wireframe
```svg
<svg width="400" height="700" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="700" fill="#f3f4f6"/>
  
  <!-- Header -->
  <rect width="400" height="80" fill="#1f2937"/>
  <text x="200" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">
    GameLogic Platform
  </text>
  
  <!-- Main Card -->
  <rect x="50" y="120" width="300" height="520" rx="10" fill="white" stroke="#e5e7eb"/>
  
  <!-- Register Form -->
  <text x="200" y="160" text-anchor="middle" fill="#111827" font-family="Arial" font-size="20" font-weight="bold">
    Create Account
  </text>
  
  <!-- Username Field -->
  <text x="70" y="190" fill="#374151" font-family="Arial" font-size="14">Username *</text>
  <rect x="70" y="200" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="225" fill="#9ca3af" font-family="Arial" font-size="12">Choose a username</text>
  
  <!-- Email Field -->
  <text x="70" y="260" fill="#374151" font-family="Arial" font-size="14">Email</text>
  <rect x="70" y="270" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="295" fill="#9ca3af" font-family="Arial" font-size="12">your@email.com (optional)</text>
  
  <!-- Phone Field -->
  <text x="70" y="330" fill="#374151" font-family="Arial" font-size="14">Phone Number *</text>
  <rect x="70" y="340" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="365" fill="#9ca3af" font-family="Arial" font-size="12">+254712345678</text>
  
  <!-- Password Field -->
  <text x="70" y="400" fill="#374151" font-family="Arial" font-size="14">Password *</text>
  <rect x="70" y="410" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="435" fill="#9ca3af" font-family="Arial" font-size="12">Min 8 characters</text>
  
  <!-- Confirm Password -->
  <text x="70" y="470" fill="#374151" font-family="Arial" font-size="14">Confirm Password *</text>
  <rect x="70" y="480" width="260" height="40" rx="5" fill="#f9fafb" stroke="#d1d5db"/>
  <text x="80" y="505" fill="#9ca3af" font-family="Arial" font-size="12">Repeat password</text>
  
  <!-- Terms Checkbox -->
  <circle cx="80" cy="540" r="8" fill="none" stroke="#d1d5db"/>
  <text x="100" y="544" fill="#374151" font-family="Arial" font-size="12">I agree to the Terms & Conditions</text>
  
  <!-- Sign Up Button -->
  <rect x="70" y="570" width="260" height="45" rx="5" fill="#10b981"/>
  <text x="200" y="597" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">
    Create Account
  </text>
  
  <!-- Login Link -->
  <text x="200" y="635" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
    Already have an account?
    <tspan fill="#3b82f6" font-weight="bold">Sign In</tspan>
  </text>
</svg>
```

## 2. Main Dashboard

### 2.1 Dashboard Wireframe
```svg
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="800" fill="#f8fafc"/>
  
  <!-- Header -->
  <rect width="1200" height="70" fill="#1e293b"/>
  
  <!-- Logo -->
  <text x="50" y="45" fill="white" font-family="Arial" font-size="24" font-weight="bold">
    GameLogic
  </text>
  
  <!-- User Menu -->
  <circle cx="1000" cy="35" r="20" fill="#3b82f6"/>
  <text x="1000" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    U
  </text>
  <text x="1030" y="40" fill="white" font-family="Arial" font-size="14">username</text>
  
  <!-- Navigation -->
  <rect x="0" y="70" width="200" height="730" fill="#334155"/>
  
  <!-- Menu Items -->
  <text x="20" y="110" fill="white" font-family="Arial" font-size="16" font-weight="bold">Dashboard</text>
  <text x="20" y="150" fill="#94a3b8" font-family="Arial" font-size="14">🏠 Home</text>
  <text x="20" y="190" fill="#94a3b8" font-family="Arial" font-size="14">🎮 Games</text>
  <text x="20" y="230" fill="#94a3b8" font-family="Arial" font-size="14">🏆 Tournaments</text>
  <text x="20" y="270" fill="#94a3b8" font-family="Arial" font-size="14">💰 Wallet</text>
  <text x="20" y="310" fill="#94a3b8" font-family="Arial" font-size="14">📊 History</text>
  <text x="20" y="350" fill="#94a3b8" font-family="Arial" font-size="14">⚙️ Settings</text>
  
  <!-- Admin Section (conditional) -->
  <rect x="0" y="400" width="200" height="3" fill="#475569"/>
  <text x="20" y="430" fill="#f59e0b" font-family="Arial" font-size="16" font-weight="bold">Admin</text>
  <text x="20" y="470" fill="#94a3b8" font-family="Arial" font-size="14">👑 Panel</text>
  
  <!-- Main Content Area -->
  <rect x="200" y="70" width="1000" height="730" fill="#f1f5f9"/>
  
  <!-- Welcome Card -->
  <rect x="220" y="90" width="480" height="200" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="240" y="120" fill="#1e293b" font-family="Arial" font-size="20" font-weight="bold">
    Welcome back, Username!
  </text>
  <text x="240" y="150" fill="#64748b" font-family="Arial" font-size="14">
    Ready to play some games today?
  </text>
  
  <!-- Wallet Balance Card -->
  <rect x="720" y="90" width="460" height="200" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="740" y="120" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    💰 Wallet Balance
  </text>
  <text x="740" y="160" fill="#059669" font-family="Arial" font-size="32" font-weight="bold">
    KES 1,250.00
  </text>
  <text x="740" y="185" fill="#64748b" font-family="Arial" font-size="14">
    Locked: KES 200.00
  </text>
  <rect x="740" y="200" width="80" height="30" rx="5" fill="#3b82f6"/>
  <text x="780" y="220" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">Deposit</text>
  <rect x="830" y="200" width="80" height="30" rx="5" fill="#10b981"/>
  <text x="870" y="220" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">Withdraw</text>
  
  <!-- Quick Actions -->
  <rect x="220" y="310" width="960" height="120" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="240" y="340" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    Quick Actions
  </text>
  
  <!-- Action Buttons -->
  <rect x="240" y="360" width="150" height="60" rx="8" fill="#3b82f6"/>
  <text x="315" y="395" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Create Game</text>
  
  <rect x="410" y="360" width="150" height="60" rx="8" fill="#10b981"/>
  <text x="485" y="395" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Join Game</text>
  
  <rect x="580" y="360" width="150" height="60" rx="8" fill="#f59e0b"/>
  <text x="655" y="395" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Browse Tournaments</text>
  
  <rect x="750" y="360" width="150" height="60" rx="8" fill="#8b5cf6"/>
  <text x="825" y="395" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">View History</text>
  
  <!-- Recent Activity -->
  <rect x="220" y="450" width="960" height="300" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="240" y="480" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    Recent Activity
  </text>
  
  <!-- Activity Items -->
  <rect x="240" y="500" width="900" height="50" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="260" y="525" fill="#059669" font-family="Arial" font-size="14">🎉 Won KES 150.00 in Draw 1v1</text>
  <text x="900" y="525" text-anchor="end" fill="#64748b" font-family="Arial" font-size="12">2 hours ago</text>
  
  <rect x="240" y="560" width="900" height="50" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="260" y="585" fill="#ef4444" font-family="Arial" font-size="14">❌ Lost KES 50.00 in Pool 8ball</text>
  <text x="900" y="585" text-anchor="end" fill="#64748b" font-family="Arial" font-size="12">5 hours ago</text>
  
  <rect x="240" y="620" width="900" height="50" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="260" y="645" fill="#3b82f6" font-family="Arial" font-size="14">💰 Deposit of KES 500.00 completed</text>
  <text x="900" y="645" text-anchor="end" fill="#64748b" font-family="Arial" font-size="12">1 day ago</text>
</svg>
```

## 3. Game Lobby

### 3.1 Game Lobby Wireframe
```svg
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="800" fill="#f8fafc"/>
  
  <!-- Header -->
  <rect width="1200" height="70" fill="#1e293b"/>
  <text x="50" y="45" fill="white" font-family="Arial" font-size="24" font-weight="bold">GameLogic</text>
  <text x="1050" y="45" fill="white" font-family="Arial" font-size="14">💰 KES 1,250.00</text>
  
  <!-- Navigation Breadcrumb -->
  <rect x="0" y="70" width="1200" height="40" fill="#e2e8f0"/>
  <text x="20" y="95" fill="#475569" font-family="Arial" font-size="14">
    Home > Games > Lobby
  </text>
  
  <!-- Create Game Section -->
  <rect x="20" y="130" width="1160" height="150" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="160" fill="#1e293b" font-family="Arial" font-size="20" font-weight="bold">
    Create New Game
  </text>
  
  <!-- Game Type Selection -->
  <text x="40" y="190" fill="#64748b" font-family="Arial" font-size="14">Select Game Type:</text>
  
  <!-- Game Type Cards -->
  <rect x="40" y="200" width="180" height="60" rx="8" fill="#3b82f6"/>
  <text x="130" y="235" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    🎯 Draw 1v1
  </text>
  
  <rect x="240" y="200" width="180" height="60" rx="8" fill="#e5e7eb"/>
  <text x="330" y="235" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14" font-weight="bold">
    🎱 Pool 8ball
  </text>
  
  <rect x="440" y="200" width="180" height="60" rx="8" fill="#e5e7eb"/>
  <text x="530" y="235" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14" font-weight="bold">
    🃏 Blackjack
  </text>
  
  <!-- Stake Amount -->
  <text x="640" y="190" fill="#64748b" font-family="Arial" font-size="14">Stake Amount:</text>
  <rect x="640" y="200" width="200" height="40" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="650" y="225" fill="#94a3b8" font-family="Arial" font-size="14">KES 100.00</text>
  
  <!-- Create Button -->
  <rect x="860" y="200" width="200" height="40" rx="5" fill="#10b981"/>
  <text x="960" y="225" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    Create Game
  </text>
  
  <!-- Open Games Section -->
  <rect x="20" y="300" width="1160" height="480" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="330" fill="#1e293b" font-family="Arial" font-size="20" font-weight="bold">
    Open Games
  </text>
  
  <!-- Filter Tabs -->
  <rect x="40" y="350" width="300" height="30" rx="5" fill="#f1f5f9"/>
  <text x="70" y="370" text-anchor="middle" fill="#3b82f6" font-family="Arial" font-size="12" font-weight="bold">All Games</text>
  <text x="170" y="370" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Draw 1v1</text>
  <text x="270" y="370" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Pool 8ball</text>
  <text x="340" y="370" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Blackjack</text>
  
  <!-- Game List Header -->
  <rect x="40" y="390" width="1120" height="40" fill="#f8fafc"/>
  <text x="60" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Game Code</text>
  <text x="200" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Type</text>
  <text x="320" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Stake</text>
  <text x="420" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Players</text>
  <text x="520" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Creator</text>
  <text x="650" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Created</text>
  <text x="800" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Status</text>
  <text x="950" y="415" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Action</text>
  
  <!-- Game Items -->
  <rect x="40" y="440" width="1120" height="50" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="60" y="465" fill="#1e293b" font-family="Arial" font-size="12">ABC123</text>
  <text x="200" y="465" fill="#3b82f6" font-family="Arial" font-size="12">🎯 Draw 1v1</text>
  <text x="320" y="465" fill="#059669" font-family="Arial" font-size="12" font-weight="bold">KES 100</text>
  <text x="420" y="465" fill="#1e293b" font-family="Arial" font-size="12">1/2</text>
  <text x="520" y="465" fill="#1e293b" font-family="Arial" font-size="12">player1</text>
  <text x="650" y="465" fill="#64748b" font-family="Arial" font-size="12">2m ago</text>
  <rect x="780" y="455" width="60" height="20" rx="10" fill="#10b981"/>
  <text x="810" y="468" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">Waiting</text>
  <rect x="950" y="455" width="80" height="25" rx="5" fill="#3b82f6"/>
  <text x="990" y="470" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">Join</text>
  
  <rect x="40" y="500" width="1120" height="50" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="60" y="525" fill="#1e293b" font-family="Arial" font-size="12">DEF456</text>
  <text x="200" y="525" fill="#f59e0b" font-family="Arial" font-size="12">🎱 Pool 8ball</text>
  <text x="320" y="525" fill="#059669" font-family="Arial" font-size="12" font-weight="bold">KES 200</text>
  <text x="420" y="525" fill="#1e293b" font-family="Arial" font-size="12">2/2</text>
  <text x="520" y="525" fill="#1e293b" font-family="Arial" font-size="12">player2</text>
  <text x="650" y="525" fill="#64748b" font-family="Arial" font-size="12">5m ago</text>
  <rect x="780" y="515" width="60" height="20" rx="10" fill="#ef4444"/>
  <text x="810" y="528" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">Full</text>
  <rect x="950" y="515" width="80" height="25" rx="5" fill="#9ca3af"/>
  <text x="990" y="530" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">Full</text>
  
  <!-- Pagination -->
  <rect x="500" y="750" width="200" height="40" rx="5" fill="#f1f5f9"/>
  <text x="540" y="775" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">← Previous</text>
  <text x="600" y="775" text-anchor="middle" fill="#3b82f6" font-family="Arial" font-size="12" font-weight="bold">1</text>
  <text x="640" y="775" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">2</text>
  <text x="680" y="775" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">3</text>
  <text x="720" y="775" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Next →</text>
</svg>
```

## 4. Individual Game Interface - Draw 1v1

### 4.1 Draw Game Interface
```svg
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="800" fill="#f8fafc"/>
  
  <!-- Header -->
  <rect width="1200" height="70" fill="#1e293b"/>
  <text x="50" y="45" fill="white" font-family="Arial" font-size="24" font-weight="bold">GameLogic</text>
  <text x="1050" y="45" fill="white" font-family="Arial" font-size="14">💰 KES 1,250.00</text>
  
  <!-- Game Info Bar -->
  <rect x="0" y="70" width="1200" height="60" fill="#3b82f6"/>
  <text x="20" y="100" fill="white" font-family="Arial" font-size="16" font-weight="bold">
    Game: ABC123 | Type: Draw 1v1 | Stake: KES 100.00 | Status: Waiting for Opponent
  </text>
  
  <!-- Main Game Area -->
  <rect x="20" y="150" width="760" height="600" rx="10" fill="white" stroke="#e2e8f0"/>
  
  <!-- Game Board -->
  <rect x="40" y="170" width="720" height="400" rx="10" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="400" y="230" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="24" font-weight="bold">
    🎯 DRAW 1v1
  </text>
  
  <!-- Player Slots -->
  <!-- Player 1 -->
  <circle cx="300" cy="350" r="60" fill="#3b82f6"/>
  <text x="300" y="355" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">P1</text>
  <text x="300" y="430" text-anchor="middle" fill="#1e293b" font-family="Arial" font-size="14" font-weight="bold">You</text>
  <text x="300" y="450" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Ready</text>
  
  <!-- Player 2 -->
  <circle cx="500" cy="350" r="60" fill="#94a3b8"/>
  <text x="500" y="355" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">P2</text>
  <text x="500" y="430" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14" font-weight="bold">Waiting...</text>
  <text x="500" y="450" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">Not Ready</text>
  
  <!-- Game Controls -->
  <rect x="40" y="590" width="720" height="80" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="400" y="615" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14">
    Waiting for another player to join...
  </text>
  
  <!-- Draw Button (disabled until 2 players) -->
  <rect x="300" y="630" width="120" height="35" rx="5" fill="#9ca3af"/>
  <text x="360" y="652" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    Draw (2/2)
  </text>
  
  <!-- Cancel Button -->
  <rect x="450" y="630" width="120" height="35" rx="5" fill="#ef4444"/>
  <text x="510" y="652" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    Cancel Game
  </text>
  
  <!-- Side Panel -->
  <rect x="800" y="150" width="380" height="600" rx="10" fill="white" stroke="#e2e8f0"/>
  
  <!-- Game Details -->
  <text x="820" y="180" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">Game Details</text>
  
  <text x="820" y="210" fill="#64748b" font-family="Arial" font-size="12">Game Code:</text>
  <text x="900" y="210" fill="#1e293b" font-family="Arial" font-size="12" font-weight="bold">ABC123</text>
  
  <text x="820" y="235" fill="#64748b" font-family="Arial" font-size="12">Game Type:</text>
  <text x="900" y="235" fill="#1e293b" font-family="Arial" font-size="12" font-weight="bold">Draw 1v1</text>
  
  <text x="820" y="260" fill="#64748b" font-family="Arial" font-size="12">Stake Amount:</text>
  <text x="900" y="260" fill="#059669" font-family="Arial" font-size="12" font-weight="bold">KES 100.00</text>
  
  <text x="820" y="285" fill="#64748b" font-family="Arial" font-size="12">Total Pot:</text>
  <text x="900" y="285" fill="#1e293b" font-family="Arial" font-size="12" font-weight="bold">KES 100.00</text>
  
  <text x="820" y="310" fill="#64748b" font-family="Arial" font-size="12">Created:</text>
  <text x="900" y="310" fill="#1e293b" font-family="Arial" font-size="12">2 minutes ago</text>
  
  <!-- Players List -->
  <text x="820" y="350" fill="#1e293b" font-family="Arial" font-size="16" font-weight="bold">Players (1/2)</text>
  
  <rect x="820" y="370" width="340" height="60" rx="5" fill="#f0fdf4" stroke="#bbf7d0"/>
  <circle cx="840" cy="395" r="15" fill="#10b981"/>
  <text x="865" y="400" fill="#1e293b" font-family="Arial" font-size="12" font-weight="bold">You</text>
  <text x="865" y="415" fill="#059669" font-family="Arial" font-size="10">Joined • KES 100.00</text>
  <text x="1100" y="400" text-anchor="end" fill="#10b981" font-family="Arial" font-size="10" font-weight="bold">READY</text>
  
  <rect x="820" y="440" width="340" height="60" rx="5" fill="#fef2f2" stroke="#fecaca"/>
  <circle cx="840" cy="465" r="15" fill="#ef4444"/>
  <text x="865" y="470" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Waiting for player...</text>
  <text x="865" y="485" fill="#9ca3af" font-family="Arial" font-size="10">Not joined yet</text>
  <text x="1100" y="470" text-anchor="end" fill="#9ca3af" font-family="Arial" font-size="10" font-weight="bold">PENDING</text>
  
  <!-- Game Rules -->
  <text x="820" y="520" fill="#1e293b" font-family="Arial" font-size="16" font-weight="bold">Game Rules</text>
  <text x="820" y="545" fill="#64748b" font-family="Arial" font-size="11">
    • Both players place their stakes
  </text>
  <text x="820" y="565" fill="#64748b" font-family="Arial" font-size="11">
    • System randomly selects a winner
  </text>
  <text x="820" y="585" fill="#64748b" font-family="Arial" font-size="11">
    • Winner takes 85% of total pot (15% house cut)
  </text>
  
  <!-- Share Game Code -->
  <text x="820" y="625" fill="#1e293b" font-family="Arial" font-size="16" font-weight="bold">Share Game</text>
  <rect x="820" y="635" width="200" height="30" rx="5" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="830" y="655" fill="#64748b" font-family="Arial" font-size="12">ABC123</text>
  <rect x="1030" y="635" width="130" height="30" rx="5" fill="#3b82f6"/>
  <text x="1095" y="655" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">Copy Code</text>
</svg>
```

## 5. Tournament System

### 5.1 Tournament Lobby Wireframe
```svg
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="800" fill="#f8fafc"/>
  
  <!-- Header -->
  <rect width="1200" height="70" fill="#1e293b"/>
  <text x="50" y="45" fill="white" font-family="Arial" font-size="24" font-weight="bold">GameLogic</text>
  <text x="1050" y="45" fill="white" font-family="Arial" font-size="14">💰 KES 1,250.00</text>
  
  <!-- Navigation -->
  <rect x="0" y="70" width="1200" height="40" fill="#e2e8f0"/>
  <text x="20" y="95" fill="#475569" font-family="Arial" font-size="14">
    Home > Tournaments
  </text>
  
  <!-- Create Tournament (Admin Only) -->
  <rect x="20" y="130" width="1160" height="100" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="160" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    Create Tournament
  </text>
  <text x="40" y="185" fill="#64748b" font-family="Arial" font-size="12">
    Only available to admin users
  </text>
  
  <!-- Tournament Form -->
  <rect x="40" y="200" width="300" height="40" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="50" y="225" fill="#94a3b8" font-family="Arial" font-size="12">Tournament Name</text>
  
  <rect x="360" y="200" width="200" height="40" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="370" y="225" fill="#94a3b8" font-family="Arial" font-size="12">Game Type</text>
  
  <rect x="580" y="200" width="150" height="40" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="590" y="225" fill="#94a3b8" font-family="Arial" font-size="12">Entry Fee</text>
  
  <rect x="750" y="200" width="150" height="40" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="760" y="225" fill="#94a3b8" font-family="Arial" font-size="12">Max Players</text>
  
  <rect x="920" y="200" width="200" height="40" rx="5" fill="#10b981"/>
  <text x="1020" y="225" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    Create Tournament
  </text>
  
  <!-- Open Tournaments -->
  <rect x="20" y="250" width="1160" height="530" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="280" fill="#1e293b" font-family="Arial" font-size="20" font-weight="bold">
    Open Tournaments
  </text>
  
  <!-- Tournament List -->
  <rect x="40" y="310" width="1120" height="460" fill="#f8fafc" stroke="#e2e8f0"/>
  
  <!-- Tournament Items -->
  <!-- Tournament 1 -->
  <rect x="60" y="330" width="1080" height="80" rx="8" fill="white" stroke="#e2e8f0"/>
  <text x="80" y="355" fill="#1e293b" font-family="Arial" font-size="16" font-weight="bold">
    Weekly Draw Championship
  </text>
  <text x="80" y="375" fill="#3b82f6" font-family="Arial" font-size="12">🎯 Draw 1v1</text>
  <text x="200" y="375" fill="#059669" font-family="Arial" font-size="12">Entry: KES 50.00</text>
  <text x="320" y="375" fill="#64748b" font-family="Arial" font-size="12">16 Players Max</text>
  <text x="480" y="375" fill="#64748b" font-family="Arial" font-size="12">12/16 Joined</text>
  <text x="600" y="375" fill="#64748b" font-family="Arial" font-size="12">Single Elimination</text>
  <text x="750" y="375" fill="#64748b" font-family="Arial" font-size="12">Created 1h ago</text>
  
  <rect x="880" y="360" width="80" height="30" rx="5" fill="#3b82f6"/>
  <text x="920" y="380" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">Join</text>
  
  <rect x="970" y="360" width="80" height="30" rx="5" fill="#6b7280"/>
  <text x="1010" y="380" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">View</text>
  
  <!-- Tournament 2 -->
  <rect x="60" y="430" width="1080" height="80" rx="8" fill="white" stroke="#e2e8f0"/>
  <text x="80" y="455" fill="#1e293b" font-family="Arial" font-size="16" font-weight="bold">
    Pool Masters Tournament
  </text>
  <text x="80" y="475" fill="#f59e0b" font-family="Arial" font-size="12">🎱 Pool 8ball</text>
  <text x="200" y="475" fill="#059669" font-family="Arial" font-size="12">Entry: KES 100.00</text>
  <text x="320" y="475" fill="#64748b" font-family="Arial" font-size="12">8 Players Max</text>
  <text x="480" y="475" fill="#64748b" font-family="Arial" font-size="12">8/8 Joined</text>
  <text x="600" y="475" fill="#64748b" font-family="Arial" font-size="12">Double Elimination</text>
  <text x="750" y="475" fill="#64748b" font-family="Arial" font-size="12">Started 30m ago</text>
  
  <rect x="880" y="460" width="80" height="30" rx="5" fill="#ef4444"/>
  <text x="920" y="480" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">Full</text>
  
  <rect x="970" y="460" width="80" height="30" rx="5" fill="#3b82f6"/>
  <text x="1010" y="480" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">View</text>
  
  <!-- Tournament 3 -->
  <rect x="60" y="530" width="1080" height="80" rx="8" fill="white" stroke="#e2e8f0"/>
  <text x="80" y="555" fill="#1e293b" font-family="Arial" font-size="16" font-weight="bold">
    Blackjack Pro League
  </text>
  <text x="80" y="575" fill="#8b5cf6" font-family="Arial" font-size="12">🃏 Blackjack</text>
  <text x="200" y="575" fill="#059669" font-family="Arial" font-size="12">Entry: KES 75.00</text>
  <text x="320" y="575" fill="#64748b" font-family="Arial" font-size="12">32 Players Max</text>
  <text x="480" y="575" fill="#64748b" font-family="Arial" font-size="12">3/32 Joined</text>
  <text x="600" y="575" fill="#64748b" font-family="Arial" font-size="12">Single Elimination</text>
  <text x="750" y="575" fill="#64748b" font-family="Arial" font-size="12">Created 3h ago</text>
  
  <rect x="880" y="560" width="80" height="30" rx="5" fill="#3b82f6"/>
  <text x="920" y="580" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">Join</text>
  
  <rect x="970" y="560" width="80" height="30" rx="5" fill="#3b82f6"/>
  <text x="1010" y="580" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">View</text>
  
  <!-- Status Badges -->
  <rect x="1100" y="340" width="40" height="20" rx="10" fill="#10b981"/>
  <text x="1120" y="353" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">OPEN</text>
  
  <rect x="1100" y="440" width="40" height="20" rx="10" fill="#ef4444"/>
  <text x="1120" y="453" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">LIVE</text>
  
  <rect x="1100" y="540" width="40" height="20" rx="10" fill="#10b981"/>
  <text x="1120" y="553" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">OPEN</text>
</svg>
```

## 6. Wallet & Payments

### 6.1 Wallet Dashboard Wireframe
```svg
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="800" fill="#f8fafc"/>
  
  <!-- Header -->
  <rect width="1200" height="70" fill="#1e293b"/>
  <text x="50" y="45" fill="white" font-family="Arial" font-size="24" font-weight="bold">GameLogic</text>
  <text x="1050" y="45" fill="white" font-family="Arial" font-size="14">💰 KES 1,250.00</text>
  
  <!-- Navigation -->
  <rect x="0" y="70" width="1200" height="40" fill="#e2e8f0"/>
  <text x="20" y="95" fill="#475569" font-family="Arial" font-size="14">
    Home > Wallet
  </text>
  
  <!-- Balance Cards -->
  <rect x="20" y="130" width="580" height="150" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="160" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    💰 Available Balance
  </text>
  <text x="40" y="200" fill="#059669" font-family="Arial" font-size="36" font-weight="bold">
    KES 1,250.00
  </text>
  <text x="40" y="230" fill="#64748b" font-family="Arial" font-size="12">
    Last updated: 2 minutes ago
  </text>
  
  <rect x="620" y="130" width="580" height="150" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="640" y="160" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    🔒 Locked Balance
  </text>
  <text x="640" y="200" fill="#ef4444" font-family="Arial" font-size="36" font-weight="bold">
    KES 200.00
  </text>
  <text x="640" y="230" fill="#64748b" font-family="Arial" font-size="12">
    In active games and tournaments
  </text>
  
  <!-- Quick Actions -->
  <rect x="20" y="300" width="1160" height="80" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="330" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    Quick Actions
  </text>
  
  <rect x="40" y="345" width="200" height="40" rx="5" fill="#10b981"/>
  <text x="140" y="370" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    📱 Deposit (M-Pesa)
  </text>
  
  <rect x="260" y="345" width="200" height="40" rx="5" fill="#3b82f6"/>
  <text x="360" y="370" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    💸 Withdraw (M-Pesa)
  </text>
  
  <rect x="480" y="345" width="200" height="40" rx="5" fill="#f59e0b"/>
  <text x="580" y="370" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    📊 Transaction History
  </text>
  
  <rect x="700" y="345" width="200" height="40" rx="5" fill="#8b5cf6"/>
  <text x="800" y="370" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
    🔄 Refresh Balance
  </text>
  
  <!-- Transaction History -->
  <rect x="20" y="400" width="1160" height="380" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="430" fill="#1e293b" font-family="Arial" font-size="18" font-weight="bold">
    Recent Transactions
  </text>
  
  <!-- Filter Tabs -->
  <rect x="40" y="450" width="400" height="30" rx="5" fill="#f1f5f9"/>
  <text x="70" y="470" text-anchor="middle" fill="#3b82f6" font-family="Arial" font-size="12" font-weight="bold">All</text>
  <text x="150" y="470" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Deposits</text>
  <text x="230" y="470" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Withdrawals</text>
  <text x="310" y="470" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Games</text>
  <text x="390" y="470" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">Tournaments</text>
  
  <!-- Transaction Headers -->
  <rect x="40" y="490" width="1120" height="40" fill="#f8fafc"/>
  <text x="60" y="515" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Date</text>
  <text x="200" y="515" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Type</text>
  <text x="350" y="515" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Description</text>
  <text x="600" y="515" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Amount</text>
  <text x="750" y="515" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Status</text>
  <text x="900" y="515" fill="#64748b" font-family="Arial" font-size="12" font-weight="bold">Reference</text>
  
  <!-- Transaction Items -->
  <!-- Deposit -->
  <rect x="40" y="540" width="1120" height="50" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="60" y="565" fill="#1e293b" font-family="Arial" font-size="12">Today, 2:30 PM</text>
  <text x="200" y="565" fill="#10b981" font-family="Arial" font-size="12">💰 Deposit</text>
  <text x="350" y="565" fill="#1e293b" font-family="Arial" font-size="12">M-Pesa Deposit</text>
  <text x="600" y="565" fill="#059669" font-family="Arial" font-size="12" font-weight="bold">+KES 500.00</text>
  <rect x="740" y="555" width="50" height="15" rx="10" fill="#10b981"/>
  <text x="765" y="565" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">SUCCESS</text>
  <text x="900" y="565" fill="#64748b" font-family="Arial" font-size="12">MPX123456</text>
  
  <!-- Game Win -->
  <rect x="40" y="600" width="1120" height="50" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="60" y="625" fill="#1e293b" font-family="Arial" font-size="12">Today, 1:15 PM</text>
  <text x="200" y="625" fill="#3b82f6" font-family="Arial" font-size="12">🎮 Game Win</text>
  <text x="350" y="625" fill="#1e293b" font-family="Arial" font-size="12">Won Draw 1v1 (ABC123)</text>
  <text x="600" y="625" fill="#059669" font-family="Arial" font-size="12" font-weight="bold">+KES 85.00</text>
  <rect x="740" y="615" width="50" height="15" rx="10" fill="#10b981"/>
  <text x="765" y="625" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">PAID</text>
  <text x="900" y="625" fill="#64748b" font-family="Arial" font-size="12">GAM789123</text>
  
  <!-- Game Loss -->
  <rect x="40" y="660" width="1120" height="50" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="60" y="685" fill="#1e293b" font-family="Arial" font-size="12">Today, 12:45 PM</text>
  <text x="200" y="685" fill="#ef4444" font-family="Arial" font-size="12">❌ Game Loss</text>
  <text x="350" y="685" fill="#1e293b" font-family="Arial" font-size="12">Lost Pool 8ball (DEF456)</text>
  <text x="600" y="685" fill="#ef4444" font-family="Arial" font-size="12" font-weight="bold">-KES 100.00</text>
  <rect x="740" y="675" width="50" height="15" rx="10" fill="#10b981"/>
  <text x="765" y="685" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">PAID</text>
  <text x="900" y="685" fill="#64748b" font-family="Arial" font-size="12">GAM456789</text>
  
  <!-- Tournament Entry -->
  <rect x="40" y="720" width="1120" height="50" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="60" y="745" fill="#1e293b" font-family="Arial" font-size="12">Yesterday, 8:20 PM</text>
  <text x="200" y="745" fill="#f59e0b" font-family="Arial" font-size="12">🏆 Tournament</text>
  <text x="350" y="745" fill="#1e293b" font-family="Arial" font-size="12">Entry fee - Weekly Championship</text>
  <text x="600" y="745" fill="#ef4444" font-family="Arial" font-size="12" font-weight="bold">-KES 50.00</text>
  <rect x="740" y="735" width="50" height="15" rx="10" fill="#10b981"/>
  <text x="765" y="745" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">PAID</text>
  <text x="900" y="745" fill="#64748b" font-family="Arial" font-size="12">TOR123789</text>
</svg>
```

## Component Architecture Plan

### React Component Structure
```typescript
// src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── dashboard/
│   │   ├── WelcomeCard.tsx
│   │   ├── BalanceCard.tsx
│   │   ├── QuickActions.tsx
│   │   └── RecentActivity.tsx
│   ├── games/
│   │   ├── GameLobby.tsx
│   │   ├── CreateGameForm.tsx
│   │   ├── GameCard.tsx
│   │   ├── DrawGame.tsx
│   │   ├── PoolGame.tsx
│   │   └── BlackjackGame.tsx
│   ├── tournaments/
│   │   ├── TournamentLobby.tsx
│   │   ├── TournamentCard.tsx
│   │   ├── TournamentBracket.tsx
│   │   └── CreateTournamentForm.tsx
│   ├── wallet/
│   │   ├── WalletDashboard.tsx
│   │   ├── TransactionList.tsx
│   │   ├── DepositForm.tsx
│   │   └── WithdrawForm.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useWallet.ts
│   ├── useGames.ts
│   └── useTournaments.ts
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Games.tsx
│   ├── GamePlay.tsx
│   ├── Tournaments.tsx
│   └── Wallet.tsx
└── utils/
    ├── api.ts
    ├── auth.ts
    └── formatters.ts
```

### Key Features to Implement
1. **Authentication Flow**
   - JWT token management
   - Protected routes
   - Auto-logout on token expiry

2. **State Management**
   - User authentication state
   - Wallet balance and transactions
   - Game states and real-time updates
   - Tournament brackets and progress

3. **Real-time Features**
   - WebSocket connections for live game updates
   - Tournament bracket updates
   - Payment status notifications

4. **Responsive Design**
   - Mobile-first approach
   - Touch-friendly controls
   - Adaptive layouts for different screen sizes

5. **Payment Integration**
   - M-Pesa STK push
   - Transaction status tracking
   - Balance synchronization

This comprehensive wireframe design provides a solid foundation for implementing the React frontend with Tailwind CSS. The design focuses on user experience, clear navigation, and efficient game flow while maintaining visual consistency across all pages.