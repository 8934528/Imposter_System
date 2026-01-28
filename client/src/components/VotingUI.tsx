import React from "react";
import { FaVoteYea, FaTimes, FaClock } from "react-icons/fa";
import "../styles/components/VotingUI.css";

interface PlayerVote {
  id: string;
  name: string;
  role: "crewmate" | "imposter";
  votes: number;
  isAlive: boolean;
}

interface VotingUIProps {
  players: PlayerVote[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  onSubmitVote: () => void;
  onClearSelection: () => void;
  timer?: number;
  canVote?: boolean;
}

const VotingUI: React.FC<VotingUIProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onSubmitVote,
  onClearSelection,
  timer = 60,
  canVote = true,
}) => {
  const alivePlayers = players.filter((player) => player.isAlive);

  return (
    <div className="voting-ui">
      <div className="voting-header">
        <h3>Vote for the Imposter</h3>
        <p>Select who you think is the imposter and submit your vote</p>
      </div>

      <div className="voting-grid">
        {alivePlayers.map((player) => (
          <div
            key={player.id}
            className={`vote-option ${selectedPlayerId === player.id ? "selected" : ""}`}
            onClick={() => canVote && onSelectPlayer(player.id)}
          >
            <div className="vote-player-avatar">
              {player.role === "imposter" ? "👹" : "🍓"}
            </div>
            <div className="vote-player-name">{player.name}</div>
            <div className="vote-player-role">
              {player.role === "imposter" ? "Imposter" : "Crewmate"}
            </div>
            <div className="vote-player-votes">
              {player.votes} vote{player.votes !== 1 ? "s" : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="voting-controls">
        <button
          className="submit-vote-btn"
          onClick={onSubmitVote}
          disabled={!selectedPlayerId || !canVote}
        >
          <FaVoteYea /> Submit Vote
        </button>
        <button
          className="clear-vote-btn"
          onClick={onClearSelection}
          disabled={!selectedPlayerId || !canVote}
        >
          <FaTimes /> Clear Selection
        </button>
      </div>

      <div className="voting-results">
        <h4>Current Votes</h4>
        <div className="results-list">
          {players
            .filter((player) => player.votes > 0)
            .map((player) => (
              <div key={player.id} className="result-item">
                <div className="result-player">
                  <span>{player.name}</span>
                  <span className="player-role-badge">
                    {player.role === "imposter" ? "👹" : "🍓"}
                  </span>
                </div>
                <div className="result-votes">
                  {player.votes} vote{player.votes !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          {players.filter((player) => player.votes > 0).length === 0 && (
            <div className="result-item">
              <span>No votes yet</span>
            </div>
          )}
        </div>
      </div>

      <div className="voting-timer">
        <FaClock /> Voting ends in: {timer}s
      </div>

      <div className="voting-instruction">
        {canVote
          ? "Select a player and submit your vote before time runs out!"
          : "You have already voted. Waiting for other players..."}
      </div>
    </div>
  );
};

export default VotingUI;
