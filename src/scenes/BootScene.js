import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // load images
    this.loadImages();
    // load spritesheets
    this.loadSpriteSheets();
    // load audio
    this.loadAudio();
  }

  loadImages() {
    this.load.image('button1', 'assets/images/ui/blue_button01.png');
    this.load.image('button2', 'assets/images/ui/blue_button02.png');
    // load the map tileset image
    this.load.image('background', 'assets/level/background-image.jpg');
    this.load.image('inventoryBackground', 'assets/images/ui/panel_dialogue.png');
    this.load.image('nextButton', 'assets/images/ui/next_button.png');
  }

  loadSpriteSheets() {
    this.load.spritesheet("Tank", "assets/images/sprites/robot_0.png", { frameWidth: 2080, frameHeight: 2080 });
    this.load.spritesheet("Speedy", "assets/images/sprites/robot_1.png", { frameWidth: 2080, frameHeight: 2080 }); 
    this.load.spritesheet("Defender", "assets/images/sprites/robot_2.png", { frameWidth: 2080, frameHeight: 2080 }); 
    this.load.spritesheet("Attacker", "assets/images/sprites/robot_3.png", { frameWidth: 2080, frameHeight: 2080 });
    this.load.spritesheet("Saw", "assets/images/sprites/accessory_0.png", { frameWidth: 2080, frameHeight: 2080 });
    this.load.spritesheet("Sword", "assets/images/sprites/accessory_1.png", { frameWidth: 2080, frameHeight: 2080 });
    this.load.spritesheet("Shield", "assets/images/sprites/accessory_2.png", { frameWidth: 2080, frameHeight: 2080 });
    this.load.spritesheet("AI Chip", "assets/images/sprites/accessory_3.png", { frameWidth: 2080, frameHeight: 2080 });
  }

  loadAudio() {
  }

  create() {
    this.scene.start('Title');
  }
}
