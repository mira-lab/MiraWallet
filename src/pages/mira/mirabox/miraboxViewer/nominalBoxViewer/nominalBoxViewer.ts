import {Component} from '@angular/core';
import {PlatformProvider} from "../../../../../providers/platform/platform";
import {MiraBoxExportProvider} from "../../../../../providers/mirabox/mirabox-export";
import {ModalController, NavController, NavParams} from "ionic-angular";
import {MiraBox, MiraBoxItem} from "../../../../../mira/mira";
import {NominalBoxOpeningViewer} from "./boxOpening/boxOpening";
import {BwcProvider} from "../../../../../providers/bwc/bwc";
import {InputPasswordModal} from "../../inputPasswordModal/inputPasswordModal";
import {BtcNetwork} from "../../../../../providers/mirabox/mirabox";

@Component({
  selector: 'nominalBoxViewer',
  templateUrl: 'nominalBoxViewer.html'
})
export class NominalBoxViewer {
  public isCordova: boolean;
  public miraBox: MiraBox;
  public currentBalance: number;
  public boxItemAddress;

  constructor(private platformProvider: PlatformProvider,
              private miraBoxExportProvider: MiraBoxExportProvider,
              private bwcProvider: BwcProvider,
              private navCtrl: NavController,
              private modalCtrl: ModalController,
              navParams: NavParams) {
    this.isCordova = this.platformProvider.isCordova;
    this.miraBox = navParams.data;
    this.getAddress(this.miraBox.getBoxItems()[0]);
    this.updateBalance(this.miraBox.getBoxItems()[0]);
  }

  public getAddress(boxItem: MiraBoxItem) {
    try {
      let xPublicKey = this.bwcProvider.getBitcore().PublicKey.fromString(boxItem.headers.pub);
      this.boxItemAddress = xPublicKey.toAddress(boxItem.headers.type.network);
    }
    catch (e) {
      console.log(e);
    }
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
      })
      .catch(console.log);
  }

  public gotoFillWithCoin() {
    //todo
  }

  public updateBalance(boxItem: MiraBoxItem) {
    let self = this;
    let pubkey = boxItem.headers.pub;
    let url;
    if (boxItem.headers.type.network == BtcNetwork.Live)
      url = "https://blockchain.info/ru/balance?active=" + pubkey;
    else
      url = "https://testnet.blockchain.info/ru/balance?active=" + pubkey;
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
        let response = JSON.parse(xhr.responseText);
        self.currentBalance = response[pubkey].final_balance
      }

    }
  }

  public gotoOpenMiraBox() {
    // noinspection JSIgnoredPromiseFromCall
    this.navCtrl.push(NominalBoxOpeningViewer, this.miraBox);
  }
}
