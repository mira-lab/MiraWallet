import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";

const secp256k1 = require('secp256k1');

export class ParityNode {
  constructor(private nodeAddress: string,
              private nodeCommonRpcPort: number = 8545,
              private nodeSecretStoreRpcPort: number = 8082) {

  }

  getNodeAddress(): string {
    return this.nodeAddress;
  }

  getRpcPort(): number {
    return this.nodeCommonRpcPort;
  }

  getSecretStoreRpcPort(): number {
    return this.nodeSecretStoreRpcPort;
  }
}

export class EthereumAccount {
  constructor(private address: string,
              private password: string,
              private privateKey: string = null) {
  }

  getAddress(): string {
    return this.address;
  }

  getPassword(): string {
    return this.password;
  }

  getPrivateKey(): string {
    return this.privateKey;
  }

  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey;
  }
}

export interface EncryptedResult {
  storageId: string,
  encrypted: string
}

@Injectable()
class ParitySecretStore {
  constructor(private httpClient: HttpClient) {
  }

  private static getSignature(storageId: string, ethPrivateKey: string): string {
    let signedStorageId = secp256k1.sign(
      Buffer.from(storageId, 'hex'),
      Buffer.from(ethPrivateKey, 'hex')
    );
    return signedStorageId.signature.toString('hex') + ('0' + signedStorageId.recovery.toString(16));
  }

  /**
   * Create document key & encrypt data
   * @param parityNode
   * @param ethereumAccount
   * @param storageId
   * @param encodeData
   * @param nodeT
   */
  encodePromise(parityNode: ParityNode,
                ethereumAccount: EthereumAccount,
                storageId: string,
                encodeData: string,
                nodeT: number): Promise<any> {
    let self = this;

    let hexSignature: string = ParitySecretStore.getSignature(storageId, ethereumAccount.getPrivateKey());
    let encodeHexData: string = new Buffer(encodeData).toString('hex');

    return new Promise(function (resolve, reject) {
      let url = `${parityNode.getNodeAddress()}:${parityNode.getSecretStoreRpcPort()}/${storageId}/${hexSignature}/${nodeT}`;
      self.httpClient.post(url, encodeHexData)
        .subscribe(
          (response: string) => {
            resolve(response);
          },
          (httpErrorResponse: HttpErrorResponse) => {
            reject(httpErrorResponse.message);
          });
    }).then(
      (documentKey: string) => {

        console.log('Simultaneously generate server-side and document key:', documentKey, '\n');

        return new Promise((resolve, reject) => {
          self.httpClient.post(
            `${parityNode.getNodeAddress()}:${parityNode.getRpcPort()}`,
            {
              "jsonrpc": "2.0",
              "method": "secretstore_encrypt",
              "params": [
                ethereumAccount.getAddress(),
                ethereumAccount.getPassword(),
                documentKey,
                `0x${encodeHexData}`,
              ],
              id: 1
            })
            .subscribe(
              function (response: any) {
                let encryptedResult: EncryptedResult = {
                  storageId: storageId,
                  encrypted: response.result
                };
                resolve(encryptedResult);
              },
              (httpErrorResponse: HttpErrorResponse) => {
                reject(httpErrorResponse);
              }
            );
        });
      });
  }

  shadowDecode(parityNode: ParityNode, ethereumAccount: EthereumAccount, storageId: string, encryptedData: string) {
    const self = this;

    let hexSignature = ParitySecretStore.getSignature(storageId, ethereumAccount.getPrivateKey());

    return new Promise(function (resolve, reject) {
      let url = `${parityNode.getNodeAddress()}:${parityNode.getSecretStoreRpcPort()}/shadow/${storageId}/${hexSignature}`;
      self.httpClient.get(url)
        .subscribe(
          (shadowKeys: {
            decrypted_secret: string,
            common_point: string,
            decrypt_shadows: string
          }) => {
            resolve(shadowKeys);
          },
          (httpErrorResponse: HttpErrorResponse) => {
            reject(httpErrorResponse.message);
          });
    }).then(
      (shadowKeys: {
        decrypted_secret: string,
        common_point: string,
        decrypt_shadows: string
      }) => {
        return new Promise<any>(function (resolve, reject) {
          self.httpClient.post(
            `${parityNode.getNodeAddress()}:${parityNode.getRpcPort()}/`,
            {
              "jsonrpc": "2.0",
              "method": "secretstore_shadowDecrypt",
              "params": [
                ethereumAccount.getAddress(),
                ethereumAccount.getPassword(),
                shadowKeys.decrypted_secret,
                shadowKeys.common_point,
                shadowKeys.decrypt_shadows,
                encryptedData
              ],
              id: 2
            })
            .subscribe(
              function (response: any) {
                let data = Buffer.from(response.result.replace('0x', ''), 'hex').toString('utf8');
                resolve(data);
              },
              (httpErrorResponse: HttpErrorResponse) => {
                reject(httpErrorResponse);
              }
            );
        });
      });
  }
}


class ParityPersonal {
  constructor(private httpClient: HttpClient) {
  }

  public unlockRequestPromise(parityNode: ParityNode, ethAccount: EthereumAccount): Promise<boolean> {
    let _this = this;
    return new Promise(function (resolve, reject) {
      let url = `${parityNode.getNodeAddress()}:${parityNode.getRpcPort()}`;
      console.log(url);
      _this.httpClient.post(
        url,
        {
          'method': 'personal_unlockAccount',
          'params': [
            ethAccount.getAddress(),
            ethAccount.getPassword(),
            null
          ],
          'id': 1,
          'jsonrpc': '2.0'
        })
        .subscribe(
          function (data: any) {
            resolve(data.result);
          },
          (err: HttpErrorResponse) => {
            reject(err);
          });
    });
  }

}

class ParityAccounts {
  constructor(private httpClient: HttpClient) {
  }

  public exportAccount(parityNode: ParityNode, ethAccount: EthereumAccount): Promise<object> {
    let _this = this;
    return new Promise(function (resolve, reject) {
      _this.httpClient.post(
        `${parityNode.getNodeAddress()}:${parityNode.getRpcPort()}`,
        {
          'method': 'parity_exportAccount',
          'params': [
            ethAccount.getAddress(),
            ethAccount.getPassword()
          ],
          'id': 1,
          'jsonrpc': '2.0'
        })
        .subscribe(
          function (data: any) {
            resolve(data.result);
          },
          (httpErrorResponse: HttpErrorResponse) => {
            reject(httpErrorResponse);
          });
    });
  }
}

@Injectable()
export class ParityProvider {
  public readonly personal: ParityPersonal;
  public readonly secretStore: ParitySecretStore;
  public readonly accounts: ParityAccounts;

  constructor(httpClient: HttpClient) {
    this.personal = new ParityPersonal(httpClient);
    this.secretStore = new ParitySecretStore(httpClient);
    this.accounts = new ParityAccounts(httpClient);
  }
}
