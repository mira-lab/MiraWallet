import {Component} from "@angular/core";
import {NavParams, ViewController} from "ionic-angular";

@Component({
  selector: 'inputPasswordModal',
  templateUrl: 'inputPasswordModal.html'
})
export class InputPasswordModal {

  private onSubmit;
  public title;

  private password = '';

  constructor(public viewCtrl: ViewController,
              navParams: NavParams) {
    this.onSubmit = navParams.data.onSubmit;
    this.title = navParams.data.title;
  }

  submit() {
    if (this.onSubmit(this.password)) {
      this.dismiss();
    }
  }

  dismiss() {
    // noinspection JSIgnoredPromiseFromCall
    this.viewCtrl.dismiss();
  }
}
