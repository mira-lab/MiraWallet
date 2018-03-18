import {NavController, NavParams} from "ionic-angular";
import {Component} from "@angular/core";
import {SmartTemplatesProvider} from "../../../../../../../providers/mirabox/smartbox-templates/smartbox-templates";
import {NewNominalBoxPage} from "../../newNominalBox";

@Component({
  selector: 'page-templateviewer',
  templateUrl: 'templateViewer.html'
})


export class TemplateViewerPage {
  public template;
  public isAcceptDisabled: boolean = true;

  constructor(private navParams: NavParams,
              private smartboxTemplatesProvider: SmartTemplatesProvider,
              private navCtrl: NavController) {
    this.template = JSON.parse(JSON.stringify(this.navParams.get('template')));
    console.log("const");
  }
  ionViewDidEnter(){
    let inputs = document.getElementsByClassName('clearThis')
    for(let i = 0; i<inputs.length; i++){
      (<HTMLInputElement>inputs[i]).value = "";
    }
  }
  public setSettings() {
    this.smartboxTemplatesProvider.setTemplate(this.template);
    this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
  }

  public checkDisabled() {
    let setOptsCounter = 0;
    this.template.settings.map(item => {
      if (item.value != undefined && item.value != "")
        setOptsCounter++;
    });
    this.isAcceptDisabled = setOptsCounter == this.template.settings.length ? false : true;
  }
}
