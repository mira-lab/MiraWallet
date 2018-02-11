import {Injectable} from "@angular/core";
import {Platform} from "ionic-angular";
import {File} from "@ionic-native/file";
import {SocialSharing} from "@ionic-native/social-sharing";

@Injectable()
export class MiraBoxExportProvider {
  miraBoxPath: string;

  constructor(private platform: Platform,
              private file: File,
              private socialSharing: SocialSharing) {
  }

  //TODO Change to mirabox format from txt
  public createFile(fileContent: string) {
    let self = this;
    let exportDirectory = "";
    let filename = "example.txt";
    //data = JSON.stringify(data, null, '\t');
    if (this.file.documentsDirectory !== null) {
      // iOS, OSX
      exportDirectory = this.file.documentsDirectory;
    } else if (this.file.sharedDirectory !== null) {
      // BB10
      exportDirectory = this.file.sharedDirectory;
    } else if (this.file.externalRootDirectory !== null) {
      // Android, BB10
      exportDirectory = this.file.externalRootDirectory;
    } else {
      // iOS, Android, BlackBerry 10, windows
      exportDirectory = this.file.dataDirectory;
    }
    window.resolveLocalFileSystemURL(exportDirectory, function (directoryEntry) {
      directoryEntry.filesystem.root.getFile(filename, {create: true}, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            self.miraBoxPath = fileEntry.toURL();
          };
          let blob = new Blob([fileContent], {type: 'application/text'});
          fileWriter.write(blob);
        }, (err) => {
          console.log("Error! " + err);
        });
      }, (err) => {
        console.log("Error! " + err);
      });
    }, (err) => {
      console.log("Error! " + err);
    });
  }

  //tododaniil
  public ShareSocial() {
    if (this.miraBoxPath)
      this.socialSharing.share("MiraBox", "Mirabox", this.miraBoxPath);
  }
}
