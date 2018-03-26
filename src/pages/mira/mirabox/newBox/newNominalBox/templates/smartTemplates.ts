import {Component} from "@angular/core";
import {Web3Provider} from "../../../../../../providers/mirabox/web3/web3";
import {SmartTemplatesProvider} from "../../../../../../providers/mirabox/smartbox-templates/smartbox-templates";
import {NavController, NavParams} from "ionic-angular";
import {TemplateViewerPage} from "./templateViewer/templateViewer";

@Component({
  selector: 'page-smarttemplates',
  templateUrl: 'smartTemplates.html'
})


export class SmartTemplatesPage {
  public templatesList;
  public chosenTemplate;

  constructor(private web3Provider: Web3Provider,
              private smartboxTemplatesProvider: SmartTemplatesProvider,
              private navCtrl: NavController,
              private navParams: NavParams) {
    this.smartboxTemplatesProvider.getTemplateList()
      .then((templateList) => {
        this.templatesList = templateList;
      })
  }

  public openTemplateViewer(_template: any) {
    let getTemplate = this.navParams.get('getTemplate');
    this.navCtrl.push(TemplateViewerPage, {getTemplate: getTemplate, template: _template});
  }
}
