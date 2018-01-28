import {Component} from '@angular/core';
import {NavController} from "ionic-angular";
import {NewNominalBoxPage} from "./newNominalBox/newNominalBox";

@Component({
  selector: 'page-mirabox-new',
  templateUrl: 'newBox.html'
})
export class NewBoxPage {
  constructor(private navCtrl: NavController) {

  }
  public createSimpleMiraBox() {
    console.log('simple MiraBox');
    this.navCtrl.push(NewNominalBoxPage)
  }
  public  createMultiMiraBox() {
    console.log('simple MiraBox');
  }
  public  createSmartMiraBox() {
    console.log('simple MiraBox');
  }
}
