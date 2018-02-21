import {Component} from '@angular/core';
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {Coin, MiraBox, WalletType} from "../../../../../mira/mira";
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

  public walletType: Coin = Coin.BTC;
  public walletName: string = 'It is wallet name';
  public boxDescription: string = "No description";
  public creatorName: string = "Anonymous";

  public btcWallets = this.profileProvider.getWallets({coin: 'btc'}).map((item) => {
    return JSON.parse(item.export());
  });
  public bchWallets = this.profileProvider.getWallets({coin: 'bch'}).map((item) => {
    return JSON.parse(item.export())
  });

  public signWallet = this.btcWallets[0];
  public sourceWallet = this.btcWallets[0];

  public async createBox() {
    let HDPrivateKey = this.bwcProvider.getBitcore().HDPrivateKey;

    let self = this;

    if (!this.signWallet || !this.sourceWallet.xPrivKey) {
      alert('You have to select wallet');
      return;
    }
    if (!this.sourceWallet) {
      alert('You have to select wallet');
      return;
    }

    let signWalletPrivateKey = new HDPrivateKey(this.signWallet.xPrivKey);
    let signWalletDerivedPrivateKey = signWalletPrivateKey.derive("m/0'");
    let signPrivateKey = signWalletDerivedPrivateKey.privateKey;
    let signPublicKey = signWalletDerivedPrivateKey.publicKey.toString();

    let wallet: WalletType = {
      coin: this.sourceWallet.coin,
      network: this.sourceWallet.network
    };

    //creating mirabox
    let miraBox: MiraBox = await this.miraBoxProvider.createNominalMiraBox(
      wallet,
      this.walletName,
      '',
      this.boxDescription,
      {
        name: self.creatorName,
        publicKey: signPublicKey
      }
    );
    miraBox.createSignature(signPrivateKey);
    //storing mirabox
    await self.miraStorageProvider.storeMiraBox(miraBox);
    //filling mirabox with coin

    //finishing
    console.log('Successfully stored in storage');
    self.navCtrl.popAll().catch(e => {
      console.log(e);
    });
  }
}
