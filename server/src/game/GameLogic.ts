// Available fruits for the game
const FRUITS = [
  'Apple', 'Banana', 'Orange', 'Grape', 'Strawberry',
  'Watermelon', 'Pineapple', 'Mango', 'Kiwi', 'Peach',
  'Pear', 'Cherry', 'Blueberry', 'Raspberry', 'Lemon',
  'Lime', 'Coconut', 'Papaya', 'Apricot', 'Plum'
];

export type GameRole = 'crewmate' | 'imposter';
export type GameState = 'waiting' | 'fruit-selection' | 'word-input' | 'discussion' | 'voting' | 'results' | 'ended';

export interface PlayerData {
  id: string;
  socketId: string;
  name: string;
  roomCode: string;
  role: GameRole;
  fruit?: string;
  word?: string;
  votes: number;
  isAlive: boolean;
  hasSubmittedWord: boolean;
  isHost: boolean;
  joinedAt: Date;
}

export interface GameSettings {
  maxPlayers: number;
  imposterCount: number;
  discussionTime: number;
  votingTime: number;
  maxRounds: number;
}

export class Player {
  private data: PlayerData;

  constructor(data: Partial<PlayerData> & { id: string; socketId: string; name: string; roomCode: string }) {
    this.data = {
      ...data,
      id: data.id,
      socketId: data.socketId,
      name: data.name,
      roomCode: data.roomCode,
      role: 'crewmate',
      votes: 0,
      isAlive: true,
      hasSubmittedWord: false,
      isHost: data.isHost || false,
      joinedAt: new Date()
    };
  }

  // Getters
  get id(): string { return this.data.id; }
  get socketId(): string { return this.data.socketId; }
  get name(): string { return this.data.name; }
  get roomCode(): string { return this.data.roomCode; }
  get role(): GameRole { return this.data.role; }
  get fruit(): string | undefined { return this.data.fruit; }
  get word(): string | undefined { return this.data.word; }
  get votes(): number { return this.data.votes; }
  get isAlive(): boolean { return this.data.isAlive; }
  get hasSubmittedWord(): boolean { return this.data.hasSubmittedWord; }
  get isHost(): boolean { return this.data.isHost; }
  get joinedAt(): Date { return this.data.joinedAt; }

  // Setters
  set role(role: GameRole) { this.data.role = role; }
  set fruit(fruit: string | undefined) { this.data.fruit = fruit; }
  set word(word: string | undefined) { this.data.word = word; }
  set votes(votes: number) { this.data.votes = votes; }
  set isAlive(alive: boolean) { this.data.isAlive = alive; }
  set hasSubmittedWord(submitted: boolean) { this.data.hasSubmittedWord = submitted; }
  set isHost(host: boolean) { this.data.isHost = host; }

  // Methods
  resetForNewRound() {
    this.data.hasSubmittedWord = false;
    this.data.word = undefined;
    this.data.votes = 0;
  }

  eliminate() {
    this.data.isAlive = false;
  }

  toJSON() {
    return {
      id: this.data.id,
      name: this.data.name,
      role: this.data.role,
      isAlive: this.data.isAlive,
      hasSubmittedWord: this.data.hasSubmittedWord,
      votes: this.data.votes,
      isHost: this.data.isHost,
      word: this.data.word
    };
  }
}

export class GameRoom {
  private code: string;
  private players: Map<string, Player>;
  private state: GameState;
  private currentRound: number;
  private maxRounds: number;
  private currentFruit?: string;
  private timer: number;
  private timerInterval?: NodeJS.Timeout;
  private discussionTime: number;
  private votingTime: number;
  private imposterCount: number;
  private votedPlayers: Set<string>;
  private revealOrder: string[];
  private settings: GameSettings;

  constructor(code: string, settings?: Partial<GameSettings>) {
    this.code = code;
    this.players = new Map();
    this.state = 'waiting';
    this.currentRound = 1;
    this.maxRounds = settings?.maxRounds || 3;
    this.timer = 0;
    this.discussionTime = settings?.discussionTime || 60;
    this.votingTime = settings?.votingTime || 30;
    this.imposterCount = settings?.imposterCount || 1;
    this.votedPlayers = new Set();
    this.revealOrder = [];
    
    this.settings = {
      maxPlayers: settings?.maxPlayers || 10,
      imposterCount: this.imposterCount,
      discussionTime: this.discussionTime,
      votingTime: this.votingTime,
      maxRounds: this.maxRounds
    };
  }

  // Getters
  getCode(): string { return this.code; }
  getState(): GameState { return this.state; }
  getPlayers(): Player[] { return Array.from(this.players.values()); }
  getPlayer(id: string): Player | undefined { return this.players.get(id); }
  getPlayerCount(): number { return this.players.size; }
  getAlivePlayers(): Player[] { return this.getPlayers().filter(p => p.isAlive); }
  getCurrentRound(): number { return this.currentRound; }
  getMaxRounds(): number { return this.maxRounds; }
  getCurrentFruit(): string | undefined { return this.currentFruit; }
  getTimer(): number { return this.timer; }
  getSettings(): GameSettings { return this.settings; }
  getRevealOrder(): string[] { return this.revealOrder; }

  // Player management
  addPlayer(player: Player): boolean {
    if (this.players.size >= this.settings.maxPlayers) return false;
    this.players.set(player.id, player);
    return true;
  }

  removePlayer(playerId: string): boolean {
    const removed = this.players.delete(playerId);
    
    // If host left and there are players remaining, assign new host
    if (removed && this.getPlayers().length > 0) {
      const remainingPlayers = this.getPlayers();
      const oldHost = remainingPlayers.find(p => p.id === playerId);
      if (oldHost?.isHost) {
        remainingPlayers[0].isHost = true;
      }
    }
    
    return removed;
  }

  // Game management
  canStartGame(): { canStart: boolean; reason?: string } {
    if (this.state !== 'waiting') {
      return { canStart: false, reason: 'Game already in progress' };
    }
    
    if (this.players.size < 3) {
      return { canStart: false, reason: 'Need at least 3 players' };
    }
    
    return { canStart: true };
  }

  startGame(): void {
    if (this.state !== 'waiting') return;
    
    // Select random fruit
    this.currentFruit = this.getRandomFruit();
    
    // Assign roles
    this.assignRoles();
    
    // Set reveal order
    this.setRevealOrder();
    
    // Reset voting
    this.votedPlayers.clear();
    
    // Change state
    this.state = 'fruit-selection';
  }

  nextRound(): void {
    this.currentRound++;
    
    if (this.currentRound > this.maxRounds) {
      this.state = 'results';
      return;
    }
    
    // Select new fruit
    this.currentFruit = this.getRandomFruit();
    
    // Reset players for new round
    this.getAlivePlayers().forEach(player => {
      player.resetForNewRound();
    });
    
    // Reset voting
    this.votedPlayers.clear();
    
    // Set new reveal order
    this.setRevealOrder();
    
    // Change state
    this.state = 'fruit-selection';
  }

  submitWord(playerId: string, word: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player || this.state !== 'word-input' || !player.isAlive) return false;
    
    // Validate word
    const trimmedWord = word.trim();
    if (trimmedWord.length === 0 || trimmedWord.length > 20) return false;
    
    // Check if imposter can submit
    if (player.role === 'imposter') {
      const hasCrewmateSubmitted = this.getAlivePlayers()
        .some(p => p.role === 'crewmate' && p.hasSubmittedWord);
      
      if (!hasCrewmateSubmitted) return false;
    }
    
    player.word = trimmedWord;
    player.hasSubmittedWord = true;
    
    // Check if all alive players have submitted
    const allSubmitted = this.getAlivePlayers()
      .every(p => p.hasSubmittedWord);
    
    if (allSubmitted) {
      this.state = 'discussion';
      this.startTimer(this.discussionTime, () => {
        this.state = 'voting';
        this.startTimer(this.votingTime, () => {
          this.endVoting();
        });
      });
    }
    
    return true;
  }

  vote(voterId: string, targetPlayerId: string): boolean {
    const voter = this.getPlayer(voterId);
    const target = this.getPlayer(targetPlayerId);
    
    if (!voter || !target || this.state !== 'voting' || 
        !voter.isAlive || !target.isAlive || 
        this.votedPlayers.has(voterId)) {
      return false;
    }
    
    target.votes++;
    this.votedPlayers.add(voterId);
    
    // Check if all alive players have voted
    const allVoted = this.getAlivePlayers()
      .every(p => this.votedPlayers.has(p.id));
    
    if (allVoted) {
      this.endVoting();
    }
    
    return true;
  }

  endVoting(): void {
    this.stopTimer();
    
    // Find player(s) with most votes
    let maxVotes = 0;
    let votedOutPlayers: Player[] = [];
    
    this.getAlivePlayers().forEach(player => {
      if (player.votes > maxVotes) {
        maxVotes = player.votes;
        votedOutPlayers = [player];
      } else if (player.votes === maxVotes && maxVotes > 0) {
        votedOutPlayers.push(player);
      }
    });
    
    // If there's a clear winner (only one player with max votes)
    if (votedOutPlayers.length === 1 && maxVotes > 0) {
      const votedOutPlayer = votedOutPlayers[0];
      votedOutPlayer.eliminate();
      
      if (votedOutPlayer.role === 'imposter') {
        // Crewmates win
        this.state = 'results';
      } else {
        // Crewmate eliminated, continue to next round
        this.nextRound();
      }
    } else {
      // Tie or no votes, continue to next round
      this.nextRound();
    }
  }

  // Helper methods
  private getRandomFruit(): string {
    return FRUITS[Math.floor(Math.random() * FRUITS.length)];
  }

  private assignRoles(): void {
    const players = this.getPlayers();
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Reset all players to crewmate
    players.forEach(p => {
      p.role = 'crewmate';
      p.resetForNewRound();
      p.isAlive = true;
    });
    
    // Assign imposter role
    const actualImposterCount = Math.min(this.imposterCount, players.length - 1);
    for (let i = 0; i < actualImposterCount; i++) {
      shuffledPlayers[i].role = 'imposter';
    }
  }

  private setRevealOrder(): void {
    this.revealOrder = this.getAlivePlayers()
      .sort(() => Math.random() - 0.5)
      .map(p => p.id);
  }

  private startTimer(duration: number, onComplete: () => void): void {
    this.stopTimer();
    
    this.timer = duration;
    this.timerInterval = setInterval(() => {
      this.timer--;
      
      if (this.timer <= 0) {
        this.stopTimer();
        onComplete();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopTimer();
    this.players.clear();
  }

  toJSON() {
    return {
      code: this.code,
      state: this.state,
      players: this.getPlayers().map(p => p.toJSON()),
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      currentFruit: this.currentFruit,
      timer: this.timer,
      settings: this.settings
    };
  }
}

export class GameManager {
  private rooms: Map<string, GameRoom>;
  private players: Map<string, Player>;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
  }

  // Room management
  createRoom(playerData: { socketId: string; name: string }, settings?: Partial<GameSettings>): { room: GameRoom; player: Player } {
    const roomCode = this.generateRoomCode();
    
    // Create player
    const player = new Player({
      id: playerData.socketId,
      socketId: playerData.socketId,
      name: playerData.name,
      roomCode,
      isHost: true
    });
    
    // Create room
    const room = new GameRoom(roomCode, settings);
    room.addPlayer(player);
    
    // Store references
    this.rooms.set(roomCode, room);
    this.players.set(player.id, player);
    
    return { room, player };
  }

  joinRoom(roomCode: string, playerData: { socketId: string; name: string }): { room: GameRoom; player: Player } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;
    
    // Check if room can accept more players
    if (room.getPlayerCount() >= 10) return null;
    
    // Check if game is already in progress
    if (room.getState() !== 'waiting') return null;
    
    // Create player
    const player = new Player({
      id: playerData.socketId,
      socketId: playerData.socketId,
      name: playerData.name,
      roomCode: roomCode.toUpperCase(),
      isHost: false
    });
    
    // Add player to room
    const success = room.addPlayer(player);
    if (!success) return null;
    
    // Store player
    this.players.set(player.id, player);
    
    return { room, player };
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    
    const room = this.rooms.get(player.roomCode);
    if (room) {
      room.removePlayer(playerId);
      
      // Clean up empty rooms
      if (room.getPlayerCount() === 0) {
        room.cleanup();
        this.rooms.delete(player.roomCode);
      }
    }
    
    this.players.delete(playerId);
  }

  // Game actions
  startGame(roomCode: string, playerId: string): boolean {
    const room = this.getRoom(roomCode);
    const player = this.getPlayer(playerId);
    
    if (!room || !player || !player.isHost) return false;
    
    const canStart = room.canStartGame();
    if (!canStart.canStart) return false;
    
    room.startGame();
    return true;
  }

  submitWord(playerId: string, word: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;
    
    const room = this.getRoom(player.roomCode);
    if (!room) return false;
    
    return room.submitWord(playerId, word);
  }

  vote(voterId: string, targetPlayerId: string): boolean {
    const voter = this.getPlayer(voterId);
    if (!voter) return false;
    
    const room = this.getRoom(voter.roomCode);
    if (!room) return false;
    
    return room.vote(voterId, targetPlayerId);
  }

  // Helper methods
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    
    return code;
  }

  getRoomState(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    
    return {
      state: room.getState(),
      currentRound: room.getCurrentRound(),
      maxRounds: room.getMaxRounds(),
      currentFruit: room.getCurrentFruit(),
      timer: room.getTimer(),
      players: room.getPlayers().map(p => p.toJSON()),
      settings: room.getSettings()
    };
  }
}
