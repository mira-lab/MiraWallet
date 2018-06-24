import {Component, Input} from '@angular/core';
import {DecodedWallet} from "../../../../../../providers/mirabox/mirabox";
import {ProfileProvider} from "../../../../../../providers/profile/profile";
import {NavController} from "ionic-angular";


@Component({
  selector: 'wallet-import-component',
  templateUrl: 'walletImportComponent.html'
})
export class WalletImportComponent {

  constructor(private profileProvider: ProfileProvider,
              private navCtrl: NavController) {
  }

  @Input()
  public decodedWallet: DecodedWallet;

  importWallet() {
    let options = {
      compressed: null,
      password: null
    };
    this.profileProvider
      .importWallet(JSON.stringify(this.decodedWallet.decryptedWallet), options)
      .then(()=>{
        this.navCtrl.popToRoot();
        alert("Successfully imported")})
      .catch((err)=>{
        alert(err);
      })
  }
}
