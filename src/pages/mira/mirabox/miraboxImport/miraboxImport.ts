import {Component} from "@angular/core";
import {MiraboxImportProvider} from "../../../../providers/mirabox/miraboximport";
import {MiraBox} from "../../../../mira/mira";
import {MiraStorageProvider} from "../../../../providers/mirabox/mirastorage";
import {NavController} from "ionic-angular";
import {NominalBoxViewer} from "../miraboxViewer/nominalBoxViewer/nominalBoxViewer";


@Component({
  selector: 'miraboxImport',
  templateUrl: 'miraboxImport.html'
})
export class MiraboxImportPage {
  constructor(private miraboxImportProvider: MiraboxImportProvider,
              private miraStorageProvider: MiraStorageProvider,
              private navCtrl: NavController) {
  }

  public importMirabox() {
    let self = this;
    this.miraboxImportProvider.importMirabox()
      .then((miraBox: MiraBox) => {
        return self.miraStorageProvider
          .storeMiraBox(miraBox)
          .then(() => {
            self.navCtrl.push(NominalBoxViewer, miraBox);
          });
      })
      .catch(reason => {
        console.log(reason)
      });
  }
}
