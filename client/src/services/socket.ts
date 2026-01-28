import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  isAlive: boolean;
  hasSubmittedWord: boolean;
  votes: number;
  word?: string;
  fruit?: string;
  isHost: boolean;
}

export interface GameState {
  state: 'waiting' | 'fruit-selection' | 'word-input' | 'discussion' | 'voting' | 'results' | 'ended';
  currentRound: number;
  maxRounds: number;
  fruit?: string;
  timer: number;
  players: Player[];
}

export interface Room {
  players: Player[];
}

// Socket context
const SocketContext = createContext<Socket | null | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(socketRef.current);

    return () => {
      newSocket.close();
    };
  }, []);

  return React.createElement(
    SocketContext.Provider,
    { value: socket },
    children
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return socket;
};

export const useGameState = () => {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on('room-created', (data: { roomCode: string; player: Player; room: Room }) => {
      setRoomCode(data.roomCode);
      setCurrentPlayer(data.player);
      setGameState({
        state: 'waiting',
        currentRound: 1,
        maxRounds: 3,
        timer: 0,
        players: data.room.players
      });
      setError('');
    });

    socket.on('joined-room', (data: { roomCode: string; player: Player; room: Room }) => {
      setRoomCode(data.roomCode);
      setCurrentPlayer(data.player);
      setGameState({
        state: 'waiting',
        currentRound: 1,
        maxRounds: 3,
        timer: 0,
        players: data.room.players
      });
      setError('');
    });

    socket.on('player-joined', (data: { player: Player; players: Player[] }) => {
      setGameState(prev => prev ? {
        ...prev,
        players: data.players
      } : null);
    });

    socket.on('player-left', (data: { playerId: string; players: Player[] }) => {
      setGameState(prev => prev ? {
        ...prev,
        players: data.players
      } : null);
    });

    // Game events
    socket.on('game-started', (data: { isImposter: boolean; fruit?: string; players: Player[] }) => {
      setCurrentPlayer(prev => prev ? { ...prev, isImposter: data.isImposter } : null);
      setGameState(prev => prev ? {
        ...prev,
        state: 'fruit-selection',
        fruit: data.fruit,
        players: data.players
      } : null);
    });

    socket.on('game-state-changed', (data: { state: GameState['state']; fruit?: string }) => {
      setGameState(prev => prev ? {
        ...prev,
        state: data.state,
        fruit: data.fruit
      } : null);
    });

    socket.on('new-round', (data: { round: number; fruit?: string; isImposter: boolean }) => {
      setCurrentPlayer(prev => prev ? { ...prev, isImposter: data.isImposter } : null);
      setGameState(prev => prev ? {
        ...prev,
        state: 'fruit-selection',
        currentRound: data.round,
        fruit: data.fruit
      } : null);
    });

    socket.on('timer-update', (data: { time: number }) => {
      setGameState(prev => prev ? {
        ...prev,
        timer: data.time
      } : null);
    });

    socket.on('player-submitted', (data: { playerId: string; hasSubmitted: boolean }) => {
      setGameState(prev => prev ? {
        ...prev,
        players: prev.players.map(p => 
          p.id === data.playerId ? { ...p, hasSubmittedWord: data.hasSubmitted } : p
        )
      } : null);
    });

    socket.on('vote-received', (data: { voterId: string; targetPlayerId: string; votes: number }) => {
      setGameState(prev => prev ? {
        ...prev,
        players: prev.players.map(p => 
          p.id === data.targetPlayerId ? { ...p, votes: data.votes } : p
        )
      } : null);
    });

    socket.on('game-ended', (data: { 
      winner: 'crewmates' | 'imposter';
      votedOutPlayer: Player | null;
      players: Player[];
      fruit: string;
      words: Array<{ playerId: string; word: string; isImposter: boolean }>;
    }) => {
      setGameState(prev => prev ? {
        ...prev,
        state: 'results',
        players: data.players,
        fruit: data.fruit
      } : null);
    });

    socket.on('error', (err: string) => {
      setError(err);
    });

    return () => {
      socket.off('room-created');
      socket.off('joined-room');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('game-state-changed');
      socket.off('new-round');
      socket.off('timer-update');
      socket.off('player-submitted');
      socket.off('vote-received');
      socket.off('game-ended');
      socket.off('error');
    };
  }, [socket]);

  const createRoom = (playerName: string) => {
    socket.emit('create-room', { playerName });
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    socket.emit('join-room', { roomCode, playerName });
  };

  const startGame = () => {
    socket.emit('start-game', roomCode);
  };

  const submitWord = (word: string) => {
    socket.emit('submit-word', { roomCode, word });
  };

  const vote = (targetPlayerId: string) => {
    socket.emit('vote', { roomCode, targetPlayerId });
  };

  return {
    gameState,
    currentPlayer,
    roomCode,
    error,
    setError,
    createRoom,
    joinRoom,
    startGame,
    submitWord,
    vote
  };
};
