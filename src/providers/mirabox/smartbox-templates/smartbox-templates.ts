import {Injectable} from "@angular/core";
import {Web3Provider} from "../web3/web3";

@Injectable()
export class SmartTemplatesProvider {
  public smartboxTemplates;
  private web3: any;
  private miraFactoryContractAddress = "0x3fbe75d4fca29748643fd9fa861578b0ff42f2e6";
  private permissioningContractAddress = "0xd23ff3b969ce4144b9e2976bb4700f3a508ab69a";
  private miraboxesStorageAddress = "0xfd2fd6f0e10e6299ed6ec9045a4e3eb7b29b9849";
  private miraboxesStorageAbi = require("./MiraboxesStorageAbi.json");
  private miraFactoryContractAbi = require("./MiraFactoryAbi.json");
  private permissioningAbi = require("./PermissioningAbi.json");

  constructor(private web3Provider: Web3Provider) {
    this.web3 = this.web3Provider.getWeb3();
  }

  //tododaniil make config file for contract addresses and other options
  //tododaniil add XSS check
  public getTemplateList() {
    let self = this;
    return new Promise((resolve) => {
      if (self.smartboxTemplates) {
        return resolve(self.smartboxTemplates);
      }
      return this.updateTemplates()
        .then(() => {
          resolve(self.smartboxTemplates);
        })
    });
  }

  private updateTemplates() {
    let self = this;
    return this.requestForTemplates()
      .then((templates) => {
        self.smartboxTemplates = templates;
        let requestsPromises = this.smartboxTemplates.map((item, i) => {
          return self.updateAbiAndDescription(item.address, i);
        });
        return Promise.all(requestsPromises);
      });
  }

  private requestForTemplates(): Promise<any> {
    let miraFactoryContract = new this.web3.eth.Contract(this.miraFactoryContractAbi, this.miraFactoryContractAddress);
    return new Promise((resolve, reject) => {
      miraFactoryContract.methods.getTemplatesList()
        .call()
        .then((result) => {
          resolve(JSON.parse(result).templates);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private updateAbiAndDescription(builderAddress: string, i: number): Promise<any> {
    let builderAbi = require("./BuilderAbi.json");
    let builderContract = new this.web3.eth.Contract(builderAbi, builderAddress);
    let abiPromise = new Promise((resolveAbi, rejectAbi) => {
      builderContract.methods.getAbi()
        .call()
        .then((result) => {
          this.smartboxTemplates[i].abi = result;
          this.smartboxTemplates[i].settings = this.parseSettings(result);
          if (!this.smartboxTemplates[i].settings) {
            rejectAbi("No setSettings function found in Abi");
          }
          resolveAbi();
        })
        .catch((err) => {
          rejectAbi(err);
        })
    });
    let descrPromise = new Promise((resolveDescr, rejectDescr) => {
      builderContract.methods.getDescription()
        .call()
        .then((result) => {
          this.smartboxTemplates[i].description = result;
          resolveDescr();
        })
        .catch((err) => {
          rejectDescr(err)
        })
    });
    return Promise.all([abiPromise, descrPromise]);
  }

  public parseSettings(abi: string) {
    let parsedAbi = JSON.parse(abi);
    let parsedSettings;
    parsedAbi.forEach((item) => {
      if (item.name == "setSettings") {
        parsedSettings = item.inputs;
      }
    });
    return parsedSettings;
  }



  private addKey(document: string, template: any) {
    return new Promise((resolve, reject) => {
      let documentHex = this.web3.utils.asciiToHex(document);
      let templateNameHex = this.web3.utils.asciiToHex(template.name);

      let permissioningContract = new this.web3.eth.Contract(this.permissioningAbi, this.permissioningContractAddress);

      let getData = permissioningContract.methods.addKey(documentHex, templateNameHex).encodeABI();
      this.web3.eth.accounts.signTransaction({
        to: this.permissioningContractAddress,
        data: getData,
        gas: 3000000
      }, '0xdf0d6892474da2f19726f481b8baf698eabdd6b52b9fe2ad5c045b1367809239')
        .then(result => {
          this.web3.eth.sendSignedTransaction(result.rawTransaction)
            .on('receipt', (result) => {
              console.log("Got receipt from addkey:");
              console.log(result);
              resolve();
            })
            .on('error', (err) => {
              reject(err);
            })
        })
        .catch((err) => {
          reject(err);
        })
    });
  }

  private requestAddress(document: string) {
    return new Promise((resolve, reject) => {
      let miraboxesStorageContract = new this.web3.eth.Contract(
        this.miraboxesStorageAbi,
        this.miraboxesStorageAddress);
      let documentHex = this.web3.utils.asciiToHex(document);
      miraboxesStorageContract.methods.getMiraboxContract(documentHex)
        .call()
        .then((result) => {
          console.log("Got address: " + result);
          resolve(result);
        })
        .catch((err) => {
          reject(err)
        });
    });
  }

  private setSettings(address, template) {
    return new Promise((resolve, reject) => {
      let opts = [];
      template.settings.map(item => {
        if(item.type.contains("uint"))
          opts.push(Number(item.value));
        else
          opts.push(this.web3.utils.asciiToHex(item.value));
      });

      let selectedContractAbi = JSON.parse(template.abi);
      let selectedContractAddress = address;
      let selectedContract = new this.web3.eth.Contract(selectedContractAbi, selectedContractAddress);
      let getData = selectedContract.methods.setSettings.apply(selectedContract.methods, opts).encodeABI();
      this.web3.eth.accounts.signTransaction({
        to: selectedContractAddress,
        data: getData,
        gas: 3000000
      }, '0xdf0d6892474da2f19726f481b8baf698eabdd6b52b9fe2ad5c045b1367809239')
        .then(result => {
          this.web3.eth.sendSignedTransaction(result.rawTransaction)
            .on('receipt', (result) => {
              console.log("Got receipt from setSettings:");
              console.log(result);
              resolve(address);
            })
            .on('error', (err) => {
              reject(err);
            })
        })
        .catch((err) => {
          reject(err)
        });
    });
  }

  public createSmartBoxHandler(document, template) {
    return new Promise((resolve, reject) => {
      this.addKey(document, template)
        .then(() => {
          return this.requestAddress(document);
        })
        .then((_address) => {
          return this.setSettings(_address, template);
        })
        .then((_address) => {
          resolve(_address);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
