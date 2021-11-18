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
    this.robotsInventory = [];
    this.parts = [];
    this.inventorySelect = "ROBOTS";
    this.selectorIndex = 0;
    this.currentDisplay = "NONE"
    this.shopDisplay = [];
    this.shopDispayMenu = "ROBOTS";
    this.trainingItem = null;
    this.battleDisplay = null;

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
    this.createShop();
    this.createTraining();
    this.createTournaments();

    this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX;
      gameObject.y = dragY;
    })

    this.input.on('dragenter', function (pointer, gameObject, dropZone) {
      dropZone.graphics.lineStyle(2, 0x00ffff);
      dropZone.graphics.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height);
    });

    this.input.on('dragleave', function (pointer, gameObject, dropZone) {
      dropZone.graphics.lineStyle(2, 0xffff00);
      dropZone.graphics.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height);
    });

    this.input.on('drop', function (pointer, gameObject, dropZone) {
        gameObject.x = dropZone.x;
        gameObject.y = dropZone.y;

        if(dropZone.name == "Inventory") {
          if (game.trainingItem.id == gameObject.id) {
            game.trainingItem = null;
          }
          game.robotsInventory.push(gameObject)
          game.reorderCarousel(game);
        } else if(dropZone.name == "Training") {
          if (game.trainingItem != null) {
            game.robotsInventory.push(game.trainingItem);
          }
          game.trainingItem = gameObject;
          game.robotsInventory = game.robotsInventory.filter(el => el.id != gameObject.id);
          game.reorderCarousel(game);
        }
    });

    this.input.on('dragend', function (pointer, gameObject, dropped) {
        if (!dropped)
        {
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        }

        //dropZone.graphics.clear();
        //dropZone.graphics.lineStyle(2, 0xffff00);
        //dropZone.graphics.strokeRect(this.trainingDropZone.x - this.trainingDropZone.input.hitArea.width / 2, this.trainingDropZone.y - this.trainingDropZone.input.hitArea.height / 2, this.trainingDropZone.input.hitArea.width, this.trainingDropZone.input.hitArea.height);

    });
     // emit event to server that a new player joined
    this.socket.emit('newPlayer', getCookie('jwt'));
  }

  update() {
  }

  createTraining() {
    //  A drop zone
    this.trainingDropZone = this.add.zone(400, 250, 300, 300).setRectangleDropZone(300, 300);
    this.trainingDropZone.setName("Training").setVisible(false);
    this.trainingDropZoneGraphics = this.add.graphics();
    
    this.trainingDropZoneGraphics.lineStyle(2, 0xffff00);
    this.trainingDropZoneGraphics.strokeRect(this.trainingDropZone.x - this.trainingDropZone.input.hitArea.width / 2, this.trainingDropZone.y - this.trainingDropZone.input.hitArea.height / 2, this.trainingDropZone.input.hitArea.width, this.trainingDropZone.input.hitArea.height);
    this.trainingDropZone.graphics = this.trainingDropZoneGraphics.setVisible(false);

    this.trainingSubmitButton = new UiButton(
      this,
      this.scale.width / 2,
      this.scale.height * 0.65,
      'button1',
      'button2',
      'Start Training',
      null,
      1.4,
    ).setVisible(false);
  }

  createTournaments() {
    this.tournamentDropZone = this.add.zone(400, 250, 300, 300).setRectangleDropZone(300, 300);
    this.tournamentDropZone.setName("Tournaments");
    this.tournamentDropZoneGraphics = this.add.graphics();
    
    this.tournamentDropZoneGraphics.lineStyle(2, 0xffff00);
    this.tournamentDropZoneGraphics.strokeRect(this.tournamentDropZone.x - this.tournamentDropZone.input.hitArea.width / 2, this.tournamentDropZone.y - this.tournamentDropZone.input.hitArea.height / 2, this.tournamentDropZone.input.hitArea.width, this.tournamentDropZone.input.hitArea.height);
    this.tournamentDropZone.graphics = this.tournamentropZoneGraphics;

    this.partsOneDropZone = this.add.zone(150, 250, 100, 100).setRectangleDropZone(100, 100);
    this.partsOneDropZone.setName("Parts 1");
    this.partsOneDropZoneGraphics = this.add.graphics();
    
    this.partsOneDropZoneGraphics.lineStyle(2, 0xffff00);
    this.partsOneDropZoneGraphics.strokeRect(this.partsOneDropZone.x - this.partsOneDropZone.input.hitArea.width / 2, this.partsOneDropZone.y - this.partsOneDropZone.input.hitArea.height / 2, this.partsOneDropZone.input.hitArea.width, this.partsOneDropZone.input.hitArea.height);
    this.partsOneDropZone.graphics = this.partsOneZoneGraphics;

    this.partsTwoDropZone = this.add.zone(650, 250, 100, 100).setRectangleDropZone(100, 100);
    this.partsTwoDropZone.setName("Parts 2");
    this.partsTwoDropZoneGraphics = this.add.graphics();
    
    this.partsTwoDropZoneGraphics.lineStyle(2, 0xffff00);
    this.partsTwoDropZoneGraphics.strokeRect(this.partsTwoDropZone.x - this.partsTwoDropZone.input.hitArea.width / 2, this.partsTwoDropZone.y - this.partsTwoDropZone.input.hitArea.height / 2, this.partsTwoDropZone.input.hitArea.width, this.partsTwoDropZone.input.hitArea.height);
    this.partsTwoDropZone.graphics = this.partsTwoDropZoneGraphics;

    this.tournamentSubmitButton = new UiButton(
      this,
      this.scale.width / 2,
      this.scale.height * 0.65,
      'button1',
      'button2',
      'Start Tournament',
      null,
      1.4,
    );
  }

  createShop() {
    let shopBackground = this.add.rectangle(45, 60, 710, 348, 0x00000).setOrigin(0,0);
    this.shopDisplay.push(shopBackground);
    this.partsShopButton = new UiButton(
      this,
      this.scale.width - 150,
      100,
      'button1',
      'button2',
      'Buy Parts',
      null,
      1
    );
    this.shopDisplay.push(this.partsShopButton);

    this.robotShopButton = new UiButton(
      this,
      150,
      100,
      'button1',
      'button2',
      'Buy Robots',
      null,
      1
    );
    this.shopDisplay.push(this.robotShopButton);
    // TODO - CONNECT NULL TO CRYPTO
    this.buyAttackButton = new UiButton(
      this,
      200,
      200,
      'button1',
      'button2',
      'Attack Robot',
      null,
      1.2
    );
    this.shopDisplay.push(this.buyAttackButton);

    this.buySpeedyButton = new UiButton(
      this,
      this.scale.width - 200,
      200,
      'button1',
      'button2',
      'Speed Robot',
      null,
      1.2
    );
    this.shopDisplay.push(this.buySpeedyButton);

    this.buyDefenderButton = new UiButton(
      this,
      200,
      300,
      'button1',
      'button2',
      'Defender Robot',
      null,
      1.2
    );
    this.shopDisplay.push(this.buyDefenderButton);

    this.buyTankButton = new UiButton(
      this,
      this.scale.width - 200,
      300,
      'button1',
      'button2',
      'Tank Robot',
      null,
      1.2
    );
    this.shopDisplay.push(this.buyTankButton);
    this.shopDisplay.forEach(element => {
      element.setVisible(false);
    })
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
            let robotCard = new RobotCard(game, 120, game.scale.height - 80,robot.id.toString(), 0, robot.id)
            robotCard.makeInvisible();
            robotCard.setName(robot.name);
            game.input.setDraggable(robotCard)
            game.robots.push(robotCard)
            game.robotsInventory.push(robotCard);
          })
  
          response.inventory.default.parts.forEach(part => {
            let partCard = new PartCard(game, 0, 0 ,part.id.toString(), 0, part.id);
            partCard.makeInvisible();
            this.input.setDraggable(partCard)
            game.parts.push(partCard)
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

    let game = this;
    let buttonBack = this.add.sprite(100, this.scale.height - 105, 'nextButton').setOrigin(0,0).setScale(0.5);
    buttonBack.angle = 90;
    buttonBack.setInteractive().on('pointerdown', function(pointer){
      game.moveCarousel(-1, game)
    })

    let buttonForward = this.add.sprite(this.scale.width - 100, this.scale.height - 55, 'nextButton').setOrigin(0,0).setScale(0.5);
    buttonForward.angle = 270;
    buttonForward.setInteractive().on('pointerdown', function(pointer){
      game.moveCarousel(1, game)
    });

    this.inventoryDropZone = this.add.zone(400, this.scale.height - 85, 700, 100).setRectangleDropZone(700, 100);
    this.inventoryDropZone.setName("Inventory");
    this.inventoryDropZoneGraphics = this.add.graphics();
    
    this.inventoryDropZoneGraphics.lineStyle(2, 0xffff00);
    this.inventoryDropZoneGraphics.strokeRect(this.inventoryDropZone.x - this.inventoryDropZone.input.hitArea.width / 2, this.inventoryDropZone.y - this.inventoryDropZone.input.hitArea.height / 2, this.inventoryDropZone.input.hitArea.width, this.inventoryDropZone.input.hitArea.height);
    this.inventoryDropZone.graphics = this.inventoryDropZoneGraphics;
  }

  createAudio() {
  }

  createGroups() {
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  createCarousel(index) {
    let x = 150
    let groupSelect = null
    if(this.inventorySelect == "ROBOTS") {
      groupSelect = this.robots;
    }
    else {
      groupSelect = this.parts;
    }

    for(var i = index;i < index + 3; i++) {
      groupSelect[i].setPosition(x, this.scale.height - 80);
      groupSelect[i].makeVisible();
      groupSelect[i].originalX = groupSelect[i].x
      groupSelect[i].originalY = groupSelect[i].y
      x = x + 120;
    }
  }

  reorderCarousel(game) {
    game.moveCarousel(0, game)
  }

  // Set move zero to zero and invisible
  moveCarousel(indexMove, game) {
    let x = 150
    let groupSelect = null
    if(game.inventorySelect == "ROBOTS") {
      groupSelect = game.robotsInventory;
    }
    else {
      groupSelect = game.parts;
    }

    if(indexMove > 0 && game.selectorIndex < groupSelect.length) {
      game.selectorIndex = game.selectorIndex + 1
    } 

    if(indexMove < 0 && game.selectorIndex > 0) {
      game.selectorIndex = game.selectorIndex - 1
    } 

    for(var i = 0;i < groupSelect.length; i++) {
      if(groupSelect[i] && i < game.selectorIndex + 3) {
        groupSelect[i].setPosition(x, game.scale.height - 80);
        groupSelect[i].makeVisible();
        groupSelect[i].originalX = groupSelect[i].x
        groupSelect[i].originalY = groupSelect[i].y
        x = x + 120;
      }

      else if(groupSelect[i]){
        groupSelect[i].makeInvisible();
      }
    }
  }
}
