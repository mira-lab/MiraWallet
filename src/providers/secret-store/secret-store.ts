import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";

const querystring = require('querystring');
const http = require('http');
const uniREST = require('unirest');
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
export class ParitySecretStore {
  private NETWORKING = {
    portJsonRpc: '8545'
  };
  private address: string = "0x00a329c0648769a73afac7f9381e08fb43dbea72";
  private password: string = '';
  private privateKey: string = '';

  private ssPort = 8082;

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

  /**
   * Decode encrypted data by storageId
   * @param parityNode
   * @param storageId Shadow mode get key
   * @param encrypted Encrypted string
   * @param onComplete Callback when get decoded body from KeyServer
   */
  shadowDecode(parityNode: ParityNode, storageId, encrypted, onComplete) {
    const self = this;
    let signedStorageId = secp256k1.sign(Buffer.from(storageId, 'hex'), this.privateKey);
    let hexSignature = signedStorageId.signature.toString('hex');

    let getShadowKey = new Promise(function (resolve) {
      let url = `${parityNode.getNodeAddress()}:${this.ssPort}/shadow/${storageId}/${hexSignature}00/`;
      let Request = uniREST.get(url);
      Request.end(documentKey => resolve(documentKey.body));
    });

    getShadowKey.then(function (shadowKeys: {
        decrypted_secret: string,
        common_point: string,
        decrypt_shadows: string
      }) {
        let dataBinaryObj = {
          "jsonrpc": "2.0",
          "method": "secretstore_shadowDecrypt",
          "params": [
            self.address,
            self.password,
            shadowKeys.decrypted_secret,
            shadowKeys.common_point,
            shadowKeys.decrypt_shadows
          ],
          id: 2
        };
        let dataBinaryJson = JSON.stringify(dataBinaryObj);

        let Request = uniREST.post(`${this.ssPort}:${self.NETWORKING.portJsonRpc}/`);
        Request
          .headers({'Content-Type': 'application/json'})
          .send(dataBinaryJson)
          .end(function (data) {
            let decrypted = Buffer.from(data.body.result.replace('0x', ''), 'hex').toString('utf8');
            onComplete(decrypted);
          })
      },
      function (err) {
        console.log(err);
      });
  }

  doRequest(port, endpoint, method, data, success) {
    let dataString = JSON.stringify(data);
    let headers = {};

    if (method === 'GET') {
      endpoint += '?' + querystring.stringify(data)
    } else {
      headers = {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length,
      }
    }
    let options = {
      host: '94.130.94.162',
      port: port,
      path: endpoint,
      method: method,
      headers: headers
    };
    let req = http.request(options, res => {
      res.setEncoding('utf-8');
      let responseString = '';

      res.on('data', data => {
        responseString += data
      });

      res.on('end', function () {
        console.log(responseString);
        let responseObject = JSON.parse(responseString);
        success(responseObject)
      });
    });

    req.write(dataString);
    req.end();
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
