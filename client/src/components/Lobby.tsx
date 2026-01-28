import React, { useState } from "react";
import { useGameState } from "../services/socket";
import { FaUserFriends, FaGamepad, FaUsers, FaCrown } from "react-icons/fa";
import "../styles/components/Lobby.css";

interface LobbyProps {
  setGameState: (state: "lobby" | "playing") => void;
}

const Lobby: React.FC<LobbyProps> = ({ setGameState }) => {
  const {
    createRoom,
    joinRoom,
    gameState,
    currentPlayer,
    roomCode,
    error,
    setError,
  } = useGameState();
  const [playerName, setPlayerName] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsCreating(true);
    createRoom(playerName.trim());

    // Reset loading after 3 seconds if no response
    setTimeout(() => setIsCreating(false), 3000);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !joinRoomCode.trim()) {
      setError("Please enter your name and room code");
      return;
    }

    setIsJoining(true);
    joinRoom(joinRoomCode.trim().toUpperCase(), playerName.trim());

    // Reset loading after 3 seconds if no response
    setTimeout(() => setIsJoining(false), 3000);
  };

  // If we're in a room, show room lobby
  if (roomCode && gameState?.state === "waiting") {
    return (
      <div className="room-lobby">
        <div className="room-header">
          <h2>
            <FaUsers /> Room: {roomCode}
          </h2>
          <div className="room-info">
            <span className="player-count">
              <FaUserFriends /> {gameState.players.length} players
            </span>
            {currentPlayer?.isHost && (
              <span className="host-badge">
                <FaCrown /> Host
              </span>
            )}
          </div>
        </div>

        <div className="players-list">
          <h3>Players:</h3>
          <div className="players-grid">
            {gameState.players.map((player, index) => (
              <div key={player.id} className="player-card">
                <div className="player-avatar">
                  {player.isHost ? <FaCrown /> : <FaUserFriends />}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  {player.isHost && <span className="host-label">Host</span>}
                </div>
                {index === 0 && (
                  <div className="player-number">#{index + 1}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-controls">
          {currentPlayer?.isHost && (
            <button
              onClick={() => {
                createRoom(playerName);
                setGameState("playing");
              }}
              disabled={gameState.players.length < 3}
              className="start-game-btn"
            >
              <FaGamepad /> Start Game ({gameState.players.length}/10)
            </button>
          )}
          <button
            onClick={() => {
              setGameState("lobby");
              window.location.reload();
            }}
            className="leave-room-btn"
          >
            Leave Room
          </button>
        </div>

        <div className="game-instructions">
          <h3>How to Play Wrong Fruit:</h3>
          <ul>
            <li>🎯 A random fruit is selected each round</li>
            <li>👥 Crewmates see the fruit, Imposters don't</li>
            <li>💬 Describe the fruit with ONE WORD</li>
            <li>👹 Imposters must blend in by guessing</li>
            <li>🗳️ Vote out the suspicious player</li>
            <li>🏆 Find the imposter to win!</li>
          </ul>
        </div>
      </div>
    );
  }

  // Main lobby screen
  return (
    <div className="main-lobby">
      <div className="lobby-header">
        <h1>🍉 Wrong Fruit</h1>
        <p className="subtitle">Find the imposter among the fruits!</p>
      </div>

      <div className="lobby-content">
        <div className="lobby-card">
          <h2>
            <FaUserFriends /> Join the Game
          </h2>

          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
            />
          </div>

          <div className="input-group">
            <label htmlFor="roomCode">Room Code (Optional)</label>
            <input
              id="roomCode"
              type="text"
              value={joinRoomCode}
              onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 4-letter code..."
              maxLength={4}
              style={{ textTransform: "uppercase" }}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating || isJoining}
              className="btn btn-primary"
            >
              {isCreating ? "Creating..." : "🍉 Create New Room"}
            </button>

            <button
              onClick={handleJoinRoom}
              disabled={isCreating || isJoining || !joinRoomCode}
              className="btn btn-secondary"
            >
              {isJoining ? "Joining..." : "🍎 Join Room"}
            </button>
          </div>
        </div>

        <div className="game-rules">
          <h3>🎮 How to Play</h3>
          <div className="rules-grid">
            <div className="rule-card">
              <div className="rule-icon">1</div>
              <h4>Join a Room</h4>
              <p>Create a new room or join with a code</p>
            </div>
            <div className="rule-card">
              <div className="rule-icon">2</div>
              <h4>Get Your Role</h4>
              <p>You're either a Crewmate or Imposter</p>
            </div>
            <div className="rule-card">
              <div className="rule-icon">3</div>
              <h4>Describe the Fruit</h4>
              <p>Crewmates see the fruit, Imposters guess</p>
            </div>
            <div className="rule-card">
              <div className="rule-icon">4</div>
              <h4>Vote & Discuss</h4>
              <p>Find the imposter through discussion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
