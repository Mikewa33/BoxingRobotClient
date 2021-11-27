import * as Phaser from 'phaser';
import UiButton from '../classes/UiButton';
import UiButtonForStore from '../classes/UiButtonForStore';
import RobotCard from '../classes/RobotCard';
import PartCard from '../classes/PartCard';
import { getData, getCookie, postData } from '../utils/utils';
import NFTWallet from '../classes/NFTWallet';

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
    this.botShopDisplay = [];
    this.partsShopDisplay = []
    this.shopDispayMenu = "ROBOTS";
    this.trainingItem = null;
    this.tournamentBot = null;
    this.tournamentPart1 = null;
    this.tournamentPart2 = null;
    this.battleDisplay = null;

    // get a reference to our socket
    this.socket = this.sys.game.globals.socket;

    // listen for socket event
    this.listenForSocketEvents();
    this.nftWallet = new NFTWallet();
    this.nftWallet.setScene(this);
    this.nftWallet.initWeb3();
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
    this.createShop();
    this.createTraining();
    this.createTournaments();
    this.showTraining();
    this.showShop();
    this.showTournaments();
    this.hideShop();
    this.hideTraining();
    this.hideTournaments();

    this.noBots = this.add.text(200, this.scale.height - 100, "Your Bot Inventory Is Empty", { fontSize: '26px', fill: '#fff' });
    this.noBots.setVisible(false);
    this.noParts = this.add.text(200, this.scale.height - 100, "Your Parts Inventory Is Empty", { fontSize: '26px', fill: '#fff' });
    this.noParts.setVisible(false);

    this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX;
      gameObject.y = dragY;
    })

    this.input.on('dragenter', function (pointer, gameObject, dropZone) {
      if ((dropZone.name == "Inventory" || dropZone.name == "Training" || dropZone.name == "Tournaments") && gameObject.type == "Robot") {
        dropZone.graphics.lineStyle(2, 0x00ffff);
        dropZone.graphics.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height);
      }
    });

    this.input.on('dragleave', function (pointer, gameObject, dropZone) {
      if ((dropZone.name == "Inventory" || dropZone.name == "Training" || dropZone.name == "Tournaments") && gameObject.type == "Robot") {
        dropZone.graphics.lineStyle(2, 0xffff00);
        dropZone.graphics.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height);
      }
    });

    this.input.on('drop', function (pointer, gameObject, dropZone) {
        if ((dropZone.name == "Inventory" || dropZone.name == "Training" || dropZone.name == "Tournaments") && gameObject.type == "Robot") {
          gameObject.x = dropZone.x;
          gameObject.y = dropZone.y;
        }
        else if(gameObject.type == "Robot") {
          gameObject.x = gameObject.input.dragStartX;
          gameObject.y = gameObject.input.dragStartY;
        }

        let game = dropZone.scene;

        if(dropZone.name == "Inventory") {
          if (game.trainingItem && game.trainingItem.id == gameObject.id) {
            game.trainingItem = null;
          }
          else if(game.tournamentBot && game.tournamentBot.id == gameObject.id) {
            game.tournamentBot = null;
          }
          game.trainingUi = game.trainingUi.filter(el => el.id != gameObject.id);
          game.tournamentsUi = game.tournamentsUi.filter(el => el.id != gameObject.id);
          game.robotsInventory.push(gameObject)
          game.reorderCarousel(game);
        } else if(dropZone.name == "Training") {
          if (game.trainingItem != null) {
            game.trainingUi = game.trainingUi.filter(el => el.id != game.trainingItem.id);
            game.robotsInventory.push(game.trainingItem);
          }
          game.trainingItem = gameObject;
          game.trainingUi.push(gameObject);
          game.robotsInventory = game.robotsInventory.filter(el => el.id != gameObject.id);
          game.reorderCarousel(game);
        } else if(dropZone.name == "Tournaments") {
          if (game.tournamentBot != null) {
            game.tournamentsUi = game.tournamentsUi.filter(el => el.id != game.tournamentBot.id);
            game.robotsInventory.push(game.tournamentBot);
          }
          game.tournamentBot = gameObject;
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

  showTraining() {
    if (this.trainingUi) {
      this.trainingUi.forEach(element => {
        element.setVisible(true);
      })
    }
  }

  hideTraining() {
    if (this.trainingUi) {
      this.trainingUi.forEach(element => {
        element.setVisible(false);
      })
    }
  }

  createTraining() {
    this.trainingUi = []
    //  A drop zone
    this.trainingDropZone = this.add.zone(400, 250, 300, 300).setRectangleDropZone(300, 300);
    this.trainingDropZone.setName("Training").setVisible(false);
    this.trainingDropZoneGraphics = this.add.graphics();
    
    this.trainingDropZoneGraphics.lineStyle(2, 0xffff00);
    this.trainingDropZoneGraphics.strokeRect(this.trainingDropZone.x - this.trainingDropZone.input.hitArea.width / 2, this.trainingDropZone.y - this.trainingDropZone.input.hitArea.height / 2, this.trainingDropZone.input.hitArea.width, this.trainingDropZone.input.hitArea.height);
    this.trainingDropZone.graphics = this.trainingDropZoneGraphics
    this.trainingUi.push(this.trainingDropZone);
    this.trainingUi.push(this.trainingDropZoneGraphics);

    this.trainingSubmitButton = new UiButton(
      this,
      this.scale.width / 2,
      this.scale.height * 0.65,
      'button1',
      'button2',
      'Start Training',
      this.submitBot,
      1.4,
    )
    this.trainingUi.push(this.trainingSubmitButton);
  };

  submitBot(game) {
    postData(`${SERVER_URL}/training`, { 'botId': game.trainingItem.id }).then((response) => {
      if (response.status == 200) {

      }
    });
  }

  showTournaments() {
    if (this.tournamentsUi) {
      this.tournamentsUi.forEach(element => {
        element.setVisible(true);
      })
    }
  }

  hideTournaments() {
    if (this.tournamentsUi) {
      this.tournamentsUi.forEach(element => {
        element.setVisible(false);
      });
    }
  }

  createTournaments() {
    this.tournamentsUi = []
    this.tournamentDropZone = this.add.zone(400, 250, 300, 300).setRectangleDropZone(300, 300);
    this.tournamentDropZone.setName("Tournaments");
    this.tournamentDropZoneGraphics = this.add.graphics();
    
    this.tournamentDropZoneGraphics.lineStyle(2, 0xffff00);
    this.tournamentDropZoneGraphics.strokeRect(this.tournamentDropZone.x - this.tournamentDropZone.input.hitArea.width / 2, this.tournamentDropZone.y - this.tournamentDropZone.input.hitArea.height / 2, this.tournamentDropZone.input.hitArea.width, this.tournamentDropZone.input.hitArea.height);
    this.tournamentDropZone.graphics = this.tournamentDropZoneGraphics;
    this.tournamentsUi.push(this.tournamentDropZone)
    this.tournamentsUi.push(this.tournamentDropZoneGraphics);

    this.partsOneDropZone = this.add.zone(150, 250, 100, 100).setRectangleDropZone(100, 100);
    this.partsOneDropZone.setName("Parts 1");
    this.partsOneDropZoneGraphics = this.add.graphics();
    
    this.partsOneDropZoneGraphics.lineStyle(2, 0xffff00);
    this.partsOneDropZoneGraphics.strokeRect(this.partsOneDropZone.x - this.partsOneDropZone.input.hitArea.width / 2, this.partsOneDropZone.y - this.partsOneDropZone.input.hitArea.height / 2, this.partsOneDropZone.input.hitArea.width, this.partsOneDropZone.input.hitArea.height);
    this.partsOneDropZone.graphics = this.partsOneDropZoneGraphics;
    this.tournamentsUi.push(this.partsOneDropZone);
    this.tournamentsUi.push(this.partsOneDropZoneGraphics);

    this.partsTwoDropZone = this.add.zone(650, 250, 100, 100).setRectangleDropZone(100, 100);
    this.partsTwoDropZone.setName("Parts 2");
    this.partsTwoDropZoneGraphics = this.add.graphics();
    
    this.partsTwoDropZoneGraphics.lineStyle(2, 0xffff00);
    this.partsTwoDropZoneGraphics.strokeRect(this.partsTwoDropZone.x - this.partsTwoDropZone.input.hitArea.width / 2, this.partsTwoDropZone.y - this.partsTwoDropZone.input.hitArea.height / 2, this.partsTwoDropZone.input.hitArea.width, this.partsTwoDropZone.input.hitArea.height);
    this.partsTwoDropZone.graphics = this.partsTwoDropZoneGraphics;
    this.tournamentsUi.push(this.partsTwoDropZone);
    this.tournamentsUi.push(this.partsTwoDropZoneGraphics);

    this.tournamentSubmitButton = new UiButton(
      this,
      this.scale.width / 2,
      this.scale.height * 0.65,
      'button1',
      'button2',
      'Start Tournament',
      this.startTournament,
      1.4,
    );

    this.tournamentsUi.push(this.tournamentSubmitButton);
    this.tournamentsUi.forEach(element => {
      element.setVisible(false);
    })
  }


  hideShop() {
    if (this.shopDisplay) {
      this.shopDisplay.forEach(element => {
        element.setVisible(false);
      });

      this.partsShopDisplay.forEach(element => {
        element.setVisible(false);
      });

      this.botShopDisplay.forEach(element => {
        element.setVisible(false);
      });
    }
  }

  showShop() {
    if (this.shopDisplay) {
      this.shopDisplay.forEach(element => {
        element.setVisible(true);
      });
      if (this.shopDispayMenu == "ROBOTS") {
        this.partsShopDisplay.forEach(element => {
          element.setVisible(false);
        });

        this.botShopDisplay.forEach(element => {
          element.setVisible(true);
        });
      } else {
        this.partsShopDisplay.forEach(element => {
          element.setVisible(true);
        });

        this.botShopDisplay.forEach(element => {
          element.setVisible(false);
        });
      }
    }
  }

  createShop() {
    let shopBackground = this.add.rectangle(45, 60, 710, 348, 0x00000).setOrigin(0,0);
    this.shopDisplay.push(shopBackground);
    this.partsShopButton = new UiButtonForStore(
      this,
      this.scale.width - 150,
      100,
      'button1',
      'button2',
      'Buy Parts',
      this.setShopState,
      1,
      null,
      "PARTS"
    );
    this.shopDisplay.push(this.partsShopButton);

    this.robotShopButton = new UiButtonForStore(
      this,
      150,
      100,
      'button1',
      'button2',
      'Buy Robots',
      this.setShopState,
      1,
      null,
      "ROBOTS"
    );
    this.shopDisplay.push(this.robotShopButton);
    // TODO - CONNECT NULL TO CRYPTO
    this.buyAttackButton = new UiButtonForStore(
      this,
      200,
      200,
      'button1',
      'button2',
      'Attack Robot',
      this.nftWallet.handleMintRobot,
      1.2,
      this.nftWallet,
      3
    );

    this.botShopDisplay.push(this.buyAttackButton);

    this.buySpeedyButton = new UiButtonForStore(
      this,
      this.scale.width - 200,
      200,
      'button1',
      'button2',
      'Speed Robot',
      this.nftWallet.handleMintRobot,
      1.2,
      this.nftWallet,
      2
    );
    this.botShopDisplay.push(this.buySpeedyButton);

    this.buyDefenderButton = new UiButtonForStore(
      this,
      200,
      300,
      'button1',
      'button2',
      'Defender Robot',
      this.nftWallet.handleMintRobot,
      1.2,
      this.nftWallet,
      0
    );
    this.botShopDisplay.push(this.buyDefenderButton);

    this.buyTankButton = new UiButtonForStore(
      this,
      this.scale.width - 200,
      300,
      'button1',
      'button2',
      'Tank Robot',
      this.nftWallet.handleMintRobot,
      1.2,
      this.nftWallet,
      1
    );
    this.botShopDisplay.push(this.buyTankButton);

    this.buySwordButton = new UiButtonForStore(
      this,
      200,
      300,
      'button1',
      'button2',
      'Sword',
      this.nftWallet.handleBuyAccessory,
      1.2,
      this.nftWallet,
      1
    );
    this.partsShopDisplay.push(this.buySwordButton);

    this.buyBuzzsawButton = new UiButtonForStore(
      this,
      this.scale.width - 200,
      300,
      'button1',
      'button2',
      'Buzzsaw',
      this.nftWallet.handleBuyAccessory,
      1.2,
      this.nftWallet,
      0
    );
    this.partsShopDisplay.push(this.buyBuzzsawButton);

    this.buyShieldButton = new UiButtonForStore(
      this,
      this.scale.width - 200,
      200,
      'button1',
      'button2',
      'Shield',
      this.nftWallet.handleBuyAccessory,
      1.2,
      this.nftWallet,
      2
    );
    this.partsShopDisplay.push(this.buyShieldButton);

    this.buyAIChipButton = new UiButtonForStore(
      this,
      200,
      200,
      'button1',
      'button2',
      'AI Chip',
      this.nftWallet.handleBuyAccessory,
      1.2,
      this.nftWallet,
      3
    );
    this.partsShopDisplay.push(this.buyAIChipButton);
  
    this.shopDisplay.forEach(element => {
      element.setVisible(false);
    });

    this.partsShopDisplay.forEach(element => {
      element.setVisible(false);
    });

    this.botShopDisplay.forEach(element => {
      element.setVisible(false);
    });
  }

  setShopState(game, wallet, value)
  {
    game.shopDispayMenu = value;
    console.log(game)
    game.showShop();
  }

  getUserParts(game, parts) {
    // Parts is [saw count, sword count,shield count, ai chip count]
    parts.forEach((part, index) => {
      switch(index) {
        case "0":
          game.makePartCard(game, part, "Saw");
        case "1":
          game.makePartCard(game, part, "Sword");
        case "2":
          game.makePartCard(game, part, "Shield");
        case "3":
          game.makePartCard(game, part, "AI Chip");
      }
    });

    if (game.parts.length == 0 && game.inventorySelect == "PARTS") {
      this.noParts.setVisible(true);
    }
    else {
      this.noParts.setVisible(false);
      //game.createCarousel(game.selectorIndex, game);
    }
  }

  startTournament(game) {
    let botObject = game.tournamentBot;
    console.log(botObject);
    postData(`${SERVER_URL}/set-battle`, { 
      'bot': { 
        "id": botObject.id, 
        "health": botObject.health,
        "ai": botObject.ai,
        "agility": botObject.agility,
        "strength": botObject.strength,
        "defense": botObject.defense
      }}).then((response) => {
      if (response.status == 200) {

      }
    });
  }

  makePartCard(game, amount, type) {
    for(var i = 0; i < amount; i++) {
      let partCard = new PartCard(game, 0, 0 ,type, 0, game.parts.length);
      partCard.makeInvisible();
      game.input.setDraggable(partCard)
      game.parts.push(partCard)
    }
  }

  getUserBots(game, robots) {
    robots.forEach(robot => {
      //game.load.spritesheet(robot.id.toString(), robot.imageRobot, { frameWidth: 64, frameHeight: 84 }); 
      console.log(robot.robotType);
      let robotCard = new RobotCard(game, 120, game.scale.height - 80, robot.robotType, 0, robot.id, robot.ai, robot.agility, robot.health, robot.defense, robot.strength)
      robotCard.makeInvisible();
      robotCard.setName(robot.name);
      game.input.setDraggable(robotCard)
      game.robots.push(robotCard)
      game.robotsInventory.push(robotCard);
    });

    if (game.robotsInventory.length == 0 && game.inventorySelect == "ROBOTS") {
      this.noBots.setVisible(true);
    }
    else {
      this.noBots.setVisible(false);
      game.createCarousel(game.selectorIndex, game);
    }
    /*getData(`${SERVER_URL}/inventory`).then((response) => {
      if (response.status == 200) {
        game.load.on('start', () => {
          response.inventory.default.robots.forEach(robot => {
                    
          })
          
          response.inventory.default.parts.forEach(part => {
            game.load.spritesheet(part.id.toString(), part.image, { frameWidth: 64, frameHeight: 64 });
            
          })
        });

        game.load.on('complete', () => {
          response.inventory.default.robots.forEach(robot => {
           
          })
  
          response.inventory.default.parts.forEach(part => {
           
          })

          
        });

        game.load.start()
      }
    });*/
  }

  createUi() {
    this.trainingButton = new UiButton(
      this,
      this.scale.width - 150,
      this.scale.height * 0.05,
      'button1',
      'button2',
      'Training',
      this.trainingDisplay,
      0.8,
    );

    this.boxingButton = new UiButton(
      this,
      this.scale.width / 2,
      this.scale.height * 0.05,
      'button1',
      'button2',
      'Boxing',
      this.tournamentsDisplay,
      0.8,
    );

    this.shopButton = new UiButton(
      this,
      150,
      this.scale.height * 0.05,
      'button1',
      'button2',
      'Bot Shop',
      this.storeDisplay,
      0.8
    );

    this.partsInventoryButton = new UiButton(
      this,
      this.scale.width - 150,
      this.scale.height - 150,
      'button1',
      'button2',
      'Parts',
      this.displayPartsInventory,
      0.8
    );

    this.robotInventoryButton = new UiButton(
      this,
      150,
      this.scale.height - 150,
      'button1',
      'button2',
      'Robots',
      this.displayRobotInventory,
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

  displayPartsInventory(game){
    console.log("PARTS DISPLAY")
    game.inventorySelect = "PARTS";
    game.robotsInventory.forEach(robot => {
      console.log("MAKE INVISIBLE")
      robot.makeInvisible();
    });
    game.parts.forEach(part => {
      part.makeVisible();
    })
    game.reorderCarousel(game);
  }

  displayRobotInventory(game) {
    console.log("ROBOT DISPLAY")
    game.inventorySelect = "ROBOTS";
    game.parts.forEach(part => {
      part.makeInvisible();
    })
    game.robotsInventory.forEach(robot => {
      robot.makeVisible();
    })
    game.reorderCarousel(game);
  }

  createAudio() {
  }

  createGroups() {
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  createCarousel(index, game) {
    let x = 150
    let groupSelect = null
    if(game.inventorySelect == "ROBOTS") {
      groupSelect = this.robots;
    }
    else {
      groupSelect = this.parts;
    }
    console.log(groupSelect)
    console.log(groupSelect[0])
    for(var i = index;i < index + 3; i++) {
      if (groupSelect[i]) {
        groupSelect[i].setPosition(x, game.scale.height - 80);
        groupSelect[i].makeVisible();
        groupSelect[i].originalX = groupSelect[i].x
        groupSelect[i].originalY = groupSelect[i].y
        x = x + 120;
      }
    }
  }

  reorderCarousel(game) {
    game.moveCarousel(0, game)
  }

  // Set move zero to zero and invisible
  moveCarousel(indexMove, game) {
    let x = 150
    let groupSelect = null
    console.log(game.inventorySelect)
    if(game.inventorySelect == "ROBOTS") {
      groupSelect = game.robotsInventory;
      if(groupSelect.length == 0) {
        game.noBots.setVisible(true);
        game.noParts.setVisible(false);
      }
      else {
        game.noBots.setVisible(false);
        game.noParts.setVisible(false);
      }
    }
    else {
      groupSelect = game.parts;
      if(groupSelect.length == 0) {
        game.noParts.setVisible(true);
        game.noBots.setVisible(false);
      } else {
        game.noParts.setVisible(false);
        game.noBots.setVisible(false);
      }
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

  storeDisplay(game) {
    game.showShop();
    game.hideTournaments();
    game.hideTraining();
  }

  tournamentsDisplay(game) {
    game.showTournaments();
    game.hideShop();
    game.hideTraining();
  }

  trainingDisplay(game) {
    game.showTraining();
    game.hideShop();
    game.hideTournaments();
  }
}
