import {Injectable} from "@angular/core";

@Injectable()
export class Web3Provider {
  public connect(network:string){
    var Web3 = this.getWeb3();
    const web3 = new Web3(new Web3.providers.HttpProvider(network));
    web3.eth.net.isListening()
      .then(() => console.log('Connected.'))
      .catch(e => console.log('Something went wrong:'+e));
  }
  public getWeb3(){
    return require('web3');
  }
}
