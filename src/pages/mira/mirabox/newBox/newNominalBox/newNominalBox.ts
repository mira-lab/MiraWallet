import {Component} from '@angular/core';
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {MiraBoxWalletKeyPair, MiraBoxKeyPair, MiraBoxWalletType} from "../../../../../mira/mira";
import {MiraBoxProvider} from "../../../../../providers/mirabox/mirabox";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";
import {NavController} from "ionic-angular";


@Component({
  selector: 'page-mirabox-new-nominal',
  templateUrl: 'newNominalBox.html'
})
export class NewNominalBoxPage {
  constructor(private bwcProvider: BwcProvider,
              private miraBoxProvider: MiraBoxProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController) {
  }

  public walletType: MiraBoxWalletType = MiraBoxWalletType.BTC;
  public walletName: string = 'miraBox name';
  public boxPassword: string;
  public boxDescription: string = "box description";

  public createBox() {
    let self = this;
    let walletKeyPair: MiraBoxWalletKeyPair = this.generateWalletKeyPair();
    this.miraBoxProvider.createNominalMiraBox(
      this.walletType,
      this.walletName,
      walletKeyPair,
      this.boxDescription,
      {
        name: "test user",
        publicKey: "user public key"
      }
    )
      .then(function (miraBoxKeyPair: MiraBoxKeyPair) {
        return self.miraStorageProvider.storeMiraBox(miraBoxKeyPair.miraBox)
          .then(function () {
            return self.miraStorageProvider.storeMiraKey(miraBoxKeyPair.miraKey);
          });
      })
      .then(function () {
        console.log('Successfully stored in storage');
        self.navCtrl.popAll();
      });

  }

  public generateWalletKeyPair(): MiraBoxWalletKeyPair {
    let bitCore = this.bwcProvider.getBitcore();
    let hdPrivateKey = new bitCore.HDPrivateKey();
    let hdPublicKey = hdPrivateKey.hdPublicKey;
    return {
      privateKey: hdPrivateKey.toString(),
      publicKey: hdPublicKey.toString()
    };
  }
}
