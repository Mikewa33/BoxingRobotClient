import * as Phaser from 'phaser';
import UiButton from '../classes/UiButton';
import RobotCard from '../classes/RobotCard';
import PartCard from '../classes/PartCard';
import { getData, getCookie } from '../utils/utils';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.scene.launch('Ui');
    // We track these for the whole game cause they are needed everywhere
    this.robots = [];
    this.parts = [];
    this.inventorySelect = "ROBOTS";
    this.selectorIndex = 0;

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
    this.add.image(0, 0, 'background').setOrigin(0,0).setScale(1.5);
    this.add.image(40, this.scale.height - 150, 'inventoryBackground').setOrigin(0,0).setScale(0.25);
    this.createUi();
    this.createAudio();
    this.createGroups();
    this.createInput();
    this.getUserBots();
    // emit event to server that a new player joined
    this.socket.emit('newPlayer', getCookie('jwt'));
    console.log(getCookie('jwt'))
  }

  update() {
  }

  getUserBots() {
    game = this
    
    getData(`${SERVER_URL}/inventory`).then((response) => {
      if (response.status == 200) {
        game.load.on('start', () => {
          response.inventory.default.robots.forEach(robot => {
            game.load.spritesheet(robot.id.toString(), robot.image, { frameWidth: 64, frameHeight: 84 });          
          })
          
          response.inventory.default.parts.forEach(part => {
            game.load.spritesheet(part.id.toString(), part.image, { frameWidth: 64, frameHeight: 64 });
            
          })
        });

        game.load.on('complete', () => {
          response.inventory.default.robots.forEach(robot => {
            let robotCard = new RobotCard(game, 120, this.scale.height - 80,robot.id.toString(), 0, robot.id)
            robotCard.makeInvisible()
            game.robots.push(robotCard)
            
          })
  
          response.inventory.default.parts.forEach(part => {
            let partCard = new PartCard(game, 0, 0 ,part.id.toString(), 0, part.id);
            partCard.makeInvisible()
            game.parts.push(partCard)
            console.log(game.parts)
          })

          game.createCarousel(game.selectorIndex);
        });

        game.load.start()
      }
    });
  }

  createUi() {
    this.trainingButton = new UiButton(
      this,
      this.scale.width - 150,
      this.scale.height * 0.05,
      'button1',
      'button2',
      'Training',
      null,
      0.8,
    );

    this.boxingButton = new UiButton(
      this,
      this.scale.width / 2,
      this.scale.height * 0.05,
      'button1',
      'button2',
      'Boxing',
      null,
      0.8,
    );

    this.shopButton = new UiButton(
      this,
      150,
      this.scale.height * 0.05,
      'button1',
      'button2',
      'Bot Shop',
      null,
      0.8
    );

    this.partsInventoryButton = new UiButton(
      this,
      this.scale.width - 150,
      this.scale.height - 150,
      'button1',
      'button2',
      'Parts',
      null,
      0.8
    );

    this.robotInventoryButton = new UiButton(
      this,
      150,
      this.scale.height - 150,
      'button1',
      'button2',
      'Robots',
      null,
      0.8
    );
  }

  createAudio() {
  }

  createGroups() {
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  createCarousel(index) {
    let x = 120
    let groupSelect = null
    if(this.inventorySelect == "ROBOTS") {
      groupSelect = this.robots;
    }
    else {
      groupSelect = this.parts;
    }
    console.log(this)
    console.log(groupSelect)
    for(var i = index;i < index + 3; i++) {
      groupSelect[i].setPosition(x, this.scale.height - 80);
      groupSelect[i].makeVisible();
      x = x + 120;
    }
  }
}
