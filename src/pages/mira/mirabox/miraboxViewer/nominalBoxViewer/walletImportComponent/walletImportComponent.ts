import {Component, Input} from '@angular/core';
import {DecodedWallet} from "../../../../../../providers/mirabox/mirabox";
import {ProfileProvider} from "../../../../../../providers/profile/profile";

@Component({
  selector: 'wallet-import-component',
  templateUrl: 'walletImportComponent.html'
})
export class WalletImportComponent {

  constructor(private profileProvider: ProfileProvider) {
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
      .then(()=>{alert("Successfully imported")});
  }
}
