import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable()
export class FaucetProvider {
  constructor(private httpClient: HttpClient) {
  }

  private faucetUrl: string = "http://94.130.247.85:1337";

  public fillWithCoin(address: string, satAmount: number) {
    let self = this;
    return new Promise(function (resolve, reject) {
      let url = `${self.faucetUrl}/upload/${satAmount}/${address}`;
      self.httpClient.get(url)
        .subscribe(
          (response: string) => {
            resolve(response);
          },
          (httpErrorResponse: HttpErrorResponse) => {
            reject(httpErrorResponse.message);
          });
    });
  }
}
