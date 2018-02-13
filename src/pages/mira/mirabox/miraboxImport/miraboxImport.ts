import {Component} from "@angular/core";
import {MiraboxImportProvider} from "../../../../providers/mirabox/miraboximport";
import {MiraBox} from "../../../../mira/mira";
import {MiraStorageProvider} from "../../../../providers/mirabox/mirastorage";
import {NavController} from "ionic-angular";
import {NominalBoxViewer} from "../miraboxViewer/nominalBoxViewer/nominalBoxViewer";

import {PlatformProvider} from "../../../../providers/platform/platform";

@Component({
  selector: 'miraboxImport',
  templateUrl: 'miraboxImport.html'
})
export class MiraboxImportPage {
  public isCordova;

  constructor(private miraboxImportProvider: MiraboxImportProvider,
              private platformProvider: PlatformProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController) {
    this.isCordova = this.platformProvider.isCordova;
  }

  public dealwithFile() {
    let input = (<HTMLInputElement>document.getElementById("fileInput")).files[0];
    if (input) {
      let reader = new FileReader();
      reader.onload = function (e: any) {
        console.log(e.target.result);
      }
      reader.readAsText(input);
    }
  }


  public importMirabox() {
    let self = this;
    if (this.platformProvider.isCordova) {
      this.miraboxImportProvider.importMirabox().then((miraBox: MiraBox) => {
        return self.miraStorageProvider
          .storeMiraBox(miraBox)
          .then(() => {
            self.navCtrl.push(NominalBoxViewer, miraBox);
          });
      })
        .catch(reason => {
          console.log(reason)
        });
    } else {
      let fileDialog = document.getElementById('fileInput');
      fileDialog.click();
    }
  }
}
