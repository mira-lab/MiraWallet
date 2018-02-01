import {Injectable} from "@angular/core";
import {EncryptedResult, EthereumAccount, ParityNode, ParityProvider} from "../secret-store/secret-store";
import {
  MiraBoxCreator, MiraBoxWalletKeyPair, MiraBoxKeyPair, MiraBox, MiraKey, EncodedWallet,
  MiraBoxWalletType, MiraBoxType
} from "../../mira/mira";

const ethKey = require('keythereum');
const ethUtil = require('ethereumjs-util');

@Injectable()
export class MiraBoxProvider {
  private parityNode = new ParityNode(
    'http://94.130.94.162',
    8545,
    8083);

  private ethereumAccount = new EthereumAccount(
    '0x00a329c0648769a73afac7f9381e08fb43dbea72',
    ''
  );

  private NODE_T = 0;

  constructor(private parityProvider: ParityProvider) {
  }

  public createNominalMiraBox(walletType: MiraBoxWalletType,
                              walletName: string,
                              walletKeyPair: MiraBoxWalletKeyPair,
                              boxDescription: string,
                              boxCreator: MiraBoxCreator): Promise<MiraBoxKeyPair> {
    let self=this;
    return new Promise<MiraBoxKeyPair>(function (resolve) {
      self.createEncodedWallet(
        walletType,
        walletName,
        walletKeyPair,
        (encodedWallet: EncodedWallet, walletKey: string) => {
          let miraBox: MiraBox = new MiraBox(
            MiraBoxType.Nominal,
            boxCreator,
            encodedWallet,
            boxDescription);

          miraBox.generateGuid();

          let miraKey: MiraKey = new MiraKey(miraBox.getGuid(), walletKey);

          resolve({
            miraBox: miraBox,
            miraKey: miraKey
          })
        }
      );
    });
  }

  async getEthereumAccountPrivateKeyPromise(parityNode: ParityNode,
                                            ethAccount: EthereumAccount): Promise<string> {
    if (ethAccount.getPrivateKey()) {
      return ethAccount.getPrivateKey();
    }
    let unlockResult: boolean = await this.parityProvider.personal.unlockRequestPromise(parityNode, ethAccount);
    if (!unlockResult) {
      throw "Cannot unlock account";
    }
    let account = await this.parityProvider.accounts.exportAccount(parityNode, ethAccount);
    if (!account) {
      throw "Cannot export account";
    }
    let ethPrivateKey: Buffer = ethKey.recover(ethAccount.getPassword(), account);
    ethAccount.setPrivateKey(ethPrivateKey.toString('hex'));
    return ethAccount.getPrivateKey();
  }

  private encodeKeyWithSecretStorePromise(walletPrivateKey: string): Promise<EncryptedResult> {
    let self = this;

    let tmp = walletPrivateKey + new Date().toISOString();
    let miraBoxSecretId: string = ethUtil.sha3(tmp).toString('hex');

    return this.getEthereumAccountPrivateKeyPromise(this.parityNode, this.ethereumAccount)
      .then(ethereumPrivateKey => {
        console.log(ethereumPrivateKey);
        return self.parityProvider.secretStore.encodePromise(
          self.parityNode,
          self.ethereumAccount,
          miraBoxSecretId,
          walletPrivateKey,
          self.NODE_T)
      });
  }

  private createEncodedWallet(walletType: MiraBoxWalletType,
                              walletName: string,
                              walletKeyPair: MiraBoxWalletKeyPair,
                              onComplete: (encodedWallet: EncodedWallet,
                                           walletKey: string) => void) {
    this.encodeKeyWithSecretStorePromise(walletKeyPair.privateKey)
      .then((encodeResult: EncryptedResult) => {
        let encodedWallet = new EncodedWallet(
          walletType,
          walletName,
          walletKeyPair.publicKey,
          encodeResult.encrypted);

        onComplete(encodedWallet, encodeResult.storageId);
      });
  }
}
