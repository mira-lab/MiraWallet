import { Component } from '@angular/core';
import { BwcProvider } from '../../providers/bwc/bwc';
import { NavController, NavParams } from "ionic-angular";
@Component({
  selector: 'page-mirabox',
  templateUrl: 'mirabox.html'
})
export class MiraboxPage {
  public miraBoxType;

  constructor(
    private bwcProvider: BwcProvider,
    private navCtrl: NavController,
    private navParams: NavParams) {

    this.miraBoxType = this.navParams.get("type");

  }
  public generatePrivateKey(){
    let bitcore = this.bwcProvider.getBitcore();
    let prvkey = bitcore.PrivateKey();
  }
}
