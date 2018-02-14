import {Injectable} from "@angular/core";
import {EncryptedResult, EthereumAccount, ParityNode, ParityProvider} from "../secret-store/secret-store";
import {MiraBoxCreator, MiraBox, MiraBoxWalletType, MiraBoxType, MiraBoxItem} from "../../mira/mira";
import {BwcProvider} from "../bwc/bwc";

const ethKey = require('keythereum');
const ethUtil = require('ethereumjs-util');

export enum BtcNetwork {
  Live = 'livenet',
  Test = 'testnet'
}

export interface DecodedWallet {
  miraBoxItem: MiraBoxItem,
  decryptedWallet: object
}

interface EncryptedGeneratedWallet {
  decryptedWallet: {
    xPubKey: string
  },
  encryptedWallet: object,
  password: string
}

@Injectable()
export class MiraBoxProvider {

  readonly BWS_INSTANCE_URL = 'https://bws.bitpay.com/bws/api';

  private parityNode = new ParityNode(
    'http://94.130.94.162',
    8545,
    8083);
  /*
    private ethereumAccount = new EthereumAccount(
      '0x00a329c0648769a73afac7f9381e08fb43dbea72',
      ''
    );
  */

  private ethereumAccount = new EthereumAccount(
    '0xd6e43ece2cb09626c0400f3f5e65872aedef7ce0',
    'password'
  );

  /*
    private ethereumAccount = new EthereumAccount(
      '0x00a329c0648769a73afac7f9381e08fb43dbea72',
      'password'
    );
  */


  private NODE_T = 0;

  constructor(private parityProvider: ParityProvider,
              private bwcProvider: BwcProvider) {
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

  private encodeWalletPasswordWithSecretStore(walletPassword: string): Promise<EncryptedResult> {
    let self = this;

    let hash: string = MiraBoxProvider.generateHash(walletPassword);

    return this.getEthereumAccountPrivateKeyPromise(this.parityNode, this.ethereumAccount)
      .then(ethereumPrivateKey => {
        self.ethereumAccount.setPrivateKey(ethereumPrivateKey);
        return self.parityProvider.secretStore.encodePromise(
          self.parityNode,
          self.ethereumAccount,
          hash,
          walletPassword,
          self.NODE_T)
      });
  }

  createNominalMiraBox(walletType: MiraBoxWalletType,
                       walletName: string,
                       copayerName: string,
                       boxDescription: string,
                       boxCreator: MiraBoxCreator,
                       walletMeta: object = {}): Promise<MiraBox> {
    let self = this;

    let createWalletPromise: Promise<EncryptedGeneratedWallet>;

    switch (walletType) {
      //to implement differentTypes of wallets
      case MiraBoxWalletType.BTC:
      case MiraBoxWalletType.BCH:
      default:
        createWalletPromise = this.generateNewEncodedBtcWallet(walletName, copayerName);
    }
    return createWalletPromise.then(function (encryptedWallet: EncryptedGeneratedWallet) {
      return self.encodeWalletPasswordWithSecretStore(encryptedWallet.password)
        .then(function (encryptedPasswordResult: EncryptedResult) {
          let boxItem: MiraBoxItem = {
            data: encryptedWallet.encryptedWallet,
            hash: encryptedPasswordResult.storageId,
            key: encryptedPasswordResult.encrypted,
            headers: {
              type: walletType,
              pubType: 'xpub',
              pub: encryptedWallet.decryptedWallet.xPubKey
            },
            meta: walletMeta
          };

          return new MiraBox(
            MiraBoxType.Nominal,
            boxCreator,
            [boxItem],
            boxDescription
          );
        });
    });
  }


  private static generateHash(data: string) {
    return ethUtil.sha3(data + new Date().toISOString())
      .toString('hex');
  }

  generateNewEncodedBtcWallet(walletName: string,
                              copayerName: string,
                              network: BtcNetwork = BtcNetwork.Live): Promise<EncryptedGeneratedWallet> {
    let self = this;
    return new Promise(function (resolve, reject) {
      let client = new self.bwcProvider.Client({
        baseUrl: self.BWS_INSTANCE_URL,
        verbose: false,
      });
      client.createWallet(
        walletName,
        copayerName,
        1, 1,
        {network: network},
        function (err, secret) {
          if (err) {
            return reject(err);
          }
          //Exporting wallet
          let exportedWallet = client.export();

          //AES encrypting it with generated password
          let encryptPassword = self.generatePassword(16);
          let encryptedWallet = self.bwcProvider.getSJCL().encrypt(encryptPassword, exportedWallet);
          resolve({
            decryptedWallet: JSON.parse(exportedWallet),
            encryptedWallet: encryptedWallet,
            password: encryptPassword
          });
        });
    });
  }

  private static getRandomByte() {
    let result = new Uint8Array(1);
    window.crypto.getRandomValues(result);
    return result[0];
  }

  private generatePassword(length: number) {
    let _pattern = /[a-zA-Z0-9_\-]/;
    return Array.apply(
      null,
      {'length': length}
    )
      .map(() => {
        let result;
        while (true) {
          result = String.fromCharCode(MiraBoxProvider.getRandomByte());
          if (_pattern.test(result)) {
            return result;
          }
        }
      }, this)
      .join('');
  }

  openMiraBox(miraBox: MiraBox): Promise<DecodedWallet[]> {
    let self = this;

    return this.getEthereumAccountPrivateKeyPromise(this.parityNode, this.ethereumAccount)
      .then(ethereumPrivateKey => {
        self.ethereumAccount.setPrivateKey(ethereumPrivateKey);

        let promiseList: Promise<any>[] = [];
        for (let miraBoxItem of miraBox.getBoxItems()) {
          let promise = new Promise<DecodedWallet>(function (resolve, reject) {
            self.parityProvider.secretStore.shadowDecode(
              self.parityNode,
              self.ethereumAccount,
              miraBoxItem.hash,
              miraBoxItem.key)
              .then(function (decryptedPassword) {
                let decryptedWallet = self.bwcProvider.getSJCL().decrypt(decryptedPassword, miraBoxItem.data);
                let encryptedWallet: DecodedWallet = {
                  decryptedWallet: JSON.parse(decryptedWallet),
                  miraBoxItem: miraBoxItem
                };
                resolve(encryptedWallet);
              })
          });
          promiseList.push(promise);
        }
        return Promise.all(promiseList);
      });

  }
}
