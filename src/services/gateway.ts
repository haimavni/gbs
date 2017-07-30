import { autoinject } from 'aurelia-framework';
import { HttpClient, json, Interceptor } from 'aurelia-fetch-client';
import environment from '../environment';
import { EventAggregator } from 'aurelia-event-aggregator';

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
    let r = response.json();
    console.log('response: ', r);
    return r;
  }

  responseError(response: Response) {
    console.log('Some error has occured! Run!')
    return response;
  }
}

@autoinject()
export class MemberGateway {

  httpClient;
  eventAggregator;
  constants = null;

  constructor(httpClient: HttpClient, eventAggregator: EventAggregator) {
    this.httpClient = httpClient;
    this.eventAggregator = eventAggregator;
    httpClient.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl(environment.baseURL + '/gbs/')
        .withInterceptor(new SimpleInterceptor())
        .withDefaults({ mode: "o-cors", credentials: "same-origin" });
    });
    this.get_constants();
  }

  call_server(url: string, data?: any) {
    if (data) {
      url += '?' + params(data);
    }
    return this.httpClient.fetch(url) //, {method: "POST", body: json(data))
      .catch(error => alert("error: " + error))
  }

  call_server_post(url: string, data?: any) {
    data = data ? data : {};
    let x = JSON.stringify(data);
    return this.httpClient.fetch(url, { method: "POST", body: x })
      .catch(error => alert("error: " + error))
  }

  getMemberList() {
    return this.httpClient.fetch('members/member_list')
  }

  getMemberDetails(memberId) {
    let x = params(memberId);
    return this.httpClient.fetch(`members/get_member_details?${params(memberId)}`)
  }

  getStoryDetail(story) {
    console.log("get story detail ", story);
    return this.call_server('members/get_story_detail', story);
  }

  uploadPhotos(user_id, fileList) {
    let payload = { user_id };
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
          This.upload(payload);
        }
      }
      readers.push(fr);
      fr.readAsBinaryString(file);
    }

  }

  upload(payload) {
    payload = JSON.stringify(payload);
    return this.httpClient.fetch(`members/upload_photos`, {
      method: 'POST',
      body: payload
    })
      .then(response => {
        console.log('files uploaded ', response);
        this.eventAggregator.publish('FilesUploaded', response);
      })
      .catch(e => console.log('error occured ', e));
  }

  get_constants() {
    this.call_server_post('members/get_constants')
      .then(response => this.constants = response);
  }

  /*listen(group) {
    let x = window.location;
    service.call_server('default/get_tornado_host', { group: group })
      .then(data => {
        let ws = data.ws;
        if (!web2py_websocket(ws, service.handle_ws_message)) {
          alert("html5 websocket not supported by your browser, try Google Chrome");
        };
      });
  };*/

}
