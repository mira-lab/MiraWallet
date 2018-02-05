import {Component} from '@angular/core';
import {NavController} from "ionic-angular";
import {NominalBoxViewer} from "../../../miraboxViewer/nominalBoxViewer/nominalBoxViewer";

@Component({
  selector: 'createPassword.scss',
  templateUrl: 'createPassword.html'
})
export class CreatePassword {
  constructor(private navCtrl: NavController){

  }
  public createBox(){
    //Need to be careful not to crush everything!
    //Removes pages from navctrl so that user can go back from new MiraBox to home page
    //If you want to change number of pages before new Mirabox page, change 3 to new value
    //todo: deal with it later
    this.navCtrl.push(NominalBoxViewer).then(() => {
      const index = this.navCtrl.getActive().index-3;
      this.navCtrl.remove(index, 3);
    });
  }
}
