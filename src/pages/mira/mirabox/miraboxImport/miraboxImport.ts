import {Component} from "@angular/core";
import {MiraboxImportProvider} from "../../../../providers/mirabox/miraboximport";
import {MiraBox} from "../../../../mira/mira";
import {MiraStorageProvider} from "../../../../providers/mirabox/mirastorage";
import {ModalController, NavController} from "ionic-angular";
import {NominalBoxViewer} from "../miraboxViewer/nominalBoxViewer/nominalBoxViewer";

import {PlatformProvider} from "../../../../providers/platform/platform";
import {InputPasswordModal} from "../inputPasswordModal/inputPasswordModal";

@Component({
  selector: 'mirabox-import-btn',
  templateUrl: 'miraboxImport.html'
})
export class MiraboxImportComponent {
  public isCordova;

  constructor(private miraboxImportProvider: MiraboxImportProvider,
              private platformProvider: PlatformProvider,
              private miraStorageProvider: MiraStorageProvider,
              private modalCtrl: ModalController,
              private navCtrl: NavController) {
    this.isCordova = this.platformProvider.isCordova;
  }

  public dealwithFile() {
    let self = this;
    let input = (<HTMLInputElement>document.getElementById("fileInput")).files[0];
    if (input) {
      let reader = new FileReader();
      reader.onload = function (e: any) {
        self
          .openEncodedMiraBox(e.target.result)
          .catch(reason => {
            console.log(reason)
          });
      };
      reader.readAsText(input);
    }
  }

  public importMiraBox() {
    let self = this;
    if (this.platformProvider.isCordova) {
      this.miraboxImportProvider
        .importMirabox()
        .then((encodedMiraBox: string) => {
          return self.openEncodedMiraBox(encodedMiraBox);
        })
        .catch(reason => {
          console.log(reason)
        });
    } else {
      let fileDialog = document.getElementById('fileInput');
      fileDialog.click();
    }
  }

  private openEncodedMiraBox(encodedMiraBox: string): Promise<any> {
    let self = this;
    return new Promise<MiraBox>(function (resolve, reject) {
      let miraBox = self.miraboxImportProvider.decode(encodedMiraBox, '');
      if (miraBox) {
        return resolve(miraBox);
      }
      let inputPassword = self.modalCtrl.create(
        InputPasswordModal,
        {
          title: "Enter password",
          onSubmit: password => {
            let miraBox = self.miraboxImportProvider.decode(encodedMiraBox, password);
            if (miraBox) {
              resolve(miraBox);
              return true;
            }
            return false;
          }
        }
      );
      inputPassword.onDidDismiss(() => {
        reject('canceled');
      });
      inputPassword.present();
    }).then((miraBox: MiraBox) => {
      return self.miraStorageProvider
        .storeMiraBox(miraBox)
        .then(() => {
          self.navCtrl.push(NominalBoxViewer, miraBox);
        });
    });
  }
}
