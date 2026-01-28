import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private otherPlayers!: Phaser.Physics.Arcade.Group;
  private fruitText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background with grid
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Draw grid lines
    const graphics = this.add.graphics({
      lineStyle: { width: 1, color: 0x393e46 },
    });

    for (let x = 0; x <= width; x += 50) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 50) {
      graphics.lineBetween(0, y, width, y);
    }

    // Create player
    this.player = this.physics.add.sprite(width / 2, height / 2, "player");
    this.player.setDisplaySize(40, 40);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(0x4caf50);

    // Create other players group
    this.otherPlayers = this.physics.add.group();

    // Setup keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Fruit display
    this.fruitText = this.add
      .text(width / 2, 50, "Fruit: ???", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#00000050",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);

    // UI elements
    this.add.text(20, 20, "Wrong Fruit", {
      fontSize: "20px",
      color: "#4CAF50",
    });

    // Task markers (placeholder)
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, width - 100);
      const y = Phaser.Math.Between(100, height - 100);
      const task = this.add.circle(x, y, 20, 0x2196f3);
      task.setStrokeStyle(2, 0xffffff);
      task.setInteractive({ useHandCursor: true });

      task.on("pointerover", () => task.setFillStyle(0x1976d2));
      task.on("pointerout", () => task.setFillStyle(0x2196f3));
      task.on("pointerdown", () => {
        this.events.emit("task-complete", i);
        task.destroy();
      });
    }
  }

  update() {
    // Player movement
    const speed = 200;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }

    // Normalize diagonal movement
    if (
      (this.cursors.left.isDown || this.cursors.right.isDown) &&
      (this.cursors.up.isDown || this.cursors.down.isDown)
    ) {
      // Reduce speed for diagonal movement
      if (this.player.body) {
        this.player.setVelocity(
          this.player.body.velocity.x * Math.SQRT1_2,
          this.player.body.velocity.y * Math.SQRT1_2
        );
      }
    }
  }

  setFruit(fruit: string) {
    this.fruitText.setText(`Fruit: ${fruit}`);
  }

  addOtherPlayer(playerId: string, x: number, y: number) {
    const player = this.otherPlayers.create(x, y, "player");
    player.setDisplaySize(40, 40);
    player.setTint(0xff5722);
    player.setData("id", playerId);
    return player;
  }

  moveOtherPlayer(playerId: string, x: number, y: number) {
    const player = this.otherPlayers
      .getChildren()
      .find(
        (p: Phaser.GameObjects.GameObject) =>
          (p as Phaser.Physics.Arcade.Sprite).getData("id") === playerId,
      ) as Phaser.Physics.Arcade.Sprite;

    if (player) {
      player.setPosition(x, y);
    }
  }

  removeOtherPlayer(playerId: string) {
    const player = this.otherPlayers
      .getChildren()
      .find(
        (p: Phaser.GameObjects.GameObject) =>
          (p as Phaser.Physics.Arcade.Sprite).getData("id") === playerId,
      ) as Phaser.Physics.Arcade.Sprite;

    if (player) {
      player.destroy();
    }
  }
}
