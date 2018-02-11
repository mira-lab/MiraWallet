import {Component} from '@angular/core';
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {MiraBoxWalletType, MiraBox} from "../../../../../mira/mira";
import {MiraBoxProvider} from "../../../../../providers/mirabox/mirabox";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";
import {NavController} from "ionic-angular";
import {ProfileProvider} from "../../../../../providers/profile/profile";


@Component({
  selector: 'page-mirabox-new-nominal',
  templateUrl: 'newNominalBox.html'
})
export class NewNominalBoxPage {
  constructor(private bwcProvider: BwcProvider,
              private miraBoxProvider: MiraBoxProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController,
              private profileProvider: ProfileProvider) {
  }

  public walletType: MiraBoxWalletType = MiraBoxWalletType.BTC;
  public walletName: string = 'miraBox name';
  public boxPassword: string;
  public boxDescription: string = "box description";

  public createBox() {
    let self = this;
    this.miraBoxProvider.createNominalMiraBox(
      this.walletType,
      this.walletName,
      '',//todo нам нужен хозяин кошелька??
      this.boxDescription,
      {
        name: "test user",
        publicKey: "user public key"
      }
    )
      .then(function (miraBox: MiraBox) {
        //todo тут выбирается первый кошелек пользователя. сюда нужно протолкнуть выбранный пользователем
        let walletsBtc = self.profileProvider.getWallets({coin: 'btc'});
        let exportedWallet = JSON.parse(walletsBtc[0].export());
        let HDPrivateKey = self.bwcProvider.getBitcore().HDPrivateKey;
        let retrievedPrivateKey = new HDPrivateKey(exportedWallet.xPrivKey);
        let derivedPrivateKey = retrievedPrivateKey.derive("m/0'");
        let privateKey = derivedPrivateKey.privateKey;

        miraBox.createSignature(privateKey);
        return self.miraStorageProvider.storeMiraBox(miraBox);
      })
      .then(function () {
        console.log('Successfully stored in storage');
        return self.navCtrl.popAll();
      });

  }
}
