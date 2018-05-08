import * as Message from 'bitcore-message';
import * as BWC from 'bitcore-wallet-client';
export enum Status{
  Exported = "exported",
  Sent = "sent",
  Idle = "idle",
}
export interface MiraBoxStatus{
  guid: string,
  status: Status,
}
export enum Coin {
  BTC = 'btc',
  BCH = 'bch'
}

export interface WalletType {
  coin: Coin,
  network: string
}

export enum MiraBoxType {
  Nominal = 'nominal',
  Multi = 'multi',
  Smart = 'smart'
}

interface MiraBoxJsonInterface {
  'type': MiraBoxType,
  'version': string,
  'guid': string,
  'description': string,
  'creator': MiraBoxCreator,
  'boxItems': MiraBoxItem[]
}

export interface MiraBoxCreator {
  name: string,
  publicKey: string
}

export interface MiraBoxWalletKeyPair {
  publicKey: string,
  privateKey: string
}

export interface MiraBoxItem {
  hash: string,
  headers: {
    type: WalletType,
    pubType: string,
    pub: string,
    address: string
  },
  key: string,
  meta: object,
  data
}

export class MiraBox {
  private guid: string;
  private miraBoxStringValue: string;
  private miraBoxSignature: string = '';

  constructor(private type: MiraBoxType,
              private creator: MiraBoxCreator,
              private boxItems: MiraBoxItem[],
              private description: string = '',
              private version: string = '1') {
    this.generateGuid();
    this.stringify();
  }


  private static genGuid(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  private generateGuid(): MiraBox {
    return this.setGuid(MiraBox.genGuid());
  }

  private setGuid(guid: string): MiraBox {
    this.guid = guid;
    return this;
  }

  toJsonObj(): MiraBoxJsonInterface {
    return {
      'type': this.type,
      'version': this.version,
      'guid': this.guid,
      'description': this.description,
      'creator': this.creator,
      'boxItems': this.boxItems
    };
  }

  getGuid() {
    return this.guid;
  }

  getType(): MiraBoxType {
    return this.type;
  }

  getCreator(): MiraBoxCreator {
    return this.creator;
  }

  getBoxItems(): MiraBoxItem[] {
    return this.boxItems;
  }

  getDescription(): string {
    return this.description;
  }

  getVersion(): string {
    return this.version;
  }

  private static fromJsonObj(jsonObj: MiraBoxJsonInterface): MiraBox {
    return new MiraBox(
      jsonObj.type,
      jsonObj.creator,
      jsonObj.boxItems,
      jsonObj.description,
      jsonObj.version)
      .setGuid(jsonObj.guid)
      .stringify();
  }

  static fromString(input: string): MiraBox {
    let rows = input.split('\n');
    let miraBoxObj = JSON.parse(rows[0]);
    let miraBox = MiraBox.fromJsonObj(miraBoxObj);
    miraBox.setSignature(rows[1]);
    return miraBox;
  }

  validateSignature() {
    try {
      let xPublicKey = BWC.Bitcore.PublicKey.fromString(this.creator.publicKey);
      let address = xPublicKey.toAddress('livenet');
      return Message(this.miraBoxStringValue).verify(address, this.miraBoxSignature);
    }
    catch (e) {
      return false;
    }
  }

  createSignature(privateKey) {
    let message = new Message(this.miraBoxStringValue);
    this.miraBoxSignature = message.sign(privateKey);
  }

  private stringify(): MiraBox {
    this.miraBoxStringValue = JSON.stringify(this.toJsonObj());
    return this;
  }

  toString(): string {
    return `${this.miraBoxStringValue}\n${this.miraBoxSignature}`;
  }

  private setSignature(signature: string) {
    this.miraBoxSignature = signature;
  }
}
