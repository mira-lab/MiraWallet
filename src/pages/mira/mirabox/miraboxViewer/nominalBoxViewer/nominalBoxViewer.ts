import {Component} from '@angular/core';
import {PlatformProvider} from "../../../../../providers/platform/platform";
import {MiraBoxExportProvider} from "../../../../../providers/mirabox/mirabox-export";
import {NavParams} from "ionic-angular";
import {EncodedWallet, MiraBox} from "../../../../../mira/mira";
import {BwcProvider} from "../../../../../providers/bwc/bwc";


@Component({
  selector: 'nominalBoxViewer.scss',
  templateUrl: 'nominalBoxViewer.html'
})
export class NominalBoxViewer {
  public isCordova: boolean;
  public miraBox: MiraBox;

  constructor(private platformProvider: PlatformProvider,
              private miraBoxExportProvider: MiraBoxExportProvider,
              private navParams: NavParams){
    this.isCordova = this.platformProvider.isCordova;
    this.miraBox = navParams.data;
  }
  public notCordovaDownload(){
    //Uncomment for json:
    //this.downloadObjectAsJson(Mirabox.tojsonobj());
    this.tempDownload();
  }
//Uncomment for json:
  /*
private downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.getElementById("not-cordova-download");
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    //downloadAnchorNode.click();
    //downloadAnchorNode.remove();
  }*/
  private tempDownload(){
    var dataStr = "data:application/json;charset=utf-8,texttexttext";
    var downloadAnchorNode = document.getElementById("not-cordova-download");
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "mirabox.json");
    //downloadAnchorNode.click();
  }
  public multiPlatformDownload(){
    this.miraBoxExportProvider.createFile();
  }
  public shareviaEmail(){
    this.miraBoxExportProvider.miraBoxEmailSharing();
  }
  public sheetShare(){
    this.miraBoxExportProvider.miraBoxTelegramSharing();
  }

  public gotoFillWithCoin(){
    //todo
  }
}
