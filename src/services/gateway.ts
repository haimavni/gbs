
import { autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import environment from '../environment';

function params(data) {
  return Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
}

@autoinject()
export class MemberGateway {

  httpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    httpClient.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl(environment.baseURL) 
        //.withBaseUrl(environment.baseURL)
        .withDefaults({ mode: "o-cors" });
      //.withBaseUrl(environment.baseURL);
    });

  }

  call_server(url: string, data?: any) {
    if (data) {
      url += '?' + params(data);
    } 
    //data = data ? data : {};
    return this.httpClient.fetch(url) //, {method: "POST", body: json(data))
      .then(response => response.json())
  }

  call_server_post(url: string, data?: any) {
    data = data ? data : {};
    let x = JSON.stringify(data);
    return this.httpClient.fetch(url, {method: "POST", body: x})
      .then(response => response.json())
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

}
