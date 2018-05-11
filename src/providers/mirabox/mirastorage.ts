import {Injectable} from "@angular/core";
import {FileStorage} from "../persistence/storage/file-storage";
import {LocalStorage} from "../persistence/storage/local-storage";
import {File} from "@ionic-native/file";
import {Logger} from "../logger/logger";
import {PlatformProvider} from "../platform/platform";
import {IStorage} from "../persistence/storage/istorage";
import {MiraBox, Status, MiraBoxStatus} from "../../mira/mira";

const Keys = {
  MIRA_BOX: (miraBoxGuid: string) => `mira-box-${miraBoxGuid}`,
  MIRA_BOX_REGISTRY: 'mira-box-registry',
  MIRA_BOX_STATUS_REGISTRY: 'mira-box-status-registry',
};

@Injectable()
export class MiraStorageProvider {
  public storage: IStorage;

  constructor(private logger: Logger,
              private platformProvider: PlatformProvider,
              private file: File) {
    this.load();
  };

  public load() {
    if (this.platformProvider.isCordova) {
      this.storage = new FileStorage(this.file, this.logger);
    } else {
      this.storage = new LocalStorage();
    }
  }

  public getMiraBoxGuidSet(): Promise<Set<string>> {
    return this.storage.get(Keys.MIRA_BOX_REGISTRY)
      .then((guidArray: Array<string>) => {
        return new Set<string>(guidArray);
      });
  }

  private addToMiraBoxGuidSet(miraBoxGuid: string): Promise<void> {
    let self = this;
    return new Promise<void>(resolve => {
      self.getMiraBoxGuidSet().then((set: Set<string>) => {
        if (set.has(miraBoxGuid)) {
          return resolve();
        }
        set.add(miraBoxGuid);
        let statusPromise = self.addToMiraBoxStatusArray({guid: miraBoxGuid, status: Status.Idle});
        let storeMiraBoxPromise = self.storeMiraBoxGuidSet(set);
        Promise.all([statusPromise, storeMiraBoxPromise]).then(() => {
          resolve()
        });
      });
    });
  }

  private removeFromMiraBoxGuidSet(miraBoxGuid: string): Promise<void> {
    let self = this;
    return new Promise<void>(resolve => {
      self.getMiraBoxGuidSet().then((set: Set<string>) => {
        if (!set.has(miraBoxGuid)) {
          return resolve();
        }
        set.delete(miraBoxGuid);
        let removeFromStatusPromise = this.removeFromMiraBoxStatusArray(miraBoxGuid);
        let storeGuidSetPromise = self.storeMiraBoxGuidSet(set);
        Promise.all([removeFromStatusPromise, storeGuidSetPromise]).then(() => {
          resolve();
        });
      });
    });
  }

  public storeMiraBoxGuidSet(guidSet: Set<string>): Promise<void> {
    return this.storage.set(Keys.MIRA_BOX_REGISTRY, Array.from(guidSet));
  }

  public storeMiraBox(miraBox: MiraBox): Promise<void> {
    let self = this;
    return this.storage.set(Keys.MIRA_BOX(miraBox.getGuid()), miraBox.toString())
      .then(function () {
        return self.addToMiraBoxGuidSet(miraBox.getGuid());
      });
  }

  public removeMiraBox(miraBoxGuid: string): Promise<void> {
    let self = this;
    return this.removeFromMiraBoxGuidSet(miraBoxGuid).then(function () {
      return self.removeMiraBox(miraBoxGuid);
    });
  }

  public getMiraBox(miraBoxGuid: string): Promise<MiraBox> {
    return this.storage.get(Keys.MIRA_BOX(miraBoxGuid))
      .then((miraBoxString: any) => {
        return MiraBox.fromString(miraBoxString);
      });
  }

  public getMiraBoxList(): Promise<Set<MiraBox>> {
    let self = this;
    return this.getMiraBoxGuidSet()
      .then(function (guidSet: Set<string>) {
        let guidList: string[] = Array.from(guidSet);
        let miraBoxSetPromise: Promise<MiraBox | void>[] = [];
        for (let guid of guidList) {

          let miraBoxPromise: Promise<MiraBox | void>;
          miraBoxPromise = self.getMiraBox(guid)
            .catch(function (reason) {
              console.error(reason);
            });

          miraBoxSetPromise.push(miraBoxPromise);
        }
        return Promise.all(miraBoxSetPromise).then(function (miraBoxList: MiraBox[]) {
          miraBoxList = miraBoxList.filter(function (miraBox) {
            return miraBox;
          });
          return new Set<MiraBox>(miraBoxList);
        });
      });
  }

  public storeMiraBoxStatusArray(miraBoxStatusArray: Array<MiraBoxStatus>): Promise<void> {
    return this.storage.set(Keys.MIRA_BOX_STATUS_REGISTRY, miraBoxStatusArray);
  }

  public getMiraBoxStatusArray(): Promise<Array<MiraBoxStatus>> {
    return this.storage.get(Keys.MIRA_BOX_STATUS_REGISTRY)
      .then((miraBoxStatusArray: Array<MiraBoxStatus>) => {
        return miraBoxStatusArray;
      });
  }

  private addToMiraBoxStatusArray(miraBoxStatus: MiraBoxStatus): Promise<void> {
    let self = this;
    return new Promise<void>(resolve => {
      self.getMiraBoxStatusArray().then((miraBoxStatusArray: Array<MiraBoxStatus>) => {
        if (!miraBoxStatusArray) {
          miraBoxStatusArray = new Array<MiraBoxStatus>();
        } else if (miraBoxStatusArray.filter(status => status.guid === miraBoxStatus.guid).length > 0) {
          return resolve();
        }
        miraBoxStatusArray.push(miraBoxStatus);
        self.storeMiraBoxStatusArray(miraBoxStatusArray).then(resolve);
      });
    });
  }

  public removeFromMiraBoxStatusArray(guid: string): Promise<void> {
    let self = this;
    return new Promise<void>(resolve => {
      self.getMiraBoxStatusArray().then((miraBoxStatusArray: Array<MiraBoxStatus>) => {
        if (!miraBoxStatusArray || miraBoxStatusArray.filter(status => status.guid === guid).length == 0) {
          return resolve();
        }
        miraBoxStatusArray.splice(self.findIndex(miraBoxStatusArray, 'guid', guid), 1);
        return self.storeMiraBoxStatusArray(miraBoxStatusArray);
      });
    });
  }

  public updateMiraBoxStatus(guid: string, newStatus: Status): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.getMiraBoxStatusArray().then((miraBoxStatusArray: Array<MiraBoxStatus>) => {
        if (!miraBoxStatusArray) {
          miraBoxStatusArray = new Array<MiraBoxStatus>();
        }
        if (miraBoxStatusArray.filter(status => status.guid === guid).length == 0) {
          this.addToMiraBoxStatusArray({guid: guid, status: newStatus})
            .then(() => {
              resolve()
            });
          return;
        }
        miraBoxStatusArray[this.findIndex(miraBoxStatusArray, 'guid', guid)].status = newStatus;
        this.storeMiraBoxStatusArray(miraBoxStatusArray)
          .then(() => {
            resolve()
          }, () => {
            reject()
          })
        return;
      });
    });
  }

  public getMiraBoxStatus(guid: string) {
    return new Promise((resolve, reject) => {
      this.getMiraBoxStatusArray().then((miraBoxStatusArray: Array<MiraBoxStatus>) => {
        if (!miraBoxStatusArray || (miraBoxStatusArray.filter(status => status.guid == guid).length == 0)) {
          return reject('There is no status found for this guid!');
        }
        return resolve(miraBoxStatusArray[this.findIndex(miraBoxStatusArray, 'guid', guid)].status);
      });
    });
  }

  private findIndex(array, attr, value) {
    for (let i = 0; i < array.length; i += 1) {
      if (array[i][attr] === value) {
        return i;
      }
    }
    return -1;
  }
}
