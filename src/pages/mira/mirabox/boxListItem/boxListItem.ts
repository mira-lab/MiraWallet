import {Component, Input} from '@angular/core';
import {MiraBox, MiraBoxType} from "../../../../mira/mira";
import {NavController} from "ionic-angular";
import {NominalBoxViewer} from "../miraboxViewer/nominalBoxViewer/nominalBoxViewer";

@Component({
  selector: 'mirabox-list-item',
  templateUrl: 'boxListItem.html'
})
export class MiraBoxListItem {
  constructor(private navCtrl: NavController) {
  }

  @Input()
  public miraBox: MiraBox;

  public goToMiraBoxView(): void {
    console.log(this.miraBox.getGuid());
    switch (this.miraBox.getType()) {
      case MiraBoxType.Nominal:
        this.navCtrl.push(NominalBoxViewer, this.miraBox);
        break;
      case MiraBoxType.Multi:
      case MiraBoxType.Smart:
        console.info('Not implemented yet');
        break;
      default:
        throw 'fucked up';
    }
  }
}
