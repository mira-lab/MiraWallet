import {Component, Input} from '@angular/core';
import {MiraBox} from "../../../../mira/mira";

@Component({
  selector: 'mirabox-list-item',
  templateUrl: 'boxListItem.html'
})
export class MiraBoxListItem {
  @Input()
  public miraBox: MiraBox;

  public goToMiraBoxView(): void {
    console.log(this.miraBox.getGuid());
  }
}
