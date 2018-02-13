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

  public btcWallets = this.profileProvider.getWallets({coin: 'btc'}).map((item)=>{return JSON.parse(item.export());});
  public bchWallets = this.profileProvider.getWallets({coin: 'bch'}).map((item)=>{return JSON.parse(item.export())});

  public initBTCWallet = this.btcWallets[0];
  public initBCHWallet = this.bchWallets[0];

  public btcWalletToSign = this.initBTCWallet;
  public bchWalletToSign = this.initBCHWallet;

  public createBox() {
    let self = this;
    let HDPrivateKey = this.bwcProvider.getBitcore().HDPrivateKey;
    if (this.walletType == 'btc' && this.btcWalletToSign.xPrivKey){
      var retrievedPrivateKey = new HDPrivateKey(this.btcWalletToSign.xPrivKey);
    }else if (this.walletType == 'bch' && this.bchWalletToSign.xPrivKey) {
      retrievedPrivateKey = new HDPrivateKey(this.bchWalletToSign.xPrivKey);
    }else {
      alert("Error!");
      return;
    }
    let derivedPrivateKey = retrievedPrivateKey.derive("m/0'");
    let privateKey = derivedPrivateKey.privateKey;
    let publicKey = derivedPrivateKey.publicKey.toString();

    this.miraBoxProvider.createNominalMiraBox(
      this.walletType,
      this.walletName,
      '',//todo нам нужен хозяин кошелька??
      this.boxDescription,
      {
        name: "test user",//todo нам нужен хозяин кошелька??
        publicKey: publicKey
      }
    )
      .then(function (miraBox: MiraBox) {
        miraBox.createSignature(privateKey);
        return self.miraStorageProvider.storeMiraBox(miraBox);
      })
      .then(function () {
        console.log('Successfully stored in storage');
        self.navCtrl.popAll().catch(e => {
          console.log(e);
        });
      });

  }
}
