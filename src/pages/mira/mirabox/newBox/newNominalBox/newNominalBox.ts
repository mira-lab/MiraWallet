import {Component} from '@angular/core';
import {NavController} from "ionic-angular";
import {BwcProvider} from "../../../../../providers/bwc/bwc";

@Component({
  selector: 'page-mirabox-new-nominal',
  templateUrl: 'newNominalBox.html'
})
export class NewNominalBoxPage {
  constructor(private bwcProvider: BwcProvider) {
  }

  public createBox() {
    let privateKey = this.generatePrivateKey();
    console.log(`creating box for BTC private key ${privateKey}`);
  }

  public generatePrivateKey(): string {
    let bitcore = this.bwcProvider.getBitcore();
    return bitcore.PrivateKey();
  }
}
