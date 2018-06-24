import {Component} from '@angular/core';
import {NavController, NavParams} from "ionic-angular";
import {MiraBox} from "../../../../../../mira/mira";
import {DecodedWallet, MiraBoxProvider} from "../../../../../../providers/mirabox/mirabox";

@Component({
  selector: 'boxOpening',
  templateUrl: 'boxOpening.html'
})
export class NominalBoxOpeningViewer {
  public miraBox: MiraBox;
  public ethAccount;
  public ethAccountPassword;
  constructor(navParams: NavParams,
              private miraBoxProvider: MiraBoxProvider,
              private navCtrl:NavController) {
    this.miraBox = navParams.data.mirabox;
    this.ethAccount = navParams.data.ethAccount;
    this.ethAccountPassword = navParams.data.ethAccountPassword;
  }

  public decryptedWallets: DecodedWallet[] = [];
  ngOnInit() {
    let self = this;
    this.miraBoxProvider._openMiraBox(this.miraBox, this.ethAccount, this.ethAccountPassword)
      .then(function (wallets: DecodedWallet[]) {
        self.decryptedWallets = wallets;
      })
      .catch((err) => {
        this.navCtrl.pop();
        alert("Something went wrong!");
      });

  }
}
