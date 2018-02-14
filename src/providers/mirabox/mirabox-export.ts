import {Injectable} from "@angular/core";
import {File} from "@ionic-native/file";
import {SocialSharing} from "@ionic-native/social-sharing";

@Injectable()
export class MiraBoxExportProvider {
  miraBoxPath: string;

  constructor(private file: File,
              private socialSharing: SocialSharing) {
  }

  //TODO Change to mirabox format from txt
  public createFile(fileContent: string, filename: string) {
    let self = this;
    let exportDirectory = "";
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
  public ShareSocial(fileContent: string, guid: string) {
    let self = this;
    window.resolveLocalFileSystemURL(this.file.cacheDirectory, function (directoryEntry) {
      directoryEntry.filesystem.root.getFile(guid + '.mbox', {create: true}, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            self.socialSharing.share(null, null, fileEntry.toURL())
              .then(() => {
                fileEntry.remove(() => {
                  console.log('Successfully removed Mirabox!')
                }, (err) => {
                  console.log("Error with removing Mirabox: " + err);
                })
              }, (err) => {
                console.log("Most likely user cancelled sharing: " + err);
              })
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
}
