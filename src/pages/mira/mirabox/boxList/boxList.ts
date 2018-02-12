import {Component} from '@angular/core';
import {MiraBox} from "../../../../mira/mira";
import {MiraStorageProvider} from "../../../../providers/mirabox/mirastorage";


@Component({
  selector: 'boxList',
  templateUrl: 'boxList.html'
})
export class BoxListPage {
  miraBoxList: MiraBox[];

  public constructor(private miraStorageProvider: MiraStorageProvider) {
  }

  ngOnInit() {
    this.loadBoxList();
  }

  loadBoxList() {
    let self = this;
    this.miraStorageProvider.getMiraBoxList()
      .then(function (miraBoxSet: Set<MiraBox>) {
        self.miraBoxList = Array.from(miraBoxSet);
      })
  }
}
