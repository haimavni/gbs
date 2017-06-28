import { autoinject } from 'aurelia-framework';
import { HttpClient, json, Interceptor } from 'aurelia-fetch-client';
import environment from '../environment';
import { Cookies } from './aurelia-plugins-cookies';

function params(data) {
  return Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
}

export class SimpleInterceptor implements Interceptor {
  request(request: Request) {
    console.log(`I am inside of the interceptor doing a new request to ${request.url}`, ' ', request);
    //let x = request.json();
    //console.log('request: ', x);
    return request;
  }

  response(response: Response) {
    console.log('response: ', response);
    return response;
  }

  responseError(response: Response) {
    console.log('Some error has occured! Run!')
    return response;
  }
}

@autoinject()
export class MemberGateway {

  httpClient;



  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    httpClient.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl(environment.baseURL + '/gbs/')
        .withInterceptor(new SimpleInterceptor())
        .withDefaults({ mode: "o-cors", credentials: "same-origin" });
    });
  }

  call_server(url: string, data?: any) {
    if (data) {
      url += '?' + params(data);
    }
    return this.httpClient.fetch(url) //, {method: "POST", body: json(data))
      .then(response => response.json())
      .catch(error => alert("error: " + error))
  }

  call_server_post(url: string, data?: any) {
    data = data ? data : {};
    let x = JSON.stringify(data);
    return this.httpClient.fetch(url, { method: "POST", body: x })
      .then(response => response.json())
      .catch(error => alert("error: " + error))
  }

  getMemberList() {
    return this.httpClient.fetch('members/member_list')
      .then(response => response.json());
  }

  getMemberDetails(memberId) {
    let x = params(memberId);
    return this.httpClient.fetch(`members/get_member_details?${params(memberId)}`)
      .then(response => response.json())
  }

  uploadPhotos(fileList) {
    let payload = {};
    let readers = [];
    let m = 0;
    let n = fileList.length;
    let This = this;
    for (let i = 0; i < n; i++) {
      let file = fileList[i];
      payload['file-' + i] = { name: file.name, size: file.size };
      let fr = new FileReader();
      fr.onload = function () {
        m += 1;
        payload['file-' + i].BINvalue = this.result;
        if (m == n) {
          return This.upload(payload);
        }
      }
      readers.push(fr);
      fr.readAsBinaryString(file);
      //fr.readAsArrayBuffer(file);
    }

  }

  upload(payload) {
    payload = JSON.stringify(payload);
    return this.httpClient.fetch(`members/upload_photos?cookies=abcdefghij`, {
      method: 'POST',
      body: payload
    }).then(response => response.json())
    .then(response => {
      console.log('files uploaded');
      console.log("cookies ", response);
    })
      .catch(e => console.log('error occured ', e));
  }

}
