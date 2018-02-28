import {FileChooser} from '@ionic-native/file-chooser';
import {PlatformProvider} from "../platform/platform";
import {Injectable} from "@angular/core";
import {MiraBox} from "../../mira/mira";
import {BwcProvider} from "../bwc/bwc";

@Injectable()
export class MiraboxImportProvider {
  constructor(private fileChooser: FileChooser,
              private bwcProvider: BwcProvider,
              private platformProvider: PlatformProvider) {

  }

  public importMirabox(): Promise<string> {
    let self = this;
    let miraboxDir = "";
    return new Promise<string>(function (resolve, reject) {
      if (self.platformProvider.isCordova) {
        if (self.platformProvider.isAndroid)
          self.fileChooser
            .open()
            .then((url) => {
                console.log(url);
                miraboxDir = url;
                window.resolveLocalFileSystemURL(miraboxDir, function (entry: any) {
                  entry.file(function (file) {
                    let reader = new FileReader();
                    reader.onloadend = function (encodedFile: any) {
                      try {
                        resolve(encodedFile.target.result);
                      }
                      catch (exception) {
                        reject(exception);
                      }
                    };
                    reader.readAsText(file);
                  });
                }, (err) => {
                  reject(err);
                });
              }
            );
      }
    });
  }
  public importMiraboxWithPath(miraboxPath : string): Promise<string> {
    return new Promise<string>(function (resolve, reject) {
      window.resolveLocalFileSystemURL(miraboxPath, function (entry: any) {
        entry.file(function (file) {
          let reader = new FileReader();
          reader.onloadend = function (encodedFile: any) {
            try {
              resolve(encodedFile.target.result);
            }
            catch (exception) {
              reject(exception);
            }
          };
          reader.readAsText(file);
        });
      }, (err) => {
        reject(err);
      });
    });
  }
  public decode(encoded: string, password: string): MiraBox {
    try {
      let decrypted = this.bwcProvider.getSJCL().decrypt(password, encoded);
      return MiraBox.fromString(decrypted);
    }
    catch (e) {
      return null;
    }
  }
}
