import {Injectable} from "@angular/core";
import {Web3Provider} from "../web3/web3";

@Injectable()
export class SmartTemplatesProvider {
  public smartboxTemplates;
  public selectedTemplate;
  private web3: any;
  private miraFactoryContractAddress = "0x5d3495ca996ead23698d623c22ecce71953a5f0b";
  private permissioningContractAddress = "0x43647204afdbd22cabbdf43eb3d6206312f305c3";
  private miraFactoryContractAbi = require("./MiraFactoryAbi.json");
  private permissioningAbi = require("./PermissioningAbi.json");

  constructor(private web3Provider: Web3Provider) {
    this.getTemplateList()
      .then(() => {
        console.log("Got templates list.");
      }, (err) => {
        console.log(`Couldn't get template list: ${err}`);
      });
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

  public deleteSelectedTemplate() {
    this.selectedTemplate = void 0;
  }

  private updateAbiAndDescription(builderAddress: string, i: number): Promise<any> {
    let builderAbi = require("./BuilderAbi.json");
    let builderContract = new this.web3.eth.Contract(builderAbi, builderAddress);
    let abiPromise = new Promise((resolveAbi, rejectAbi) => {
      builderContract.methods.getAbi()
        .call()
        .then((result) => {
          this.smartboxTemplates[i].abi = result;
          this.parseSettings(result)
            .then((result) => {
              this.smartboxTemplates[i].settings = result;
              resolveAbi();
            });
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

  //todo переписать.. здесь не нужны промисы
  public parseSettings(abi: string) {
    return new Promise((resolve, reject) => {
      let parsed_abi = JSON.parse(abi);
      parsed_abi.map((item) => {
        if (item.name == "setSettings")
          resolve(item.inputs);
      });
      reject("No setSetting function was found!");
    });
  }


  public setTemplate(template: any) {
    this.selectedTemplate = template;
  }

  private addKey(document: string, ownerAddress: string, pin: string) {
    return new Promise((resolve, reject) => {
      let documentHex = this.web3.utils.asciiToHex(document);
      let pinHex = this.web3.utils.asciiToHex(pin);
      let templateName = this.web3.utils.asciiToHex(this.selectedTemplate.name);

      let permissioningContract = new this.web3.eth.Contract(this.permissioningAbi, this.permissioningContractAddress);

      let getData = permissioningContract.methods.addKey(documentHex, ownerAddress, pinHex, templateName).encodeABI();
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
      let miraFactoryContract = new this.web3.eth.Contract(
        this.miraFactoryContractAbi,
        this.miraFactoryContractAddress);
      let documentHex = this.web3.utils.asciiToHex(document);
      miraFactoryContract.methods.askAddress(documentHex)
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

  private setSettings(address) {
    return new Promise((resolve, reject) => {
      let opts = [];
      this.selectedTemplate.settings.map(item => {
        opts.push(Number(item.value));
      });

      let selectedContractAbi = JSON.parse(this.selectedTemplate.abi);
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

  public createSmartBoxHandler(document, address, pin) {
    return new Promise((resolve, reject) => {
      if (this.selectedTemplate) {
        this.addKey(document, address, pin)
          .then(() => {
            return this.requestAddress(document);
          })
          .then((_address) => {
            return this.setSettings(_address);
          })
          .then((_address) => {
            resolve(_address);
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        reject("Template is not selected!");
      }
    });
  }
}
