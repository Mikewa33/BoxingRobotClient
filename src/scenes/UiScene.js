import * as Phaser from 'phaser';

export default class UiScene extends Phaser.Scene {
  constructor() {
    super('Ui');
  }

  init() {
    // grab a reference to the game scene
    this.gameScene = this.scene.get('Game');
  }

  create() {
   
  }
}
