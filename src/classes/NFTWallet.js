import RobotContract from "../contracts/Robot.json";
import BotMarketContract from "../contracts/BotMarket.json"
import AccessoryContract from "../contracts/Accessory.json"
import Web3 from "web3";
// import ContractKit from "@celo/contractkit"
import { newKitFromWeb3 } from "@celo/contractkit";

export default class NFTWallet {
    constructor() {
        let web3 = null;
        let account = null;
        let robotInstance = null;
        let botMarketInstance = null;
        let accessoryInstance = null;
        let kit = null;
        let scene = null;
    }

    setScene(game) {
      this.scene = game;
    }

    async start() {
        try {
          // get contract instance
          // const kit = newKitFromWeb3(web3);
          // App.kit = kit;
          const networkId = await this.web3.eth.net.getId();
          const deployedNetwork = RobotContract.networks[networkId];
          this.instance = new web3.eth.Contract(
          // this.instance = new kit.web3.eth.Contract(
            RobotContract.abi,
            deployedNetwork && deployedNetwork.address
          );
    
          // get accounts
          // const accounts = await web3.eth.getAccounts();
          // this.account = accounts[0];
          // console.log(accounts);
        } catch (error) {
          console.error("Could not connect to contract or chain start.");
        }
    }

    async connectWallet() {
        try {
          this.initWeb3();
        } catch (error) {
          console.error(error);
        }
    }

    async initWeb3() {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          this.setAccounts(accounts);
          this.web3 = new Web3(window.ethereum);
        } else {
          // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
          this.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"),);
        }

        try {
          // get contract instance
          // const kit = newKitFromWeb3(web3);
          // App.kit = kit;
              const networkId = await this.web3.eth.net.getId();
              const robotDeployedNetwork = RobotContract.networks[networkId];
              this.robotInstance = new this.web3.eth.Contract(
              // this.robotInstance = new kit.web3.eth.Contract(
                RobotContract.abi,
                ((robotDeployedNetwork && robotDeployedNetwork.address) ? robotDeployedNetwork.address : null)
              );

              const botMarketDeployedNetwork = BotMarketContract.networks[networkId];
              this.botMarketInstance = new this.web3.eth.Contract(
                BotMarketContract.abi,
                botMarketDeployedNetwork && botMarketDeployedNetwork.address
              );
        
              const accessoryDeployedNetwork = AccessoryContract.networks[networkId];
              this.accessoryInstance = new this.web3.eth.Contract(
                AccessoryContract.abi,
                accessoryDeployedNetwork && accessoryDeployedNetwork.address
              );
              let bots = await this.walletOwner();
              this.scene.getUserBots(this.scene, bots);
              let parts = await this.handleOwnerAccessories();
              this.scene.getUserParts(this.scene, parts);
          // get accounts
            // const accounts = await web3.eth.getAccounts();
            // this.account = accounts[0];
            // console.log(accounts);
            } catch (error) {
                console.log(error)
                console.error("Could not connect to contract or chain robot.");
        }
    }

    async setAccounts(accounts) {
        console.log(accounts)
        this.account = accounts[0] || await this.web3.eth.getAccounts();
        console.log('updateAccounts', this.account);
        return this.addCelo();
    }

    async addCelo() {
        const ALFAJORES_PARAMS = {
          chainId: '0xaef3',
          chainName: 'Alfajores Testnet',
          nativeCurrency: { name: "Alfajores Celo", symbol: 'A-CELO', decimals: 18 },
          rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
          blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org/'],
          iconUrls: ['future'],
        };
  
        const chain = await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ALFAJORES_PARAMS],
        });
    }

    async walletOwner() {
        let robotArray = [];
        const { walletOfOwner, robots } = this.robotInstance.methods;
        const ownerNFTS = await walletOfOwner(this.account).call();
        for (let i = 0; i < ownerNFTS.length; i++) {
          //let imageRobot = await this.handleRobotImageURI(ownerNFTS[i]);
          let robot = await robots(ownerNFTS[i]).call();
          console.log(robot)
          /*switch (robot.robotType) {
            case "Tank":
              robot.imageRobot = "https://gateway.pinata.cloud/ipfs/QmP7bQQuXNnZXyLeQajoiX1Rnmbdutox33zqN74yiGqN2B/robot_0.png";
            case "Speedy":
              robot.imageRobot = "https://gateway.pinata.cloud/ipfs/QmP7bQQuXNnZXyLeQajoiX1Rnmbdutox33zqN74yiGqN2B/robot_1.png";
            case "Defender":
              robot.imageRobot = "https://gateway.pinata.cloud/ipfs/QmP7bQQuXNnZXyLeQajoiX1Rnmbdutox33zqN74yiGqN2B/robot_2.png";
            case "Attacker":
              robot.imageRobot = "https://gateway.pinata.cloud/ipfs/QmP7bQQuXNnZXyLeQajoiX1Rnmbdutox33zqN74yiGqN2B/robot_3.png";
          }*/
          robot.id = ownerNFTS[i];
          robotArray.push(robot);
        }
        return robotArray;
    }

    /*async handleRobotImageURI(id) {
      const { tokenURI } = this.robotInstance.methods;
      const uri = await tokenURI(id).call();
      var xhr = new XMLHttpRequest();
      let dataImage = null;
      xhr.open('GET', uri, true);
      xhr.responseType = 'json';
      xhr.onload = await function() {
        var status = xhr.status;
        if (status === 200) {
          console.log("BEFORE")
          console.log(dataImage)
          dataImage = xhr.response.image;
          console.log(xhr.response.image)
        } else {
          console.log("ISSUE")
          console.log(status)
          dataImage = null;
        }
      };
      await xhr.send();
      console.log("RETURN DATA IMAGE")
      console.log(dataImage);
      return dataImage;
    }*/

    async handleMintRobot(game, nftWallet, robotID) {
        console.log(nftWallet)
        const { mint, ROBOT_PRICE } = nftWallet.robotInstance.methods;
    
        let robotPrice = await ROBOT_PRICE().call();
        let robotNames = ['Bob', 'Joe', 'Curley']
        await mint(robotID, robotNames[Math.floor(Math.random() * robotNames.length)]).send({
          from: nftWallet.account,
          value: robotPrice,
          // should not need to include gas
          // gas: 5000000,
          // gasPrice: 20000000
        }).then(object => {
          let bots = nftWallet.walletOwner();
          game.scene.getUserBots(game.scene, bots);
        }).catch(err => {
          console.log(err);
        });
    
        // left this code here in case we later want to use contractKit
        // this.kit.defaultAccount = this.account;
    
        //  console.log("robotPrice in wei");
        //  console.log(robotPrice);
        //  const txObject = await mint(1);
        //  let tx = await this.kit.sendTransactionObject(txObject, { from: this.account, value: robotPrice });
        //  let receipt = await tx.waitReceipt();
        //  console.log(receipt);
    }

    async handleBuyAccessory(game, nftWallet, accessoryID) {
      console.log("WALLET ACCESSORIES")
      const { accessories, purchaseAccessory } = nftWallet.botMarketInstance.methods;
      console.log("PRICE")
      console.log(accessoryID)
      const accessory = await accessories(accessoryID).call();
      console.log("CALLING")
      const accPrice = accessory.price;
      console.log("Accessory 1's price");
      console.log(accPrice);
    
      await purchaseAccessory(nftWallet.account, accessoryID).send({
        from: nftWallet.account,
        value: accPrice,
      }).catch(err => {
        console.log(err);
      });
    }

    async handleOwnerAccessories() {
      const { balanceOfBatch } = this.accessoryInstance.methods;
    
        // for EIP1155, the balanceOfBatch function requires a pair between the address and the ID of the accessory. There are 4 accessories which is why there are 4 "this.accounts" listed.
      const accessories = await balanceOfBatch([this.account, this.account, this.account, this.account], [0,1,2,3]).call();
  
      return accessories;
    }

}