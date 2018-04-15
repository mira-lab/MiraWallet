import {Component} from '@angular/core';
import {SmartTemplatesProvider} from "../../../../providers/mirabox/smartbox-templates/smartbox-templates";
import {MiraBox, WalletType} from "../../../../mira/mira";
import {NewNominalBoxPage} from "../newBox/newNominalBox/newNominalBox";
import {ConfigProvider} from "../../../../providers/config/config";
import {MiraStorageProvider} from "../../../../providers/mirabox/mirastorage";
import {BwcProvider} from "../../../../providers/bwc/bwc";
import {ProfileProvider} from "../../../../providers/profile/profile";
import {MiraBoxProvider} from "../../../../providers/mirabox/mirabox";
import {NavController} from "ionic-angular";
import {WalletProvider} from "../../../../providers/wallet/wallet";
import {TxConfirmNotificationProvider} from "../../../../providers/tx-confirm-notification/tx-confirm-notification";
import {OnGoingProcessProvider} from "../../../../providers/on-going-process/on-going-process";
import {MiraBoxType} from "../../../../mira/mira";

@Component({
  selector: 'page-new-mirabox',
  templateUrl: 'newMiraBox.html'
})
export class NewMiraBoxPage {
  public currencyInputs = [];
  public inProgress: boolean = false;
  public showSearch: boolean = false;
  public showTemplateSettings: boolean = false;
  public selectedTemplate;
  public selectedTemplates = [];
  public smartTemplates = {};
  public miraBoxType = MiraBoxType;
  public boxType: MiraBoxType = MiraBoxType.Nominal;
  public btcWallets;
  public miraBoxName: string = "Mirabox1";
  public miraBoxDescription: string = "";

  constructor(private smartTemplatesProvider: SmartTemplatesProvider,
              private bwcProvider: BwcProvider,
              private miraBoxProvider: MiraBoxProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController,
              private txConfirmNotificationProvider: TxConfirmNotificationProvider,
              private configProvider: ConfigProvider,
              private walletProvider: WalletProvider,
              private profileProvider: ProfileProvider,
              private ongoingProcessProvider: OnGoingProcessProvider) {
    this.addCurrencyInput();
    this.getSmartTemplates();
    this.btcWallets = this.profileProvider.getWallets({coin: 'btc'});
  }

  public addCurrencyInput() {
    this.currencyInputs.push({'value': 'btc'});
    this.updateMiraBoxType();
  }

  public addSearchElement(searchType: string) {
    this.showSearch = !this.showSearch;
    this.showTemplateSettings = false;
  }

  private getSmartTemplates() {
    this.smartTemplatesProvider.getTemplateList().then((smartTemplatesList) => {
      this.smartTemplates = smartTemplatesList;
    }, (error) => {
      alert("Error:" + error);
    });
  }

  private static exportWallet(wallet) {
    return JSON.parse(wallet.export())
  }

  public _showTemplateSettings(template) {
    this.showSearch = false;
    this.showTemplateSettings = true;
    this.selectedTemplate = template;
  }

  public deleteCurrencyInput(currencyInput) {
    let index = this.currencyInputs.indexOf(currencyInput);
    if (index > -1) {
      this.currencyInputs.splice(index, 1);
      this.updateMiraBoxType();
    }
  }

  public deleteSelectedTemplate(template){
    let index = this.selectedTemplates.indexOf(template);
    if (index > -1) {
      this.selectedTemplates.splice(index, 1);
      this.updateMiraBoxType();
    }
  }

  private updateMiraBoxType() {
    if (this.selectedTemplates.length >= 1) {
      this.boxType = MiraBoxType.Smart;
      return;
    }
    if (this.selectedTemplates.length < 1 && this.currencyInputs.length > 1) {
      this.boxType = MiraBoxType.Multi;
      return
    }
    this.boxType = MiraBoxType.Nominal;
  }
  public async createMiraBox() {
    let self = this;
    this.inProgress = true;
    try {
      this.ongoingProcessProvider.set('miraBoxCreation');

      let HDPrivateKey = this.bwcProvider.getBitcore().HDPrivateKey;


      let signWalletExported = NewMiraBoxPage.exportWallet(this.btcWallets[0]);
      let sourceWalletExported = NewMiraBoxPage.exportWallet(this.btcWallets[0]);

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


      this.ongoingProcessProvider.set('miraBoxCreation', false);

      //creating mirabox

      let miraBox: MiraBox = this.miraBoxProvider.createMiraBox(
        this.boxType,
        this.miraBoxDescription,
        {
          name: 'anonymous',
          publicKey: signPublicKey
        }
      );
      let itemsCreationPromises = this.currencyInputs.map((item)=>{
        let wallet: WalletType = {
          coin: sourceWalletExported.coin,
          network: sourceWalletExported.network
        };
        return this.miraBoxProvider.createMiraBoxItem(wallet, this.miraBoxName, '');
      });

      let miraBoxItemsArray = await Promise.all(itemsCreationPromises);

      miraBoxItemsArray.map((miraBoxItem)=>{
        miraBox.addBoxItem(miraBoxItem);
      });

      let contractAddress = await this.smartTemplatesProvider.createSmartBoxHandler(miraBoxItemsArray[0].hash, this.selectedTemplates[0]);
      if(miraBoxItemsArray.length > 1) {
        let assignContractPromises = miraBoxItemsArray.map((miraBoxItem, index) => {
          if (index != 0) {
            return this.smartTemplatesProvider.setMiraboxContract(miraBoxItem.hash, <string>contractAddress);
          }
        });
        await Promise.all(assignContractPromises);
      }
      miraBox.createSignature(signPrivateKey);

      await self.miraStorageProvider.storeMiraBox(miraBox);

      //filling mirabox with coin
      /*
      let sourceWallet = this.btcWallets[0];

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
      }*/
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

  public addSmartTemplate(template) {
    let isAllSet: boolean = true;
    template.settings.forEach((setting) => {
      if (!setting.value) {
        isAllSet = false;
      }
    });
    if (!isAllSet) {
      alert('You need to fill all fields!');
      return;
    }
    this.showTemplateSettings = false;
    this.selectedTemplates.push(template);
    this.selectedTemplate = {};
    this.updateMiraBoxType();
  }
}
