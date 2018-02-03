import {Injectable} from "@angular/core";
import {Platform} from "ionic-angular";
import {File} from "@ionic-native/file";
import {SocialSharing} from "@ionic-native/social-sharing";

@Injectable()
export class MiraBoxExportProvider{
  public miraBoxPath: string;
  constructor(private platform: Platform,
              private file:File,
              private socialSharing: SocialSharing){


  }
  //TODO Change to mirabox format from txt
  public createFile(){
    var self = this;
    var exportDirectory = "";
    var filename = "example.txt";
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
      console.log("Got directoryEntry. Attempting to create file:" + filename);
      directoryEntry.filesystem.root.getFile(filename, {create: true}, function (fileEntry) {
        console.log("Got fileEntry for: " + filename);
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            self.miraBoxPath = fileEntry.toURL();
            console.log("File save location:" + self.miraBoxPath);
          }
          console.log("Got fileWriter");
          // make your callback to write to the file here...
          var blob = new Blob(["test text"], { type: 'application/json' });
          fileWriter.write(blob);

          }, (err) => {console.log("Error! "+err);});
        }, (err) => {console.log("Error! "+err);});
    }, (err) => {console.log("Error! "+err);});
  }
  //TODO: check if mirabox exists
  public miraBoxEmailSharing(){
    if(this.miraBoxPath) {
      this.socialSharing.canShareViaEmail().then(() => {
        // Sharing via email is possible
        this.socialSharing.shareViaEmail('Mirabox message', 'Mirabox', ['examle@gmail.com'], null, null, this.miraBoxPath).then(() => {
          console.log("Ok!")
          // Success!
        }).catch(() => {
          // Error!
        });
      }).catch(() => {
        console.log("cant share")
        // Sharing via email is not possible
      });
    }
  }
  public miraBoxTelegramSharing(){
    if(this.miraBoxPath)
      this.socialSharing.share("MiraBox", "Mirabox",this.miraBoxPath);
  }
}
