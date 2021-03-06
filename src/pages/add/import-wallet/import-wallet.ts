import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { HomePage } from '../../../pages/home/home';

// Providers
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PopupProvider } from '../../../providers/popup/popup';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html'
})
export class ImportWalletPage {

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private importForm: FormGroup;
  private reader: FileReader;
  private defaults: any;
  private errors: any;

  public importErr: boolean;
  public fromOnboarding: boolean;
  public formFile: any;
  public showAdvOpts: boolean;
  public selectedTab: string;
  public isCordova: boolean;
  public isSafari: boolean;
  public file: File;
  public testnetEnabled: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private form: FormBuilder,
    private bwcProvider: BwcProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private popupProvider: PopupProvider,
    private platformProvider: PlatformProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider
  ) {
    this.reader = new FileReader();
    this.defaults = this.configProvider.getDefaults();
    this.errors = bwcProvider.getErrors();

    this.isCordova = this.platformProvider.isCordova;
    this.isSafari = this.platformProvider.isSafari;
    this.importErr = false;
    this.fromOnboarding = this.navParams.data.fromOnboarding;
    this.selectedTab = 'words';
    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;
    this.formFile = null;

    this.importForm = this.form.group({
      words: [null, Validators.required],
      backupText: [null],
      mnemonicPassword: [null],
      file: [null],
      filePassword: [null],
      derivationPath: [this.derivationPathByDefault, Validators.required],
      testnet: [false],
      bwsURL: [this.defaults.bws.url],
      coin: [this.navParams.data.coin ? this.navParams.data.coin : 'btc']
    });
  }

  ionViewWillEnter() {
    if (this.navParams.data.code) {
      this.processWalletInfo(this.navParams.data.code);
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;

    switch (tab) {
      case 'words':
        this.importForm.get('words').setValidators([Validators.required]);
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
      case 'file':
        if (this.isCordova || this.isSafari) this.importForm.get('backupText').setValidators([Validators.required]);
        else this.importForm.get('file').setValidators([Validators.required]);
        this.importForm.get('filePassword').setValidators([Validators.required]);
        this.importForm.get('words').clearValidators();
        break;

      default:
        this.importForm.get('words').clearValidators();
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
    }
    this.importForm.get('words').updateValueAndValidity();
    this.importForm.get('file').updateValueAndValidity();
    this.importForm.get('filePassword').updateValueAndValidity();
  }

  normalizeMnemonic(words: string) {
    if (!words || !words.indexOf) return words;
    var isJA = words.indexOf('\u3000') > -1;
    var wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  }

  private processWalletInfo(code: string): void {
    if (!code) return;

    this.importErr = false;
    let parsedCode = code.split('|');

    if (parsedCode.length != 5) {
      /// Trying to import a malformed wallet export QR code
      this.popupProvider.ionicAlert('Error', 'Incorrect code format', 'Ok'); //TODO gettextcatalog
      return;
    }

    let info = {
      type: parsedCode[0],
      data: parsedCode[1],
      network: parsedCode[2],
      derivationPath: parsedCode[3],
      hasPassphrase: parsedCode[4] == 'true' ? true : false
    };

    if (info.type == '1' && info.hasPassphrase)
      this.popupProvider.ionicAlert('Error', 'Password required. Make sure to enter your password in advanced options', 'Ok'); //TODO gettextcatalog

    this.testnetEnabled = info.network == 'testnet' ? true : false;
    this.importForm.controls['derivationPath'].setValue(info.derivationPath);
    this.importForm.controls['words'].setValue(info.data);
  }

  public setDerivationPath(): void {
    let path = this.testnetEnabled ? this.derivationPathForTestnet : this.derivationPathByDefault;
    this.importForm.controls['derivationPath'].setValue(path);
  }

  private importBlob(str: string, opts: any): void {
    let str2: string;
    let err: any = null;
    try {
      str2 = this.bwcProvider.getSJCL().decrypt(this.importForm.value.filePassword, str);
    } catch (e) {
      err = 'Could not decrypt file, check your password'; //TODO gettextcatalog
      this.logger.warn(e);
    };

    if (err) {
      this.popupProvider.ionicAlert('Error', err, 'Ok'); //TODO gettextcatalog
      return;
    }

    this.onGoingProcessProvider.set('importingWallet', true);
    opts.compressed = null;
    opts.password = null;

    setTimeout(() => {
      this.profileProvider.importWallet(str2, opts).then((wallet: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.finish(wallet);
      }).catch((err: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.popupProvider.ionicAlert('Error', err, 'Ok'); //TODO gettextcatalog
        return;
      });
    }, 100);
  }

  private finish(wallet: any): void {
    this.walletProvider.updateRemotePreferences(wallet).then(() => {
      this.profileProvider.setBackupFlag(wallet.credentials.walletId);
      if (this.fromOnboarding) {
        this.profileProvider.setDisclaimerAccepted().catch((err: any) => {
          this.logger.error(err);
        });
      }
      this.navCtrl.setRoot(HomePage);
      this.navCtrl.popToRoot();
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  private importExtendedPrivateKey(xPrivKey, opts) {
    this.onGoingProcessProvider.set('importingWallet', true);
    setTimeout(() => {
      this.profileProvider.importExtendedPrivateKey(xPrivKey, opts).then((wallet: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.finish(wallet);
      }).catch((err: any) => {
        if (err instanceof this.errors.NOT_AUTHORIZED) {
          this.importErr = true;
        } else {
          this.popupProvider.ionicAlert('Error', err, 'Ok'); // TODO: gettextcatalog
        }
        this.onGoingProcessProvider.set('importingWallet', false);
        return;
      });
    }, 100);
  }

  private importMnemonic(words: string, opts: any): void {
    this.onGoingProcessProvider.set('importingWallet', true);
    setTimeout(() => {
      this.profileProvider.importMnemonic(words, opts).then((wallet: any) => {
        this.onGoingProcessProvider.set('importingWallet', false);
        this.finish(wallet);
      }).catch((err: any) => {
        if (err instanceof this.errors.NOT_AUTHORIZED) {
          this.importErr = true;
        } else {
          this.popupProvider.ionicAlert('Error', err, 'Ok'); // TODO: gettextcatalog
        }
        this.onGoingProcessProvider.set('importingWallet', false);
        return;
      });
    }, 100);
  }


  import() {
    if (this.selectedTab === 'file') {
      this.importFromFile();
    } else {
      this.importFromMnemonic();
    }
  }

  public importFromFile(): void {
    if (!this.importForm.valid) {
      this.popupProvider.ionicAlert('Error', 'There is an error in the form', 'Ok'); // TODO: gettextcatalog
      return;
    }

    let backupFile = this.file;
    let backupText = this.importForm.value.backupText;

    if (!backupFile && !backupText) {
      this.popupProvider.ionicAlert('Error', 'Please, select your backup file', 'Ok'); // TODO: gettextcatalog
      return;
    }

    if (backupFile) {
      this.reader.readAsBinaryString(backupFile);
    } else {
      let opts: any = {};
      opts.bwsurl = this.importForm.value.bwsurl;
      opts.coin = this.importForm.value.coin;
      this.importBlob(backupText, opts);
    }
  }

  public importFromMnemonic(): void {
    if (!this.importForm.valid) {
      this.popupProvider.ionicAlert('Error', 'There is an error in the form', 'Ok'); // TODO: gettextcatalog
      return;
    }

    let opts: any = {};

    if (this.importForm.value.bwsurl)
      opts.bwsurl = this.importForm.value.bwsurl;

    let pathData: any = this.derivationPathHelperProvider.parse(this.importForm.value.derivationPath);

    if (!pathData) {
      this.popupProvider.ionicAlert('Error', 'Invalid derivation path', 'Ok'); // TODO: gettextcatalog
      return;
    }

    opts.account = pathData.account;
    opts.networkName = pathData.networkName;
    opts.derivationStrategy = pathData.derivationStrategy;
    opts.coin = this.importForm.value.coin;

    let words: string = this.importForm.value.words || null;

    if (!words) {
      this.popupProvider.ionicAlert('Error', 'Please enter the recovery phrase', 'Ok');
      return;
    } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
      return this.importExtendedPrivateKey(words, opts);
    } else {
      let wordList: Array<any> = words.split(/[\u3000\s]+/);

      if ((wordList.length % 3) != 0) {
        this.popupProvider.ionicAlert('Error', 'Wrong number of recovery words: ' + wordList.length, 'Ok');
        return;
      }
    }

    opts.passphrase = this.importForm.value.passphrase || null;
    this.importMnemonic(words, opts);
  }

  public toggleShowAdvOpts(): void {
    this.showAdvOpts = !this.showAdvOpts;
  }

  public fileChangeEvent($event: any) {
    this.file = $event.target ? $event.target.files[0] : $event.srcElement.files[0];
    this.formFile = $event.target.value;
    this.getFile();
  }

  private getFile() {
    // If we use onloadend, we need to check the readyState.
    this.reader.onloadend = (evt: any) => {
      if (evt.target.readyState == 2) { // DONE == 2
        let opts: any = {};
        opts.bwsurl = this.importForm.value.bwsurl;
        opts.coin = this.importForm.value.coin;
        this.importBlob(evt.target.result, opts);
      }
    }
  }

  public openScanner(): void {
    if (this.navParams.data.fromScan) {
      this.navCtrl.popToRoot();
    } else {
      this.navCtrl.setRoot(HomePage);
      this.navCtrl.popToRoot();
      this.navCtrl.parent.select(2);
    }
  }

}
