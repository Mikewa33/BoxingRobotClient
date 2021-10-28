import * as Phaser from 'phaser';
import { getCookie } from '../utils/utils';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.scene.launch('Ui');

    // get a reference to our socket
    this.socket = this.sys.game.globals.socket;

    // listen for socket event
    this.listenForSocketEvents();
  }

  listenForSocketEvents() {
    this.socket.on('disconnect', (playerId) => {
      this.otherPlayers.getChildren().forEach((player) => {
        if (playerId === player.id) {
          player.cleanUp();
        }
      });
    });

    this.socket.on('invalidToken', () => {
      window.alert('Token is no longer valid. Please login again.');
      window.location.reload();
    });
  }

  create() {
    this.createAudio();
    this.createGroups();
    this.createInput();

    // emit event to server that a new player joined
    this.socket.emit('newPlayer', getCookie('jwt'));
  }

  update() {
  }

  createAudio() {
  }

  createGroups() {
  }


  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }
}
