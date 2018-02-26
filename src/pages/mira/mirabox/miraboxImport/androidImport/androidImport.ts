import {Component} from "@angular/core";
import {ModalController, NavController, NavParams, Platform, ToastController} from "ionic-angular";
import {MiraBox} from "../../../../../mira/mira";
import {InputPasswordModal} from "../../inputPasswordModal/inputPasswordModal";
import {MiraboxImportProvider} from "../../../../../providers/mirabox/miraboximport";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";

@Component({
  selector: 'androidImportPage',
  templateUrl: 'androidImport.html'
})
export class AndroidImportPage {
  public creator = '*';
  public description = '*';
  public name = '*';
  public address = '*';
  private miraBox: MiraBox;

  constructor(private navCtrl: NavController,
              private navParams: NavParams,
              private miraboxImportProvider: MiraboxImportProvider,
              private modalCtrl: ModalController,
              private miraStorageProvider: MiraStorageProvider,
              private platform: Platform,
              private toastCtrl: ToastController) {
    this.importMiraBoxWithPath()
  }

  public importMiraBoxWithPath() {
    let self = this;
    (<any>window).plugins.intentShim.getIntent(
      function (intent) {
        try {
          var miraboxFile = intent.data;
        } catch (err) {
          console.log("Error: " + err);
          self.platform.exitApp();
          return;
        }
        self.miraboxImportProvider
          .importMiraboxWithPath(miraboxFile)
          .then((encodedMiraBox: string) => {
            return self.openEncodedMiraBox(encodedMiraBox);
          })
          .catch(reason => {
            console.log(reason)
          });

      },
      function () {
        console.log('Error getting launch intent');
      });


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
      this.creator = miraBox.getCreator().name;
      this.description = miraBox.getDescription();
      this.address = miraBox.getBoxItems()[0].headers.address;
      this.miraBox = miraBox;
    });
  }

  public import() {
    this.miraStorageProvider
      .storeMiraBox(this.miraBox)
      .then(() => {
        let toast = this.toastCtrl.create({
          message: 'MiraBox was added successfully',
          duration: 3000,
          position: 'middle'
        });
        toast.onDidDismiss(() => {
          this.platform.exitApp();
        });
        toast.present();
      });
  }

  public close() {
    this.platform.exitApp();
  }
}
