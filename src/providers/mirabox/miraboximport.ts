import {FileChooser} from '@ionic-native/file-chooser';
import {PlatformProvider} from "../platform/platform";
import {Injectable} from "@angular/core";
import {MiraBox} from "../../mira/mira";

@Injectable()
export class MiraboxImportProvider {
  constructor(private fileChooser: FileChooser,
              private platformProvider: PlatformProvider) {

  }

  public importMirabox() :Promise<MiraBox>{
    let self = this;
    let miraboxDir = "";
    return new Promise<MiraBox>(function (resolve, reject) {
      if (self.platformProvider.isCordova) {
        if (self.platformProvider.isAndroid)
          self.fileChooser.open().then((url) => {
              console.log(url);
              miraboxDir = url;
              window.resolveLocalFileSystemURL(miraboxDir, function (entry: any) {
                entry.file(function (file) {
                  let reader = new FileReader();
                  reader.onloadend = function (encodedFile: any) {
                    try {
                      let importedMiraBox: MiraBox = MiraBox.fromString(encodedFile.target.result);
                      resolve(importedMiraBox);
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
}
