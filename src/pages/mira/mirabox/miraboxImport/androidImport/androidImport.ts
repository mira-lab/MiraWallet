import {Component} from "@angular/core";
import {ModalController, NavController, NavParams, Platform, ToastController, App} from "ionic-angular";
import {MiraBox} from "../../../../../mira/mira";
import {InputPasswordModal} from "../../inputPasswordModal/inputPasswordModal";
import {MiraboxImportProvider} from "../../../../../providers/mirabox/miraboximport";
import {MiraStorageProvider} from "../../../../../providers/mirabox/mirastorage";
import {TabsPage} from "../../../../tabs/tabs";

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
  private canGoBack: boolean = false;
  private data;
  constructor(private appCtrl: App,
              private navCtrl: NavController,
              private navParams: NavParams,
              private miraboxImportProvider: MiraboxImportProvider,
              private modalCtrl: ModalController,
              private miraStorageProvider: MiraStorageProvider,
              private platform: Platform,
              private toastCtrl: ToastController) {
    this.canGoBack = this.navParams.get('canGoBack');
    this.data = this.navParams.get('data')
    this.importMiraBoxWithPath();
  }

  public importMiraBoxWithPath() {
    let self = this;
    let miraboxFile;
    if(this.canGoBack) {
      self.miraboxImportProvider
        .importMiraboxWithPath(this.data)
        .then((encodedMiraBox: string) => {
          return self.openEncodedMiraBox(encodedMiraBox);
        })
        .catch(reason => {
          console.log(reason)
        });
    }
    else {
      (<any>window).plugins.intentShim.getIntent(
        function (intent) {
          try {
            miraboxFile = intent.data;
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
          if(this.canGoBack) {
            this.appCtrl.getRootNav().setRoot(TabsPage);
          }
          else
            this.platform.exitApp();
        });
        toast.present();
      });
  }

  public close() {
    if(this.canGoBack)
      this.appCtrl.getRootNav().setRoot(TabsPage);
    else
      this.platform.exitApp();
  }
}
