import {Injectable} from "@angular/core";

@Injectable()
export class Web3Provider {
  private Web3;
  private web3;
  constructor(nodeURL:string){
    this.Web3 = require('web3');
    this.web3 = new this.Web3(new this.Web3.providers.HttpProvider('http://localhost:8545'));
  }
  public checkConnection(network: string) {
    this.web3.eth.net.isListening()
      .then(() => console.log('Connected.'))
      .catch(e => console.log('Something went wrong:' + e));
  }

  public getWeb3() {
    return this.Web3;
  }

  public checkMiraBoxOpened(hash: string) {
    let permissionContractAddress = '0x731a10897d267e19B34503aD902d0A29173Ba4B1';
    let permissionContractAbi = require("./abiPermissioning.json");
    let permissionContract = new this.web3.eth.Contract(permissionContractAbi, permissionContractAddress);
    return new Promise((resolve) => {
      permissionContract.methods.getMiraBoxOpened(hash)
        .call()
        .then((result) => {
          resolve(result)
        });
    });
  }
  private getTemplates(_miraFactoryAddress: string){
    let miraFactoryAddress = _miraFactoryAddress;
    let miraFactoryAbi = require("./MiraFactory.json");
    let miraFactoryContract = new this.web3.eth.Contract(miraFactoryAbi, miraFactoryAddress);
    return new Promise((resolve) => {
      miraFactoryContract.methods.getTemplatesList()
        .call()
        .then((result) => {
          resolve(result)
        });
    });
  }
}
