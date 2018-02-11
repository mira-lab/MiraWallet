import {Component} from '@angular/core';
import {PlatformProvider} from "../../../../../providers/platform/platform";
import {MiraBoxExportProvider} from "../../../../../providers/mirabox/mirabox-export";
import {NavParams} from "ionic-angular";
import {MiraBox} from "../../../../../mira/mira";

@Component({
  selector: 'nominalBoxViewer.scss',
  templateUrl: 'nominalBoxViewer.html'
})
export class NominalBoxViewer {
  public isCordova: boolean;
  public miraBox: MiraBox;

  constructor(private platformProvider: PlatformProvider,
              private miraBoxExportProvider: MiraBoxExportProvider,
              private navParams: NavParams) {
    this.isCordova = this.platformProvider.isCordova;
    this.miraBox = navParams.data;
  }

  download() {
    if (this.platformProvider.isCordova) {
      this.miraBoxExportProvider.createFile(this.miraBox.toString());
    }
    else {
      let dataStr = "data:application/text;charset=utf-8," + this.miraBox.toString();
      let downloadAnchorNode = document.getElementById("not-cordova-download");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "mirabox.json");
    }
  }

  public sheetShare() {
    this.miraBoxExportProvider.ShareSocial();
  }

  public gotoFillWithCoin() {
    //todo
  }
}
