export enum MiraBoxWalletType {
  BTC = 'btc',
  BCH = 'bch'
}

export enum MiraBoxType {
  Nominal = 'nominal',
  Multi = 'multi',
  Smart = 'smart'
}

interface MiraBoxEncodedWalletJsonInterface {
  "wallet_type": MiraBoxWalletType,
  "wallet_name": string,
  "public_key": string,
  "encoded_private_key": string
}

interface MiraBoxJsonInterface {
  'type': MiraBoxType,
  'version': string,
  'guid': string,
  'description': string,
  'creator': MiraBoxCreator,
  'wallet': MiraBoxEncodedWalletJsonInterface
}

interface MiraKeyJsonInterface {
  'guid': string,
  'key': string
}

export interface MiraBoxKeyPair {
  miraBox: MiraBox,
  miraKey: MiraKey
}

export interface MiraBoxCreator {
  name: string,
  publicKey: string
}

export interface MiraBoxWalletKeyPair {
  publicKey: string,
  privateKey: string
}

export class EncodedWallet {
  constructor(private walletType: MiraBoxWalletType,
              private walletName: string,
              private walletPublicKey: string,
              private walletEncodedPrivateKey: string) {
  }

  getType(): string {
    return this.walletType;
  }

  getName(): string {
    return this.walletName;
  }

  getPublicKey(): string {
    return this.walletPublicKey;
  }

  getEncodedPrivateKey(): string {
    return this.walletEncodedPrivateKey;
  }

  toJsonObj(): MiraBoxEncodedWalletJsonInterface {
    return {
      "wallet_type": this.walletType,
      "wallet_name": this.walletName,
      "public_key": this.getPublicKey(),
      "encoded_private_key": this.walletEncodedPrivateKey
    };
  }

  static fromJsonObj(wallet: MiraBoxEncodedWalletJsonInterface): EncodedWallet {
    return new EncodedWallet(
      wallet.wallet_type,
      wallet.wallet_name,
      wallet.public_key,
      wallet.encoded_private_key);
  }
}

export class MiraKey {
  constructor(private boxGuid: string,
              private boxKey: string) {
  }

  toJsonObj(): MiraKeyJsonInterface {
    return {
      guid: this.boxGuid,
      key: this.boxKey
    }
  }

  static fromJsonObj(jsonObj: MiraKeyJsonInterface): MiraKey {
    return new MiraKey(jsonObj.guid, jsonObj.key);
  }

  getGuid() {
    return this.boxGuid;
  }

  getKey() {
    return this.boxKey;
  }
}


export class MiraBox {
  private guid: string;

  constructor(private type: MiraBoxType,
              private creator: MiraBoxCreator,
              private wallet: EncodedWallet,
              private description: string = '',
              private version: string = '1') {
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

  generateGuid(): MiraBox {
    if (this.guid) {
      throw 'Cannot reset guid';
    }
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
      'wallet': this.wallet.toJsonObj()
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

  getWallet(): EncodedWallet {
    return this.wallet;
  }

  getDescription(): string {
    return this.description;
  }

  getVersion(): string {
    return this.version;
  }

  static fromJsonObj(jsonObj: MiraBoxJsonInterface): MiraBox {
    return new MiraBox(
      jsonObj.type,
      jsonObj.creator,
      EncodedWallet.fromJsonObj(jsonObj.wallet),
      jsonObj.description,
      jsonObj.version)
      .setGuid(jsonObj.guid);
  }
}
