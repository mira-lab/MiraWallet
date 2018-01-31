import {Component} from '@angular/core';
import {NavController} from "ionic-angular";
import {CreatePassword} from "../createPassword/createPassword";

@Component({
  selector: 'selectCryptocurrency.scss',
  templateUrl: 'selectCryptocurrency.html'
})
export class SelectCryptocurrency {
  constructor(private navCtrl: NavController){

  }
  public gotoBTC(){
    this.navCtrl.push(CreatePassword);
  }
}
