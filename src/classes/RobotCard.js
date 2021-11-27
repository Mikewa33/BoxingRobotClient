import * as Phaser from 'phaser';

export default class RobotCard extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, key, frame, id, ai, agility, health, defense, strength) {
    super(scene, x, y, key, frame);
    this.scene = scene; // the scene this game object will be added to
    this.id = id;
    this.ai = ai;
    this.agility = agility;
    this.health = health;
    this.defense = defense;
    this.strength = strength;
    this.type = "Robot";


    // add the player to our existing scene
    this.scene.add.existing(this).setInteractive();
    // scale the game object
    this.setScale(0.05);
  }

  makeActive() {
    this.setActive(true);
    this.setVisible(true);
  }

  makeInactive() {
    this.setActive(false);
    this.setVisible(false);
  }

  makeInvisible() {
    this.setVisible(false);
  }

  makeVisible() {
    this.setVisible(true);
  }
}
