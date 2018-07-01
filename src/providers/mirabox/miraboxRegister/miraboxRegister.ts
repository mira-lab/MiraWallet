import {Injectable} from "@angular/core";
import {Web3Provider} from "../../web3/web3";

@Injectable()
export class MiraboxRegisterProvider {
  private web3: any;
  private registerContractAbi = require("./RegisterContractAbi.json");
  private registerContractAddress = "0x677d63ea5a45d95b2c681b47cde811466f357c7e";
  constructor(private web3Provider: Web3Provider){
    this.web3 = this.web3Provider.getWeb3();
  }
  public registerMirabox(miraboxHash: string, ethAddress: string){
    return new Promise((resolve, reject) => {

      let registerContract = new this.web3.eth.Contract(this.registerContractAbi, this.registerContractAddress);
      let miraboxHashHex = '0x' + miraboxHash;
      let getData = registerContract.methods.setMiraBox(ethAddress, miraboxHashHex).encodeABI();
      this.web3.eth.accounts.signTransaction({
        to: this.registerContractAddress,
        data: getData,
        gas: 30000000
      }, '0xf95ba1aa2ede0be0129bd93b177eda9a220889cc1a1e2f949c72f55448148d8a')
        .then(result => {
          this.web3.eth.sendSignedTransaction(result.rawTransaction)
            .on('receipt', (result) => {
              console.log("Got receipt from setMirabox:");
              console.log(result);
              return resolve();
            })
            .on('error', (err) => {
              return reject(err);
            })
        })
        .catch((err) => {
          return reject(err);
        })
    });
  }
}
