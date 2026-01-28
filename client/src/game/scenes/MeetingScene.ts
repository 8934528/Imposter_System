import Phaser from "phaser";

export class MeetingScene extends Phaser.Scene {
  private votes: Map<string, number> = new Map();
  private players: Array<{ id: string; name: string; role: string }> = [];
  private timer!: Phaser.GameObjects.Text;
  private timeRemaining: number = 60;

  constructor() {
    super({ key: "MeetingScene" });
  }

  init(data: {
    players: Array<{ id: string; name: string; role: string }>;
    time?: number;
  }) {
    this.players = data.players || [];
    this.timeRemaining = data.time || 60;
    this.votes.clear();
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0c29);

    // Title
    this.add
      .text(width / 2, 80, "EMERGENCY MEETING", {
        fontSize: "36px",
        color: "#ff5757",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Timer
    this.timer = this.add
      .text(width / 2, 140, `Time: ${this.timeRemaining}s`, {
        fontSize: "24px",
        color: "#FFC107",
      })
      .setOrigin(0.5);

    // Voting area
    this.add
      .rectangle(width / 2, height / 2 + 50, 600, 300, 0x000000, 0.3)
      .setStrokeStyle(2, 0x4caf50);

    this.add
      .text(width / 2, height / 2 - 100, "VOTE FOR IMPOSTER", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Display players for voting
    this.displayPlayers();

    // Start timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  displayPlayers() {
    const { width, height } = this.cameras.main;
    const startX = width / 2 - 250;
    const startY = height / 2 - 50;

    this.players.forEach((player, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * 200;
      const y = startY + row * 80;

      // Player box
      const playerBox = this.add
        .rectangle(x, y, 180, 70, 0x393e46)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x4caf50);

      // Player info
      this.add.text(x - 70, y - 15, player.name, {
        fontSize: "16px",
        color: "#ffffff",
      });

      const votesText = this.add.text(x - 70, y + 10, "Votes: 0", {
        fontSize: "14px",
        color: "#FFC107",
      });

      // Store reference to votes text
      playerBox.setData("playerId", player.id);
      playerBox.setData("votesText", votesText);

      // Vote button
      const voteButton = this.add
        .rectangle(x + 50, y, 60, 30, 0x4caf50)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(x + 50, y, "Vote", {
          fontSize: "14px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Vote functionality
      voteButton.on("pointerdown", () => {
        this.voteForPlayer(player.id);
        this.updateVoteDisplay();
        this.events.emit("vote-submitted", player.id);
      });

      voteButton.on("pointerover", () => voteButton.setFillStyle(0x45a049));
      voteButton.on("pointerout", () => voteButton.setFillStyle(0x4caf50));
    });
  }

  voteForPlayer(playerId: string) {
    const currentVotes = this.votes.get(playerId) || 0;
    this.votes.set(playerId, currentVotes + 1);
  }

  updateVoteDisplay() {
    this.children.each((child) => {
      if (
        child instanceof Phaser.GameObjects.Rectangle &&
        child.getData("playerId")
      ) {
        const playerId = child.getData("playerId");
        const votesText = child.getData("votesText") as Phaser.GameObjects.Text;
        const votes = this.votes.get(playerId) || 0;
        votesText.setText(`Votes: ${votes}`);
      }
    });
  }

  updateTimer() {
    this.timeRemaining--;
    this.timer.setText(`Time: ${this.timeRemaining}s`);

    if (this.timeRemaining <= 0) {
      this.endMeeting();
    }
  }

  endMeeting() {
    // Find player with most votes
    let maxVotes = 0;
    let votedOutPlayerId = "";

    this.votes.forEach((votes, playerId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        votedOutPlayerId = playerId;
      }
    });

    this.events.emit("meeting-ended", {
      votedOutPlayerId,
      votes: this.votes,
    });

    this.scene.stop();
  }

  getVotingResults() {
    return Array.from(this.votes.entries()).map(([playerId, votes]) => ({
      playerId,
      votes,
    }));
  }
}
