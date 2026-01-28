import { Server, Socket } from 'socket.io';
import { GameManager } from './game/GameLogic';

export class SocketHandlers {
  private gameManager: GameManager;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.gameManager = new GameManager();
    this.setupEventHandlers(io);
  }

  private setupEventHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
      console.log('Player connected:', socket.id);

      // Room events
      socket.on('create-room', (data: { playerName: string }) => {
        this.handleCreateRoom(socket, data);
      });

      socket.on('join-room', (data: { roomCode: string; playerName: string }) => {
        this.handleJoinRoom(socket, data);
      });

      socket.on('start-game', (roomCode: string) => {
        this.handleStartGame(socket, roomCode);
      });

      // Game events
      socket.on('submit-word', (data: { roomCode: string; word: string }) => {
        this.handleSubmitWord(socket, data);
      });

      socket.on('vote', (data: { roomCode: string; targetPlayerId: string }) => {
        this.handleVote(socket, data);
      });

      socket.on('reveal-next', (roomCode: string) => {
        this.handleRevealNext(socket, roomCode);
      });

      // Disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error', 'An error occurred');
      });
    });
  }

  private handleCreateRoom(socket: Socket, data: { playerName: string }) {
    try {
      if (!data.playerName?.trim()) {
        socket.emit('error', 'Please enter your name');
        return;
      }

      const { room, player } = this.gameManager.createRoom({
        socketId: socket.id,
        name: data.playerName.trim()
      });

      socket.join(room.getCode());

      const response = {
        roomCode: room.getCode(),
        player: player.toJSON(),
        room: room.toJSON()
      };

      socket.emit('room-created', response);
      console.log(`Room created: ${room.getCode()} by ${player.name}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  }

  private handleJoinRoom(socket: Socket, data: { roomCode: string; playerName: string }) {
    try {
      if (!data.playerName?.trim()) {
        socket.emit('error', 'Please enter your name');
        return;
      }

      const result = this.gameManager.joinRoom(data.roomCode, {
        socketId: socket.id,
        name: data.playerName.trim()
      });

      if (!result) {
        socket.emit('error', 'Could not join room. Room may be full or game already in progress.');
        return;
      }

      const { room, player } = result;
      socket.join(room.getCode());

      // Notify all players in the room
      socket.to(room.getCode()).emit('player-joined', {
        player: player.toJSON(),
        players: room.getPlayers().map(p => p.toJSON())
      });

      const response = {
        roomCode: room.getCode(),
        player: player.toJSON(),
        room: room.toJSON()
      };

      socket.emit('joined-room', response);
      console.log(`${player.name} joined room ${room.getCode()}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  }

  private handleStartGame(socket: Socket, roomCode: string) {
    try {
      const success = this.gameManager.startGame(roomCode, socket.id);
      
      if (!success) {
        socket.emit('error', 'Cannot start game. You must be the host and have at least 3 players.');
        return;
      }

      const room = this.gameManager.getRoom(roomCode);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Notify all players with their roles
      room.getPlayers().forEach(player => {
        const playerSocket = this.io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          playerSocket.emit('game-started', {
            isImposter: player.role === 'imposter',
            fruit: player.role === 'crewmate' ? room.getCurrentFruit() : undefined,
            players: room.getPlayers().map(p => ({
              id: p.id,
              name: p.name,
              isAlive: p.isAlive,
              hasSubmittedWord: p.hasSubmittedWord,
              votes: p.votes,
              isHost: p.isHost
            }))
          });
        }
      });

      socket.to(roomCode).emit('game-state-changed', {
        state: room.getState(),
        fruit: room.getCurrentFruit()
      });

      console.log(`Game started in room ${roomCode}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', 'Failed to start game');
    }
  }

  private handleSubmitWord(socket: Socket, data: { roomCode: string; word: string }) {
    try {
      const success = this.gameManager.submitWord(socket.id, data.word);
      
      if (!success) {
        socket.emit('error', 'Cannot submit word at this time');
        return;
      }

      const player = this.gameManager.getPlayer(socket.id);
      const room = player ? this.gameManager.getRoom(player.roomCode) : undefined;
      
      if (room) {
        socket.to(room.getCode()).emit('player-submitted', {
          playerId: socket.id,
          hasSubmitted: true
        });

        socket.to(room.getCode()).emit('game-state-changed', {
          state: room.getState()
        });
      }
    } catch (error) {
      console.error('Error submitting word:', error);
      socket.emit('error', 'Failed to submit word');
    }
  }

  private handleVote(socket: Socket, data: { roomCode: string; targetPlayerId: string }) {
    try {
      const success = this.gameManager.vote(socket.id, data.targetPlayerId);
      
      if (!success) {
        socket.emit('error', 'Cannot vote at this time');
        return;
      }

      const player = this.gameManager.getPlayer(socket.id);
      const room = player ? this.gameManager.getRoom(player.roomCode) : undefined;
      
      if (room) {
        const targetPlayer = room.getPlayer(data.targetPlayerId);
        if (targetPlayer) {
          socket.to(room.getCode()).emit('vote-received', {
            voterId: socket.id,
            targetPlayerId: data.targetPlayerId,
            votes: targetPlayer.votes
          });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      socket.emit('error', 'Failed to vote');
    }
  }

  private handleRevealNext(socket: Socket, roomCode: string) {
    try {
      const room = this.gameManager.getRoom(roomCode);
      if (!room || room.getState() !== 'discussion') {
        socket.emit('error', 'Cannot reveal words at this time');
        return;
      }

      const revealOrder = room.getRevealOrder();
      const nextPlayerId = revealOrder[0];
      
      if (nextPlayerId) {
        const player = room.getPlayer(nextPlayerId);
        if (player && player.word) {
          socket.to(roomCode).emit('word-revealed', {
            playerId: nextPlayerId,
            word: player.word,
            isImposter: player.role === 'imposter'
          });
        }
      }
    } catch (error) {
      console.error('Error revealing word:', error);
      socket.emit('error', 'Failed to reveal word');
    }
  }

  private handleDisconnect(socket: Socket) {
    try {
      console.log('Player disconnected:', socket.id);
      
      const player = this.gameManager.getPlayer(socket.id);
      if (player) {
        const room = this.gameManager.getRoom(player.roomCode);
        
        if (room) {
          // Notify remaining players
          socket.to(room.getCode()).emit('player-left', {
            playerId: socket.id,
            players: room.getPlayers().map(p => p.toJSON())
          });
        }

        // Remove player from game manager
        this.gameManager.removePlayer(socket.id);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }
}
