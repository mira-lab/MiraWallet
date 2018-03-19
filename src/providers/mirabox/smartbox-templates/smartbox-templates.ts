import {Injectable} from "@angular/core";
import {Web3Provider} from "../web3/web3";

@Injectable()
export class SmartTemplatesProvider {
  public smartboxTemplates;
  public selectedTemplate;
  public selectedTemplateName = "Not Selected";
  private web3;
  private miraFactoryAddress = "0x5d3495ca996ead23698d623c22ecce71953a5f0b";
  private permissioningAddress = "0x43647204afdbd22cabbdf43eb3d6206312f305c3";

  constructor(private web3Provider: Web3Provider) {
    this.updateTemplateList()
      .then(() => {
        console.log("Got templates list.")
      }, (err) => {
        console.log("Couldn't get template list: ") + err
      })

    this.web3 = this.web3Provider.getWeb3();
  }

  //tododaniil pretify code
  //tododaniil deal with web3 multiple instatition
  //tododaniil remove not used code
  public updateTemplateList() {
    return new Promise((resolve, reject) => {
      this.askTemplates().then((result) => {
        let tempList: any = result;
        if (!this.smartboxTemplates || tempList.length != this.smartboxTemplates.length) {
          this.smartboxTemplates = tempList;
          this.getTemplatesAbiAndDescription().then(() => {
            resolve(this.smartboxTemplates);
          }, (err) => {
            reject(err);
          });
        }
        else {
          resolve(this.smartboxTemplates);
        }
      });
    });
  }

  public deleteSelectedTemplate() {
    this.selectedTemplate = void 0;
  }

  private askTemplates() {
    let miraFactoryAbi = require("./MiraFactoryAbi.json");
    let Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
    let miraFactoryContract = new web3.eth.Contract(miraFactoryAbi, this.miraFactoryAddress);
    return new Promise((resolve, reject) => {
      miraFactoryContract.methods.getTemplatesList()
        .call()
        .then((result) => {
          resolve(this.parseTemplates(result));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private parseTemplates(result: string) {
    let templates = JSON.parse(result);
    return templates.templates;
  }

  private getAbiAndDescription(builderAddress: string, i: number, resolve, reject) {
    let Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
    let builderAbi = require("./BuilderAbi.json");
    let builderContract = new web3.eth.Contract(builderAbi, builderAddress);
    let abiPromise = new Promise((resolveAbi, rejectAbi) => {
      builderContract.methods.getAbi()
        .call()
        .then((result) => {
          this.smartboxTemplates[i].abi = result;
          this.parseSettings(result).then((result) => {
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
    Promise.all([abiPromise, descrPromise])
      .then(() => {
        resolve();
      }, (err) => {
        reject(err)
      });
  }

  private getTemplatesAbiAndDescription() {
    let requests = this.smartboxTemplates.map((item, i) => {
      return new Promise((resolve, reject) => {
        this.getAbiAndDescription(item.address, i, resolve, reject);
      })
    })
    return Promise.all(requests);
  }

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
    this.selectedTemplateName = template.name;
  }

  private addKey(document: string, address: string, pin: string) {
    return new Promise((resolve, reject) => {

      let Web3 = require('web3');
      let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));

      let _document = web3.utils.fromAscii(document);
      let _pin = web3.utils.fromAscii(pin);
      let templateName = web3.utils.asciiToHex(this.selectedTemplate.name);

      const permissioningAbi = require("./PermissioningAbi.json");
      let permissioningContract = new web3.eth.Contract(permissioningAbi, this.permissioningAddress);

      var getData = permissioningContract.methods.addKey(_document, address, _pin, templateName).encodeABI();
      web3.eth.accounts.signTransaction({
        to: this.permissioningAddress,
        data: getData,
        gas: 3000000
      }, '0xdf0d6892474da2f19726f481b8baf698eabdd6b52b9fe2ad5c045b1367809239')
        .then(result => {
          web3.eth.sendSignedTransaction(result.rawTransaction)
            .on('receipt', (result) => {
              console.log("Got receipt from addkey:");
              console.log(result);
              resolve();
            })
            .on('error', (err) => {
              reject(err)
            })
        })
        .catch((err) => {
          reject(err);
        })
    });
  }

  private askAddress(document: string) {
    return new Promise((resolve, reject) => {
      let Web3 = require('web3');
      let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
      const miraFactoryAbi = require("./MiraFactoryAbi.json");
      let miraFactoryContract = new web3.eth.Contract(miraFactoryAbi, this.miraFactoryAddress);
      let _document = web3.utils.asciiToHex(document);
      miraFactoryContract.methods.askAddress(_document)
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
      })
      console.log(opts);
      let Web3 = require('web3');
      let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
      let templateInstanceAbi = JSON.parse(this.selectedTemplate.abi);
      let templateInstanceAddress = address;
      let templateInstanceContract = new web3.eth.Contract(templateInstanceAbi, templateInstanceAddress);
      var getData = templateInstanceContract.methods.setSettings.apply(templateInstanceContract.methods, opts).encodeABI();
      web3.eth.accounts.signTransaction({
        to: templateInstanceAddress,
        data: getData,
        gas: 3000000
      }, '0xdf0d6892474da2f19726f481b8baf698eabdd6b52b9fe2ad5c045b1367809239')
        .then(result => {
          web3.eth.sendSignedTransaction(result.rawTransaction)
            .on('receipt', (result) => {
              console.log("Got receipt from setSettings:");
              console.log(result);
              resolve();
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
      this.addKey(document, address, pin)
        .then(() => {
          return this.askAddress(document);
        })
        .then((result) => {
          return this.setSettings(result);
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        })
    });
  }
}
