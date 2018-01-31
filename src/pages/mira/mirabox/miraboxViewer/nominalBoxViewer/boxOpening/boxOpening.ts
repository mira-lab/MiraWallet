import {Component} from '@angular/core';
import {NavParams} from "ionic-angular";
import {MiraBox} from "../../../../../../mira/mira";
import {DecodedWallet, MiraBoxProvider} from "../../../../../../providers/mirabox/mirabox";

@Component({
  selector: 'boxOpening',
  templateUrl: 'boxOpening.html'
})
export class NominalBoxOpeningViewer {
  public miraBox: MiraBox;

  constructor(navParams: NavParams,
              private miraBoxProvider: MiraBoxProvider) {
    this.miraBox = navParams.data;
  }

  public decryptedWallets:DecodedWallet[] = [];

  ngOnInit() {
    let self = this;
    this.miraBoxProvider.openMiraBox(this.miraBox)
      .then(function (wallets:DecodedWallet[]) {
        self.decryptedWallets = wallets;
      });
  }
}