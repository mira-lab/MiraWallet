import {Injectable} from "@angular/core";
import {FileStorage} from "../persistence/storage/file-storage";
import {LocalStorage} from "../persistence/storage/local-storage";
import {File} from "@ionic-native/file";
import {Logger} from "../logger/logger";
import {PlatformProvider} from "../platform/platform";
import {IStorage} from "../persistence/storage/istorage";
import {MiraBox} from "../../mira/mira";

const Keys = {
  MIRA_BOX: (miraBoxGuid: string) => `mira-box-${miraBoxGuid}`,
  MIRA_BOX_REGISTRY: 'mira-box-registry',
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
        self.storeMiraBoxGuidSet(set).then(resolve);
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
        return self.storeMiraBoxGuidSet(set);
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

}
