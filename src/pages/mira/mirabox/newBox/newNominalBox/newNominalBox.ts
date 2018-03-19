import {Component} from '@angular/core';
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {Coin, MiraBox, WalletType} from "../../../../../mira/mira";
import {MiraBoxProvider} from "../../../../../providers/mirabox/mirabox";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";
import {NavController, NavParams} from "ionic-angular";
import {ProfileProvider} from "../../../../../providers/profile/profile";
import {WalletProvider} from "../../../../../providers/wallet/wallet";
import {ConfigProvider} from "../../../../../providers/config/config";
import {TxConfirmNotificationProvider} from "../../../../../providers/tx-confirm-notification/tx-confirm-notification";
import {OnGoingProcessProvider} from "../../../../../providers/on-going-process/on-going-process";
import {Web3Provider} from "../../../../../providers/mirabox/web3/web3";
import {SmartTemplatesPage} from "./templates/smartTemplates";
import {SmartTemplatesProvider} from "../../../../../providers/mirabox/smartbox-templates/smartbox-templates";

@Component({
  selector: 'page-mirabox-new-nominal',
  templateUrl: 'newNominalBox.html'
})
export class NewNominalBoxPage {
  private config;
  public inProgress: boolean = false;
  public selectedTemplate:string = "Not Selected";
  constructor(private bwcProvider: BwcProvider,
              private miraBoxProvider: MiraBoxProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController,
              private txConfirmNotificationProvider: TxConfirmNotificationProvider,
              private configProvider: ConfigProvider,
              private walletProvider: WalletProvider,
              private profileProvider: ProfileProvider,
              private ongoingProcessProvider: OnGoingProcessProvider,
              private web3Provider: Web3Provider,
              private navParams: NavParams,
              private smartTemplatesProvider: SmartTemplatesProvider) {
    this.config = this.configProvider.get();

    this.btcWallets = this.profileProvider.getWallets({coin: 'btc'});

    this.boxType = this.navParams.get("boxType");
  }
  public boxType:string = 'Nominal';
  public walletType: Coin = Coin.BTC;
  public walletName: string = 'It is wallet name';
  public boxDescription: string = "No description";
  public creatorName: string = "Anonymous";
  public amount: number = 0.001;

  public btcWallets;
  public smartTemplates;
  public sourceTemplateIdx = 0;
  public signWalletIdx = 0;
  public sourceWalletIdx = 0;

  private static exportWallet(wallet) {
    return JSON.parse(wallet.export())
  }
  public openTemplatesPage(){
    this.navCtrl.push(SmartTemplatesPage);
  }
  public ionViewWillEnter() {
    if(this.smartTemplatesProvider.selectedTemplate)
      this.selectedTemplate = this.smartTemplatesProvider.selectedTemplate.name + " " + this.smartTemplatesProvider.selectedTemplate.version;
    else
      this.selectedTemplate = "Not Selected";
  }
  public ionViewWillLeave(){
    this.smartTemplatesProvider.deleteSelectedTemplate();
  }
  public async createBox() {
    let self = this;
    this.inProgress=true;
    try {
      this.ongoingProcessProvider.set('miraBoxCreation');

      let HDPrivateKey = this.bwcProvider.getBitcore().HDPrivateKey;


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

      this.ongoingProcessProvider.set('miraBoxCreation', false);
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
      self.navCtrl.popAll().catch(e => {
        console.log(e);
      });
    }
    catch {
      this.ongoingProcessProvider.unset();
    }
    finally {
      this.inProgress = false;
    }
  }
  //tododaniil make it with real mirabox and add changing settings to viewer
  public testSmart() {
    if (this.boxType == "Smart") {
      this.smartTemplatesProvider.createSmartBoxHandler("jijix", "0x7125B514c135a89a8776a4336C20b4bb183Fb97D", "12wq")
        .then(()=>console.log("ok"));
    }
  }
}
