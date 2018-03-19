import {Injectable} from "@angular/core";

@Injectable()
export class Web3Provider {
  constructor() {

  }

  public checkConnection() {
    let web3 = this.getWeb3();
    web3.eth.net.isListening()
      .then(() => console.log('Web3 is connected alright.'))
      .catch(e => console.log('Something went wrong with Web3:' + e));
  }

  public getWeb3() {
    let Web3 = require('web3');
    return new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
  }

  public checkMiraBoxOpened(hash: string) {
    let permissionContractAddress = '0x731a10897d267e19B34503aD902d0A29173Ba4B1';
    let permissionContractAbi = require("./abiPermissioning.json");
    let Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
    let permissionContract = new web3.eth.Contract(permissionContractAbi, permissionContractAddress);
    return new Promise((resolve) => {
      permissionContract.methods.getMiraBoxOpened(hash)
        .call()
        .then((result) => {
          resolve(result)
        });
    });
  }
}
