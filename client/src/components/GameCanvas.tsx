import React, { useState } from "react";
import { useGameState } from "../services/socket";
import {
  FaUserSecret,
  FaUsers,
  FaClock,
  FaCheck,
  FaTimes,
  FaVoteYea,
  FaComment,
  FaAppleAlt,
} from "react-icons/fa";
import "../styles/components/GameCanvas.css";

interface GameCanvasProps {
  setGameState: (state: "lobby" | "playing") => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ setGameState }) => {
  const {
    gameState,
    currentPlayer,
    roomCode,
    submitWord,
    vote,
    error,
    setError,
  } = useGameState();
  const [word, setWord] = useState("");
  const [selectedVote, setSelectedVote] = useState<string>("");

  if (!gameState || !currentPlayer) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  const renderFruitSelection = () => (
    <div className="game-phase">
      <div className="phase-header">
        <h2>
          <FaAppleAlt /> Round {gameState.currentRound} of {gameState.maxRounds}
        </h2>
        <div className="timer">
          <FaClock /> No time limit
        </div>
      </div>

      <div className="fruit-reveal">
        <div className="fruit-card">
          <div className="fruit-icon">🍉</div>
          <div className="fruit-info">
            <h3>The Fruit Is...</h3>
            {currentPlayer.isImposter ? (
              <div className="imposter-view">
                <FaUserSecret size={48} color="#FF5722" />
                <p>
                  You are the <span className="imposter-text">IMPOSTER</span>
                </p>
                <p className="hint">
                  Wait for crewmates to describe the fruit first
                </p>
              </div>
            ) : (
              <div className="crewmate-view">
                <h1 className="fruit-name">{gameState.fruit}</h1>
                <p>Describe this fruit with ONE WORD</p>
              </div>
            )}
          </div>
        </div>

        <div className="player-role">
          <div
            className={`role-badge ${currentPlayer.isImposter ? "imposter" : "crewmate"}`}
          >
            {currentPlayer.isImposter ? (
              <>
                <FaUserSecret /> IMPOSTER
              </>
            ) : (
              <>
                <FaUsers /> CREWMATE
              </>
            )}
          </div>
          <p>
            {currentPlayer.isImposter
              ? "You don't know the fruit. Listen to others and blend in!"
              : "You see the fruit. Think of a good one-word description!"}
          </p>
        </div>

        <button
          onClick={() => {
            if (currentPlayer.isImposter) {
              setError("Imposters must wait for crewmates to submit first");
              return;
            }
            // Move to word input
            gameState.state = "word-input";
          }}
          className="next-phase-btn"
        >
          Ready to Describe →
        </button>
      </div>

      <div className="players-status">
        <h4>
          <FaUsers /> Players (
          {gameState.players.filter((p) => p.isAlive).length} alive)
        </h4>
        <div className="players-list">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`player-status ${!player.isAlive ? "eliminated" : ""}`}
            >
              <span className="player-name">
                {player.name} {player.id === currentPlayer.id && "(You)"}
              </span>
              <span
                className={`player-role-badge ${player.isImposter ? "imposter" : "crewmate"}`}
              >
                {player.isImposter ? "👹" : "🍓"}
              </span>
              {!player.isAlive && (
                <span className="eliminated-tag">ELIMINATED</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWordInput = () => (
    <div className="game-phase">
      <div className="phase-header">
        <h2>
          <FaComment /> Describe the Fruit
        </h2>
        <div className="timer">
          <FaClock /> Think carefully!
        </div>
      </div>

      <div className="word-input-container">
        {currentPlayer.isImposter ? (
          <div className="imposter-instructions">
            <FaUserSecret size={64} color="#FF5722" />
            <h3>You are the Imposter!</h3>
            <p>
              You don't know the fruit. Wait for at least one crewmate to submit
              their word first.
            </p>
            <p>
              Then, try to blend in by submitting a word that fits with their
              descriptions.
            </p>

            <div className="crewmate-words">
              <h4>Crewmate Words:</h4>
              {gameState.players
                .filter((p) => !p.isImposter && p.hasSubmittedWord)
                .map((player) => (
                  <div key={player.id} className="submitted-word">
                    <span className="player-name">{player.name}:</span>
                    <span className="word">{player.word}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="crewmate-instructions">
            <h3>
              The fruit is:{" "}
              <span className="fruit-highlight">{gameState.fruit}</span>
            </h3>
            <p>Think of ONE WORD that describes this fruit well.</p>
            <p>Be creative but not too obvious!</p>
          </div>
        )}

        <div className="word-input-form">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter ONE word..."
            maxLength={20}
            disabled={
              currentPlayer.isImposter &&
              !gameState.players.some(
                (p) => !p.isImposter && p.hasSubmittedWord,
              )
            }
          />
          <button
            onClick={() => {
              if (!word.trim()) {
                setError("Please enter a word");
                return;
              }
              if (word.trim().split(" ").length > 1) {
                setError("Only ONE word please!");
                return;
              }
              submitWord(word.trim());
              setWord("");
            }}
            disabled={
              currentPlayer.isImposter &&
              !gameState.players.some(
                (p) => !p.isImposter && p.hasSubmittedWord,
              )
            }
            className="submit-word-btn"
          >
            <FaCheck /> Submit Word
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="submission-status">
          <h4>
            Submitted (
            {gameState.players.filter((p) => p.hasSubmittedWord).length}/
            {gameState.players.filter((p) => p.isAlive).length})
          </h4>
          <div className="submitted-players">
            {gameState.players
              .filter((p) => p.isAlive)
              .map((player) => (
                <div key={player.id} className="submitted-player">
                  <span className="player-name">{player.name}</span>
                  {player.hasSubmittedWord ? (
                    <span className="status submitted">
                      <FaCheck /> Ready
                    </span>
                  ) : (
                    <span className="status pending">
                      <FaClock /> Thinking...
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiscussion = () => (
    <div className="game-phase">
      <div className="phase-header">
        <h2>
          <FaComment /> Discussion Time
        </h2>
        <div className="timer">
          <FaClock /> {gameState.timer}s remaining
        </div>
      </div>

      <div className="discussion-container">
        <div className="revealed-words">
          <h3>Words Submitted:</h3>
          <div className="words-grid">
            {gameState.players
              .filter((p) => p.isAlive && p.word)
              .map((player) => (
                <div key={player.id} className="word-card">
                  <div className="word-header">
                    <span className="player-name">{player.name}</span>
                    {player.id === currentPlayer.id && (
                      <span className="you-tag">(You)</span>
                    )}
                  </div>
                  <div className="word-content">{player.word}</div>
                  <div
                    className={`word-footer ${player.isImposter ? "imposter" : "crewmate"}`}
                  >
                    {player.isImposter ? "👹 Imposter" : "🍓 Crewmate"}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="discussion-guide">
          <h3>💬 Discussion Points:</h3>
          <ul>
            <li>Which words don't seem to match the fruit?</li>
            <li>Who might be the imposter based on their word?</li>
            <li>Is anyone being too vague or suspicious?</li>
            <li>Remember: Imposters see your words before submitting!</li>
          </ul>

          <div className="chat-box">
            <textarea placeholder="Type your discussion points here... (not sent to others)" />
            <small>
              Note: This is just for your notes. Discuss verbally or in your
              voice chat!
            </small>
          </div>
        </div>

        <button
          onClick={() => {
            // Move to voting
            gameState.state = "voting";
          }}
          className="next-phase-btn"
        >
          Ready to Vote →
        </button>
      </div>
    </div>
  );

  const renderVoting = () => (
    <div className="game-phase">
      <div className="phase-header">
        <h2>
          <FaVoteYea /> Voting Time
        </h2>
        <div className="timer">
          <FaClock /> {gameState.timer}s remaining
        </div>
      </div>

      <div className="voting-container">
        <div className="voting-instructions">
          <h3>Vote for who you think is the Imposter:</h3>
          <p>Click on a player to select them, then confirm your vote.</p>
        </div>

        <div className="players-to-vote">
          {gameState.players
            .filter((p) => p.isAlive)
            .map((player) => (
              <div
                key={player.id}
                className={`vote-player-card ${selectedVote === player.id ? "selected" : ""}`}
                onClick={() => setSelectedVote(player.id)}
              >
                <div className="vote-player-info">
                  <span className="player-name">{player.name}</span>
                  {player.id === currentPlayer.id && (
                    <span className="you-tag">(You)</span>
                  )}
                </div>
                <div className="player-word">
                  Word: {player.word || "No word"}
                </div>
                <div className="vote-count">Votes: {player.votes}</div>
                {selectedVote === player.id && (
                  <div className="selected-indicator">
                    <FaCheck /> Selected
                  </div>
                )}
              </div>
            ))}
        </div>

        <div className="voting-controls">
          <button
            onClick={() => {
              if (!selectedVote) {
                setError("Please select a player to vote for");
                return;
              }
              if (selectedVote === currentPlayer.id) {
                setError("You cannot vote for yourself");
                return;
              }
              vote(selectedVote);
              setSelectedVote("");
            }}
            className="submit-vote-btn"
            disabled={!selectedVote}
          >
            <FaVoteYea /> Submit Vote
          </button>
          <button
            onClick={() => setSelectedVote("")}
            className="clear-vote-btn"
          >
            <FaTimes /> Clear Selection
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="voting-status">
          <h4>
            Votes Cast ({gameState.players.filter((p) => p.votes > 0).length}/
            {gameState.players.filter((p) => p.isAlive).length})
          </h4>
          <div className="votes-list">
            {gameState.players
              .filter((p) => p.votes > 0)
              .map((player) => (
                <div key={player.id} className="vote-record">
                  <span className="player-name">{player.name}:</span>
                  <span className="vote-count">
                    {player.votes} vote{player.votes !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="game-phase">
      <div className="phase-header">
        <h2>🏆 Round Results</h2>
      </div>

      <div className="results-container">
        <div className="fruit-reveal-card">
          <div className="fruit-icon-large">🍉</div>
          <div className="fruit-details">
            <h3>The fruit was:</h3>
            <h1 className="fruit-name-large">{gameState.fruit}</h1>
          </div>
        </div>

        <div className="words-reveal">
          <h3>All Words:</h3>
          <table className="words-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Word</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {gameState.players.map((player) => (
                <tr
                  key={player.id}
                  className={player.isImposter ? "imposter-row" : ""}
                >
                  <td>
                    {player.name}
                    {player.id === currentPlayer.id && " (You)"}
                    {!player.isAlive && " ☠️"}
                  </td>
                  <td>{player.word || "No word"}</td>
                  <td>
                    <span
                      className={`role-tag ${player.isImposter ? "imposter" : "crewmate"}`}
                    >
                      {player.isImposter ? "👹 IMPOSTER" : "🍓 CREWMATE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="game-outcome">
          <h3>Outcome:</h3>
          <div className="outcome-card">
            {gameState.players.some((p) => p.isImposter && !p.isAlive) ? (
              <>
                <div className="outcome-icon win">🏆</div>
                <h2 className="win-text">CREWMATES WIN!</h2>
                <p>The imposter was found and eliminated!</p>
              </>
            ) : gameState.currentRound > gameState.maxRounds ? (
              <>
                <div className="outcome-icon lose">💀</div>
                <h2 className="lose-text">IMPOSTER WINS!</h2>
                <p>The imposter survived all rounds!</p>
              </>
            ) : (
              <>
                <div className="outcome-icon continue">🔄</div>
                <h2 className="continue-text">NEXT ROUND!</h2>
                <p>The game continues to round {gameState.currentRound + 1}</p>
              </>
            )}
          </div>
        </div>

        <div className="results-controls">
          <button
            onClick={() => setGameState("lobby")}
            className="back-to-lobby-btn"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );

  const renderGamePhase = () => {
    switch (gameState.state) {
      case "fruit-selection":
        return renderFruitSelection();
      case "word-input":
        return renderWordInput();
      case "discussion":
        return renderDiscussion();
      case "voting":
        return renderVoting();
      case "results":
        return renderResults();
      default:
        return (
          <div className="waiting-phase">
            <h2>Waiting for game to start...</h2>
            <button onClick={() => setGameState("lobby")}>Back to Lobby</button>
          </div>
        );
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="header-left">
          <h2>🍉 Wrong Fruit</h2>
          <div className="room-info">
            Room: <span className="room-code">{roomCode}</span>
            <span className="round-info">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div
            className={`player-role-display ${currentPlayer.isImposter ? "imposter" : "crewmate"}`}
          >
            {currentPlayer.isImposter ? (
              <>
                <FaUserSecret /> You are the IMPOSTER
              </>
            ) : (
              <>
                <FaUsers /> You are a CREWMATE
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to leave the game?")) {
                setGameState("lobby");
              }
            }}
            className="leave-game-btn"
          >
            Leave Game
          </button>
        </div>
      </div>

      <div className="game-content">{renderGamePhase()}</div>

      <div className="game-footer">
        <div className="alive-players">
          <FaUsers /> {gameState.players.filter((p) => p.isAlive).length}{" "}
          players alive
        </div>
        <div className="game-phase-indicator">
          Phase:{" "}
          <span className="phase-name">
            {gameState.state.replace("-", " ").toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
