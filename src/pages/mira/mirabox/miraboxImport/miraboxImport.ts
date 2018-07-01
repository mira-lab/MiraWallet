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
        if (self.isAESEncrypted(e.target.result)) {
        self
          .openEncodedMiraBox(e.target.result)
          .catch(reason => {
            console.log(reason)
          });
        }else{
          self
            .openMiraBox(e.target.result)
            .catch(reason => {
              console.log(reason)
            });
        }
      };
      reader.readAsText(input);
    }
  }
  public isAESEncrypted(fileString: string): boolean{
    const aesEncryptedProperties = [
      'iv', 'v', 'iter', 'ks', 'ts',
      'mode', 'adata', 'cipher', 'salt', 'ct'
    ];
    try{
      let parsedObj = JSON.parse(fileString);
      return aesEncryptedProperties.every(aesProperty => parsedObj.hasOwnProperty(aesProperty));
    }
    catch(err){
      return false;
    }
  }

  public importMiraBox() {
    let self = this;
    if (this.platformProvider.isCordova) {
      this.miraboxImportProvider
        .importMirabox()
        .then((encodedMiraBox: string) => {
          if(this.isAESEncrypted(encodedMiraBox)) {
            return self.openEncodedMiraBox(encodedMiraBox);
          }else{
            return self.openMiraBox(encodedMiraBox);
          }
        })
        .catch(reason => {
          console.log(reason)
        });
    } else {
      let fileDialog = document.getElementById('fileInput');
      fileDialog.click();
    }
  }
  private openMiraBox(miraBoxString: string): Promise<any>{
    return new Promise<MiraBox>((resolve, reject) => {
      try{
        let miraBox = MiraBox.fromString(miraBoxString);
        return resolve(miraBox);
      }
      catch(err){
        return reject(err);
      }
    }).then((miraBox: MiraBox)=>{
      return this.miraStorageProvider
        .storeMiraBox(miraBox)
        .then(() => { this.navCtrl.push(NominalBoxViewer, miraBox );
      });
    })
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
