import {Component} from '@angular/core';
import {PlatformProvider} from "../../../../../providers/platform/platform";
import {MiraBoxExportProvider} from "../../../../../providers/mirabox/mirabox-export";
import {ModalController, NavController, NavParams} from "ionic-angular";
import {MiraBox, MiraBoxItem, Coin, Status} from "../../../../../mira/mira";
import {NominalBoxOpeningViewer} from "./boxOpening/boxOpening";
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {InputPasswordModal} from "../../inputPasswordModal/inputPasswordModal";
import {BtcNetwork} from "../../../../../providers/mirabox/mirabox";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";
import {WalletProvider} from "../../../../../providers/wallet/wallet";
import {TxFormatProvider} from "../../../../../providers/tx-format/tx-format";


@Component({
  selector: 'nominalBoxViewer',
  templateUrl: 'nominalBoxViewer.html'
})
export class NominalBoxViewer {
  public isCordova: boolean;
  public miraBox: MiraBox;
  public currentBalance: number;
  public boxItemAddress;
  public miraBoxBchAddress;
  public coin = Coin;
  public miraBoxStatus: Status;
  public ethAccount;
  public ethAccountPassword;
  constructor(private platformProvider: PlatformProvider,
              private miraBoxExportProvider: MiraBoxExportProvider,
              private miraStorageProvider: MiraStorageProvider,
              private bwcProvider: BwcProvider,
              private navCtrl: NavController,
              private modalCtrl: ModalController,
              private walletProvider: WalletProvider,
              private txFormatProvider: TxFormatProvider,
              navParams: NavParams) {
    this.isCordova = this.platformProvider.isCordova;
    this.miraBox = navParams.data;
    this.updateBalance(this.miraBox.getBoxItems()[0]);
    this.getBchAddress();
    this.updateStatus();
  }

  private getBchAddress(){
    if(this.miraBox.getBoxItems()[0].headers.type.coin == Coin.BCH) {
      if (this.walletProvider.useLegacyAddress()) {
        this.miraBoxBchAddress = this.miraBox.getBoxItems()[0].headers.address;
      } else {
        this.miraBoxBchAddress = this.txFormatProvider.toCashAddress(this.miraBox.getBoxItems()[0].headers.address);
      }
    }
  }
  private updateStatus() {
    this.miraStorageProvider.getMiraBoxStatus(this.miraBox.getGuid())
      .then((status: Status) => {
          this.miraBoxStatus = status;
        },
        (err) => {
          console.log("Get status failed with error: " + err);
          this.miraBoxStatus = Status.Err;
        })
  }

  private setPassword(): Promise<string> {
    let self = this;
    return new Promise<string>(function (resolve, reject) {
      let inputPassword = self.modalCtrl.create(
        InputPasswordModal, {
          title: "Set password",
          onSubmit: password => {
            resolve(password);
            return true;
          }
        }
      );
      inputPassword.onDidDismiss(() => {
        reject('canceled');
      });
      inputPassword.present();
    });
  }

  public encodeMiraBox(miraBox: MiraBox, password: string): string {
    return this.bwcProvider.getSJCL().encrypt(password, this.miraBox.toString());
  }

  private getMiraBoxFileName() {
    return `${this.miraBox.getGuid()}.mbox`;
  }

  download() {
    let self = this;
    this.setPassword()
      .then(password => {
        let encodedMiraBox = self.encodeMiraBox(self.miraBox, password);
        if (this.platformProvider.isCordova) {
          this.miraBoxExportProvider.createFile(encodedMiraBox, self.getMiraBoxFileName());
        }
        else {
          let dataStr = "data:application/text;charset=utf-8," + encodedMiraBox;
          let downloadAnchorNode = document.getElementById("not-cordova-download");
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", self.getMiraBoxFileName());
          downloadAnchorNode.click();
        }
        this.miraStorageProvider.updateMiraBoxStatus(self.miraBox.getGuid(), Status.Exported)
          .then(() => {
            console.log('MiraBox Status Updated to ' + Status.Exported);
            this.updateStatus();
          }, ()=>{console.log("Error updating mirabox status!")})
      })
      .catch(console.log);

  }


  public sheetShare() {

    let self = this;
    this.setPassword()
      .then(password => {
        let encodedMiraBox = self.encodeMiraBox(self.miraBox, password);
        self.miraBoxExportProvider
          .ShareSocial(encodedMiraBox, this.miraBox.getGuid());
        this.miraStorageProvider.updateMiraBoxStatus(self.miraBox.getGuid(), Status.Sent)
          .then(() => {
            console.log('MiraBox Status Updated to ' + Status.Sent);
            this.updateStatus();
          }, ()=>{console.log("Error updating mirabox status!")})
      })
      .catch(console.log);

  }

  public async gotoFillWithCoin() {

  }

  public updateBalance(boxItem: MiraBoxItem) {
    let self = this;
    let url;
    if (boxItem.headers.type.coin == Coin.BTC) {
      if (boxItem.headers.type.network == BtcNetwork.Live)
        url = `https://insight.bitpay.com/api/addr/${boxItem.headers.address}/balance`;
      else
        url = `https://test-insight.bitpay.com/api/addr/${boxItem.headers.address}/balance`;
    } else if (boxItem.headers.type.coin == Coin.BCH) {
      url = `https://bch-insight.bitpay.com/api/addr/${boxItem.headers.address}/balance`;
    }
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.readyState != 4) return;
      if (xhr.status != 200) {
        console.log(xhr.status + ': ' + xhr.statusText);
        self.currentBalance = -1;
      } else {
        console.log("Successfully got responce form blockchain.info!");
        self.currentBalance = JSON.parse(xhr.responseText);
      }

    }
  }

  public gotoOpenMiraBox() {
    // noinspection JSIgnoredPromiseFromCall
    if(this.ethAccount && this.ethAccountPassword) {
      this.navCtrl.push(NominalBoxOpeningViewer, {
        mirabox: this.miraBox,
        ethAccount: this.ethAccount,
        ethAccountPassword: this.ethAccountPassword
      });
    }else{
      alert('Ethereum account and password fields can\'t be empty!');
    }
  }


}
