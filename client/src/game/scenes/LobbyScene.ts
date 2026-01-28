import Phaser from "phaser";

export class LobbyScene extends Phaser.Scene {
  private roomCodeText!: Phaser.GameObjects.Text;
  private players: Array<{ name: string; ready: boolean }> = [];

  constructor() {
    super({ key: "LobbyScene" });
  }

  init(data: { players?: Array<{ name: string; ready: boolean }> }) {
    this.players = data.players || [];
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add
      .text(width / 2, 100, "WRONG FRUIT", {
        fontSize: "48px",
        color: "#4CAF50",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Room Code
    this.roomCodeText = this.add
      .text(width / 2, 180, "Room: ABC123", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Player List Area
    this.add
      .rectangle(width / 2, height / 2 + 50, 400, 300, 0x000000, 0.3)
      .setStrokeStyle(2, 0x4caf50);

    this.add.text(
      width / 2 - 180,
      height / 2 - 100,
      "Players:",
      {
        fontSize: "20px",
        color: "#ffffff",
      },
    );

    // Update player list
    this.updatePlayerList();

    // Ready Button
    const readyButton = this.add
      .rectangle(width / 2, height - 100, 200, 50, 0x4caf50)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height - 100, "Ready", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    readyButton.on("pointerdown", () => {
      readyButton.setFillStyle(0x45a049);
      this.events.emit("player-ready");
    });

    readyButton.on("pointerover", () => readyButton.setFillStyle(0x45a049));
    readyButton.on("pointerout", () => readyButton.setFillStyle(0x4caf50));

    // Instructions
    this.add
      .text(width / 2, height - 30, "Waiting for players...", {
        fontSize: "16px",
        color: "#cccccc",
      })
      .setOrigin(0.5);
  }

  updatePlayerList() {
    const playerListY = this.cameras.main.height / 2 - 70;

    // Clear previous player texts
    this.children.list.forEach((child) => {
      if (
        child instanceof Phaser.GameObjects.Text &&
        (child.text.includes("👤") || child.text.includes("✓"))
      ) {
        child.destroy();
      }
    });

    // Display players
    this.players.forEach((player, index) => {
      const playerText = `${player.ready ? "✓" : "👤"} ${player.name}`;
      this.add.text(
        this.cameras.main.width / 2 - 150,
        playerListY + index * 30,
        playerText,
        {
          fontSize: "18px",
          color: player.ready ? "#4CAF50" : "#ffffff",
        },
      );
    });
  }

  setRoomCode(code: string) {
    this.roomCodeText.setText(`Room: ${code}`);
  }

  setPlayers(players: Array<{ name: string; ready: boolean }>) {
    this.players = players;
    this.updatePlayerList();
  }
}
