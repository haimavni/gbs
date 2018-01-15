import { autoinject } from 'aurelia-framework';
import { HttpClient, json, Interceptor } from 'aurelia-fetch-client';
import environment from '../environment';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as download from 'downloadjs';

let THIS;

function params(data) {
    return Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
}

export class SimpleInterceptor implements Interceptor {
    request(request: Request) {
        //place code here
        //alert('request mode: ' + request.mode);
        THIS.pending += 1;
        return request;
    }

    response(response: Response) {
        let r = response.json();
        THIS.pending -= 1;
        return r;
    }

    responseError(response: Response) {
        console.log('responseError - Some error has occured! Run!');
        THIS.pending -= 1;
        if (! THIS.pending) {
            alert("Server Error. Please try again later.")
        }
        return response;
    }
}

@autoinject()
export class MemberGateway {

    httpClient;
    eventAggregator;
    constants = {
        visibility: {
            VIS_NEVER: 0,
            VIS_NOT_READY: 1,
            VIS_VISIBLE: 2,
            VIS_HIGH: 3
        },
        story_type: {
            STORY4MEMBER: 1,
            STORY4EVENT: 2,
            STORY4PHOTO: 3,
            STORY4TERM: 4,
            STORY4MESSAGE: 5,
            STORY4HELP: 6
        }
    };
    pending = 0;

    constructor(httpClient: HttpClient, eventAggregator: EventAggregator) {
        this.httpClient = httpClient;
        this.eventAggregator = eventAggregator;
        let href = window.location.href;
        let app = href.split('/')[3];
        if (app == '#') {
            app = 'gbs';
        }
        httpClient.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(environment.baseURL + '/' + app + '/')
                .withInterceptor(new SimpleInterceptor());
        });
        this.get_constants();
        this.listen('ALL');
        this.listen('TASK_MONITOR');
        THIS = this;
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
        return this.httpClient.fetch(`members/get_member_details?${params(memberId)}`)
    }

    getStoryDetail(story) {
        return this.call_server('members/get_story_detail', story);
    }

    getPhotoDetail(photo) {
        return this.call_server('members/get_photo_detail', photo);
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
                this.eventAggregator.publish('FilesUploaded', response);
            })
            .catch(e => console.log('error occured ', e));
    }

    get_constants() {
        this.call_server_post('members/get_constants')
            .then(response => this.constants = response);
    }

    listen(group?) {
        this.call_server('default/get_tornado_host', { group: group })
            .then(data => {
                let ws = data.ws;
                if (!this.web2py_websocket(ws, this.handle_ws_message)) {
                    alert("html5 websocket not supported by your browser, try Google Chrome");
                };
            });
    }

    handle_ws_message(msg) {
        let obj;
        try {
            obj = JSON.parse(msg.data);
        } 
        catch(e) {
            console.log("ERROR handling ws message ", msg, " Exception ", e);
            return;
        }

        let key = obj.key;
        let data = obj.data;
        console.log("publishing key/data ", key, '/', data);
        THIS.eventAggregator.publish(key, data);
    }

    web2py_websocket(url, onmessage, onopen?, onclose?) {
        if ("WebSocket" in window) {
            var ws = new WebSocket(url);
            ws.onopen = onopen ? onopen : (function () { });
            ws.onmessage = onmessage;
            ws.onclose = onclose ? onclose : (function () { });
            return true; // supported
        } else return false; // not supported
    }

}


