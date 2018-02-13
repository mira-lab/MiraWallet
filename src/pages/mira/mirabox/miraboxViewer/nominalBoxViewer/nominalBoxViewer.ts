import {Component} from '@angular/core';
import {PlatformProvider} from "../../../../../providers/platform/platform";
import {MiraBoxExportProvider} from "../../../../../providers/mirabox/mirabox-export";
import {NavController, NavParams} from "ionic-angular";
import {MiraBox} from "../../../../../mira/mira";
import {NominalBoxOpeningViewer} from "./boxOpening/boxOpening";
import {BwcProvider} from "../../../../../providers/bwc/bwc";

@Component({
  selector: 'nominalBoxViewer',
  templateUrl: 'nominalBoxViewer.html'
})
export class NominalBoxViewer {
  public isCordova: boolean;
  public miraBox: MiraBox;
  public currentBalance: number;
  public miraBoxAdress;

  constructor(private platformProvider: PlatformProvider,
              private miraBoxExportProvider: MiraBoxExportProvider,
              private bwcProvider: BwcProvider,
              private navCtrl: NavController,
              navParams: NavParams) {
    this.isCordova = this.platformProvider.isCordova;
    this.miraBox = navParams.data;
    this.updateBalance();
    this.getAddress();
  }

  public getAddress() {
    let xpublicKey = this.bwcProvider.getBitcore().PublicKey.fromString(this.miraBox.getCreator().publicKey);
    this.miraBoxAdress = xpublicKey.toAddress('livenet');
  }

  download() {
    if (this.platformProvider.isCordova) {
      this.miraBoxExportProvider.createFile(this.miraBox.toString(), this.miraBox.getGuid());
    }
    else {
      let dataStr = "data:application/text;charset=utf-8," + this.miraBox.toString();
      let downloadAnchorNode = document.getElementById("not-cordova-download");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "mirabox.json");
    }
  }

  public sheetShare() {
    this.miraBoxExportProvider.ShareSocial(this.miraBox.toString(), this.miraBox.getGuid());
  }

  public gotoFillWithCoin() {
    //todo
  }

  public updateBalance() {
    let self = this;
    let pubkey = this.miraBox.getBoxItems()[0].headers.pub;
    let url = "https://blockchain.info/ru/balance?active=" + pubkey;
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
