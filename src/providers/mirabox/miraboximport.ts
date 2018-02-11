import { FileChooser } from '@ionic-native/file-chooser';
import {PlatformProvider} from "../platform/platform";
import {Injectable} from "@angular/core";
import {File} from "@ionic-native/file";

@Injectable()
export class MiraboxImportProvider {
  constructor(private fileChooser: FileChooser,
              private platformProvider: PlatformProvider,
              private file:File,){

  }

  public importMirabox() {
    var miraboxDir = "";
    if (this.platformProvider.isCordova) {
      if (this.platformProvider.isAndroid)
        this.fileChooser.open().then((url) => {
          console.log(url);
          miraboxDir = url;
          window.resolveLocalFileSystemURL(miraboxDir, function (entry: any) {
            entry.file(function (file) {
              var reader = new FileReader();
              reader.onloadend = function (encodedFile: any) {
                console.log(encodedFile.target.result);
              };
              reader.readAsText(file);
            });
          }, (err) => {console.log("Error! "+err);});
        }
        );
    }
  }
}
