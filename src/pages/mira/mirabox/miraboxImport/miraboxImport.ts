import {Component} from "@angular/core";
import {MiraboxImportProvider} from "../../../../providers/mirabox/miraboximport";


@Component({
  selector: 'miraboxImport',
  templateUrl: 'miraboxImport.html'
})
export class MiraboxImportPage {
  constructor(private miraboxImportProvider:MiraboxImportProvider) { }
  public importMirabox() {
    this.miraboxImportProvider.importMirabox();
  }
}
