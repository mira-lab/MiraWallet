import {Component} from '@angular/core';
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {Coin, MiraBox, WalletType} from "../../../../../mira/mira";
import {MiraBoxProvider} from "../../../../../providers/mirabox/mirabox";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";
import {NavController} from "ionic-angular";
import {ProfileProvider} from "../../../../../providers/profile/profile";
import {WalletProvider} from "../../../../../providers/wallet/wallet";
import {ConfigProvider} from "../../../../../providers/config/config";
import {TxConfirmNotificationProvider} from "../../../../../providers/tx-confirm-notification/tx-confirm-notification";


@Component({
  selector: 'page-mirabox-new-nominal',
  templateUrl: 'newNominalBox.html'
})
export class NewNominalBoxPage {
  private config;

  constructor(private bwcProvider: BwcProvider,
              private miraBoxProvider: MiraBoxProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController,
              private txConfirmNotificationProvider: TxConfirmNotificationProvider,
              private configProvider: ConfigProvider,
              private walletProvider: WalletProvider,
              private profileProvider: ProfileProvider) {
    this.config = this.configProvider.get();

    this.btcWallets = this.profileProvider.getWallets({coin: 'btc'});
  }

  public walletType: Coin = Coin.BTC;
  public walletName: string = 'It is wallet name';
  public boxDescription: string = "No description";
  public creatorName: string = "Anonymous";
  public amount: number = 0.001;

  public btcWallets;

  public signWalletIdx = 0;
  public sourceWalletIdx = 0;

  private static exportWallet(wallet) {
    return JSON.parse(wallet.export())
  }

  public async createBox() {
    let HDPrivateKey = this.bwcProvider.getBitcore().HDPrivateKey;

    let self = this;

    let signWalletExported = NewNominalBoxPage.exportWallet(this.btcWallets[this.signWalletIdx]);
    let sourceWalletExported = NewNominalBoxPage.exportWallet(this.btcWallets[this.sourceWalletIdx]);

    if (!signWalletExported || !signWalletExported.xPrivKey) {
      alert('You have to select wallet');
      return;
    }
    if (!sourceWalletExported) {
      alert('You have to select wallet');
      return;
    }
    
    let signWalletPrivateKey = new HDPrivateKey(signWalletExported.xPrivKey);
    let signWalletDerivedPrivateKey = signWalletPrivateKey.derive("m/0'");
    let signPrivateKey = signWalletDerivedPrivateKey.privateKey;
    let signPublicKey = signWalletDerivedPrivateKey.publicKey.toString();

    let wallet: WalletType = {
      coin: sourceWalletExported.coin,
      network: sourceWalletExported.network
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

    let sourceWallet = this.btcWallets[this.sourceWalletIdx];

    let recipientAddress = miraBox.getBoxItems()[0].headers.address;

    let Unit = this.bwcProvider.getBitcore().Unit;

    let satoshiAmount = Unit.fromBTC(this.amount).toSatoshis();

    let txp = {
      "outputs": [
        {
          "toAddress": recipientAddress,
          "amount": satoshiAmount
        }
      ],
      "feeLevel": "normal",
      "excludeUnconfirmedUtxos": !this.config.wallet.spendUnconfirmed,
      "dryRun": false
    };

    let tx = await this.walletProvider.createTx(sourceWallet, txp);

    if (!sourceWallet.canSign() && !sourceWallet.isPrivKeyExternal()) {
      await this.walletProvider.onlyPublish(sourceWallet, tx);
    }
    else {
      let publishedTx = await  this.walletProvider.publishAndSign(sourceWallet, tx);
      if (this.config.confirmedTxsNotifications && this.config.confirmedTxsNotifications.enabled) {
        this.txConfirmNotificationProvider.subscribe(sourceWallet, {
          txid: publishedTx.txid
        });
      }
    }

    //finishing
    console.log('Successfully stored in storage');
    self.navCtrl.popAll()
      .catch(e => {
        console.log(e);
      });
  }
}
