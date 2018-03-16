import {NavController, NavParams} from "ionic-angular";
import {Component} from "@angular/core";

@Component({
  selector: 'page-templateviewer',
  templateUrl: 'templateViewer.html'
})


export class TemplateViewerPage {
  public template;
  constructor(private navParams: NavParams) {
    this.template = this.navParams.get('template');
  }

}
