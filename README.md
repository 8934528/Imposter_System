# Wrong Fruit

[![Wrong Fruit Badge](https://img.shields.io/badge/Wrong%2520Fruit-Imposter%2520System-blueviolet)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb)](https://react.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7.2-orange)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)

A social deduction game where players describe fruits with one word and try to spot the imposter!

---

## Game Overview

Wrong Fruit is a multiplayer social deduction game inspired by popular imposter games. Players are either Crewmates (who know the secret fruit) or Imposters (who don't). Through word descriptions, discussion, and voting, players must identify and eliminate the imposter before they win!

## Key Features

- Real-time multiplayer with WebSocket connections
- Random fruit selection each round
- One-word descriptions for strategic gameplay
- Interactive voting system
- Role-based gameplay (Crewmate vs Imposter)
- Responsive web interface
- Multiple rounds with win conditions

---

## Project Structure

    Imposter_System/
        ├── client/                    # Frontend React application
        |   |
        │   ├── src/
        │   │   ├── components/        # React components (GameCanvas, Lobby, etc.)
        │   │   ├── game/              # Phaser game scenes and config
        │   │   ├── services/          # Socket.io client and game state
        │   │   ├── styles/            # CSS styles organized by component
        │   │   └── assets/            # Game assets (images, sounds)
        |   |
        │   └── public/
        |
        ├── server/                    # Backend Node.js server
        │   ├── src/
        │   │   ├── game/              # Game logic (GameLogic, Player, GameRoom)
        │   │   └── socketHandlers.ts  # WebSocket event handlers
        |   |
        │   └── package.json
        |
        └── package.json               # Root project configuration

---

## Quick Start

### Prerequisites

       - Node.js 16+
       - npm or yarn

## Installation

1. Clone and install dependencies:

        bash
        # Clone the repository
        git clone <repository-url>
        cd Imposter_System

        # Install all dependencies (client, server, and root)
        npm run install-all

2. Run the development servers:

        bash
        # Start both client and server simultaneously
        npm run dev

        # Or run them separately:
        # Terminal 1 - Start server
        cd server
        npm run dev

        # Terminal 2 - Start client
        cd client
        npm run dev

3. Open the game in your browser:

- Frontend: **[http://localhost:3000](http://localhost:3000)**
- Backend API: **[http://localhost:3001](http://localhost:3001)**
- Health Check: **[http://localhost:3001/health](http://localhost:3001/health)**

## How to Play

### Game Flow

1. Lobby Phase:

    - Create a room or join with a 4-letter code
    - Wait for at least 3 players
    - Host can start the game

2. Fruit Selection:

    - A random fruit is selected
    - Crewmates: See the fruit
    - Imposters: Don't see the fruit

3. Word Input:

    - Players submit ONE word describing the fruit
    - Imposters must wait for crewmates to submit first
    - Imposters try to blend in with their guesses

4. Discussion Phase:

    - All words are revealed
    - Players discuss who might be the imposter
    - 60-second discussion timer

5. Voting Phase:

    - Vote for who you think is the imposter
    - Player with most votes gets eliminated
    - 30-second voting timer

6. Results:

    - If imposter is eliminated: Crewmates win!
    - If crewmate is eliminated: Next round begins
    - Game continues for up to 3 rounds
    - If imposter survives all rounds: Imposter wins!

## Game Rules

*Crewmates:* Must describe the fruit accurately
*Imposters:* Must guess based on others' descriptions
*Timers:* Discussion (60s), Voting (30s)
*Players:* 3-10 players per room
*Rounds:* Up to 3 rounds per game
*Victory:* Eliminate imposter or survive all rounds

---

## Tech Stack

### Frontend

- React 19 - UI library with TypeScript
- Vite - Fast build tool and dev server
- TypeScript - Type-safe JavaScript
- Socket.io Client - Real-time communication
- React Icons - Icon library
- Phaser 3 - Game engine

### Backend

- Node.js - JavaScript runtime
- Express - Web server framework
- Socket.io - Real-time bidirectional communication
- TypeScript - Type-safe server code
- CORS - Cross-origin resource sharing

## API & WebSocket Events

### WebSocket Events (Client - Server)

| Event          | Data                                           | Description                         |
|----------------|------------------------------------------------|-------------------------------------|
| create-room    | `{ playerName: string }`                       | Create a new game room              |
| join-room      | `{ roomCode: string, playerName: string }`     | Join an existing room               |
| start-game     | `{ roomCode: string }`                         | Host starts the game                |
| submit-word    | `{ roomCode: string, word: string }`           | Submit a word description           |
| vote           | `{ roomCode: string, targetPlayerId: string }` | Vote for a player                   |
| reveal-next    | `{ roomCode: string }`                         | Reveal the next player's word       |

### WebSocket Events (Server - Client)

| Event              | Data                                      | Description                          |
|--------------------|-------------------------------------------|--------------------------------------|
| room-created       | `{ roomCode, player, room }`              | Room created successfully            |
| joined-room        | `{ roomCode, player, room }`              | Joined room successfully             |
| player-joined      | `{ player, players }`                     | New player joined the room           |
| player-left        | `{ playerId, players }`                   | Player left the room                 |
| game-started       | `{ isImposter, fruit?, players }`         | Game started with role assignment    |
| game-state-changed | `{ state, fruit? }`                       | Game state changed                   |
| player-submitted   | `{ playerId, hasSubmitted }`              | Player submitted a word              |
| vote-received      | `{ voterId, targetPlayerId, votes }`      | Vote counted                         |
| game-ended         | `{ winner, players, fruit, words }`       | Game ended with final results        |
| error              | `string`                                  | Error message                        |

## Debug Tips

    - Check browser DevTools Console for client errors
    - Check terminal logs for server errors
    - Verify WebSocket connections in Network tab
    - Test with multiple browser tabs for multiplayer

---

## Future Enhancements

### Planned Features

- Voice chat integration
- Custom game settings (timer lengths, imposter count)
- Player statistics and leaderboards
- Additional game modes
- AI bots for single-player practice
- Custom fruit lists
- Player avatars and customization
- Spectator mode
- Tournament system

### Technical Improvements

- Unit and integration tests
- End-to-end testing with Cypress
- Performance optimization
- Database integration for persistent data
- Docker containerization
- CI/CD pipeline

---

## Contributing

### Development Workflow

- Fork the repository
- Create a feature branch: *git checkout -b feature/amazing-feature*
- Make your changes
- Test thoroughly
- Commit changes: *git commit -m 'Add amazing feature'*
- Push to branch: *git push origin feature/amazing-feature*
- Open a **Pull Request**

### Code Style

- Use TypeScript for type safety
- Follow React hooks best practices
- Use functional components
- Maintain consistent file structure
- Add comments for complex logic

---

"One word to describe them all, one vote to find them, one imposter to rule them all!"

---
