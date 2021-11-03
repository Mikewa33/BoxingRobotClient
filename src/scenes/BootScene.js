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
  }

  loadSpriteSheets() {
  }

  loadAudio() {
  }

  create() {
    this.scene.start('Title');
  }
}
