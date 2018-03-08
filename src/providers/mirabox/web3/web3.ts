import {Injectable} from "@angular/core";

@Injectable()
export class Web3Provider {
  public checkConnection(network: string) {
    var Web3 = this.getWeb3();
    const web3 = new Web3(new Web3.providers.HttpProvider(network));
    web3.eth.net.isListening()
      .then(() => console.log('Connected.'))
      .catch(e => console.log('Something went wrong:' + e));
  }

  public getWeb3() {
    return require('web3');
  }

  public checkMiraBoxOpened(hash: string) {
    //tododaniil Change node and contract addresses to live network
    let Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

    let permissionContractAddress = '0x731a10897d267e19B34503aD902d0A29173Ba4B1';
    //change abi if contract changes
    let permissionContractAbi = require("./abiPermissioning.json");

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