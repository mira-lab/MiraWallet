import {Injectable} from "@angular/core";
import {Web3Provider} from "../web3/web3";

@Injectable()
export class SmartboxTemplatesProvider{
  public smartboxTemplates;
  private web3;
  constructor(private web3Provider:Web3Provider){
    this.askTemplates().then((result) => { console.log (result); this.smartboxTemplates = result; this.getTemplatesAbiAndDescription();});
    this.web3 = this.web3Provider.getWeb3();
  }
  public updateTemplateList(){
    return new Promise(resolve => {
      this.askTemplates().then((result) => {
        let tempList;
        tempList = result;
        if (tempList.length != this.smartboxTemplates.length && this.smartboxTemplates.length == undefined) {
          this.smartboxTemplates = tempList;
          this.getTemplatesAbiAndDescription().then(() => {resolve(this.smartboxTemplates)});
        }
        else{
          resolve(this.smartboxTemplates);
        }
      });
    });


  }
  private askTemplates(){
    let miraFactoryAddress = "0x5c8c4b793107f081e1df7c9ecb71752f29747140";
    let miraFactoryAbi = require("./MiraFactory.json");
    let Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
      let miraFactoryContract = new web3.eth.Contract(miraFactoryAbi, miraFactoryAddress);
      return new Promise((resolve) => {
        miraFactoryContract.methods.getTemplatesList()
          .call()
          .then((result) => {
            resolve(this.parseTemplates(result));
          });
      });
    }
  private parseTemplates(result: string){
    let templates = JSON.parse(result);
    return templates.templates;
  }
  private getAbiAndDescription(builderAddress:string, i:number, resolve){
    let self = this;
    let Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.HttpProvider('http://94.130.94.162:8545'));
    let builderAbi = require("./BuilderAbi.json");
    let builderContract = new web3.eth.Contract(builderAbi, builderAddress);
    let abiPromise = new Promise(resolveAbi => {
      builderContract.methods.getAbi()
        .call()
        .then((result) => {
          this.smartboxTemplates[i].abi = result;
          this.parseSettings(result).then((result)=>{
            this.smartboxTemplates[i].settings = result;
          }, (error)=>{
            console.log(error);
          });
          resolveAbi();
        });
    });
    let descrPromise = new Promise(resolveDescr => {
      builderContract.methods.getDescription()
        .call()
        .then((result) => {
          this.smartboxTemplates[i].description = result;
          resolveDescr();
        });
    });
    Promise.all([abiPromise, descrPromise]).then(()=>{resolve();})
  }
  private getTemplatesAbiAndDescription(){
    let requests = this.smartboxTemplates.map((item, i ,arr)=>{
      return new Promise((resolve) => {
        this.getAbiAndDescription(item.address, i, resolve);
      })
    })
    return Promise.all(requests);
  }
  public parseSettings(abi:string){
    return new Promise((resolve, reject) => {
        let parsed_abi = JSON.parse(abi);
        parsed_abi.map((item) => {
          if (item.name == "setSettings")
            resolve(item.inputs);
        });
        reject("No setSetting function was found!");
      });
    }
}
