/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */
import { fetch } from 'whatwg-fetch';
import { DI, IEventAggregator } from 'aurelia';
import { newInstanceOf } from '@aurelia/kernel';
import { HttpClient, json, Interceptor } from '@aurelia/fetch-client';
import environment from '../environment';
import * as download from 'downloadjs';
import { I18N } from '@aurelia/i18n';
import * as toastr from 'toastr';
import {ThemeA} from './theme-a';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';

export const IMemberGateway = DI.createInterface<IMemberGateway>('IMemberGateway', x => x.singleton(MemberGateway));
export type IMemberGateway = MemberGateway;

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
        const r = response.json();
        THIS.pending -= 1;
        return r;
    }

    responseError(response: Response) {
        toastr.error('An error has occured! ' + response.statusText);
        console.log("Server error: ", response);
        THIS.pending -= 1;
        return response;
    }
}

export class MemberGateway {
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
            STORY4HELP: 6,
            STORY4DOC: 7,
            STORY4VIDEO: 8,
        },
        ptp_key: 0
    };

    pending = 0;
    ptp_connected;

    constructor(@newInstanceOf(HttpClient) readonly httpClient: HttpClient, @IEventAggregator readonly eventAggregator: IEventAggregator, @I18N readonly i18n: I18N, @IThemeA readonly themeA: IThemeA) {
        const href = window.location.href;

        let app = href.split('/')[3];

        if (href.includes('localhost')) {
            app = process.env.app;
        }

        httpClient.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(process.env.baseURL + '/' + app + '/')
                .withInterceptor(new SimpleInterceptor());

            return config;
        });

        this.get_constants();
        
        //this.start_listening();
        THIS = this;
    }

    async start_listening() {
        //let first page show up before
        await sleep(10000);
        this.listen('ALL');
        this.listen(this.constants.ptp_key);
        //this.listen('TASK_MONITOR');
    }

    tr(s) {
        if (s.startsWith('!')) {
            s = s.slice(1, s.length);
            s = this.i18n.tr(s);
        }
        return s;
    }

    call_server(url: string, data?: any) {
        if (data) {
            url += '?' + params(data);
        }
        return this.httpClient.fetch(url) //, {method: "POST", body: json(data))
            .catch(error => toastr.error(error))
            .then((result) => {
                if (result.error) {
                    toastr.error('Error occurred: ' + result.error);
                    return result;
                } else if (result.user_error) {
                    toastr.warning(this.tr(result.user_error));
                    return result;
                } else {
                    return result;
                }
            });
    }

    call_server_post(url: string, data?: any) {
        const t0 = (new Date()).getTime();
        console.log(t0 + ': ' + url);
        data = data ? data : {};
        data['ptp_key'] = this.constants.ptp_key;
        data['webpSupported'] = this.themeA.webpSupported;
        const x = JSON.stringify(data);
        return this.httpClient.fetch(url, { method: "POST", body: x })
            .catch(error => toastr.error(error + ' in ', url))
            .then((result) => {
                const t1 = (new Date()).getTime();
                console.log(t1 +  ': ' +  url +  ' Done in ' + (t1 - t0) +  ' milliseconds');
                console.log("Result: ", result)
                if (result.error) {
                    toastr.error("Server error occured: " + this.tr(result.error));
                    return result;
                } else if (result.user_error) {
                    toastr.warning(this.tr(result.user_error));
                    return result;
                } else {
                    return result;
                }
            });
    }

    getMemberList() {
        return this.httpClient.fetch('members/member_list')
    }

    getStoryDetail(story) {
        return this.call_server('members/get_story_detail', story);
    }

    getPhotoDetail(photo) {
        return this.call_server_post('photos/get_photo_detail', photo);
    }

    uploadFiles(user_id, fileList, what, info = {}) {
        const This = this;
        let n = fileList.length;
        const uploaded_file_ids = [];
        const failed = [];
        const duplicates = [];
        This.eventAggregator.publish('FileWasUploaded', { files_left: n });
        for (const file of fileList) {
            const fr = new FileReader();
            fr.readAsBinaryString(file);
            const payload = { user_id: user_id }
            fr.onload = function () {
                payload['file'] = { user_id: user_id, name: file.name, size: file.size, BINvalue: this.result, info: info, webp_supported: THIS.themeA.webpSupported };
                This.upload(payload, what)
                    .then((response: any) => {
                        if (response.upload_result.failed) {
                            failed.push(file.name)
                        } else if (response.upload_result.duplicate) {
                            duplicates.push(response.upload_result.duplicate)
                        } else {
                            uploaded_file_ids.push(response.upload_result.photo_id)
                        }
                        n -= 1;
                        This.eventAggregator.publish('FileWasUploaded', { files_left: n });
                        if (n == 0) {
                            This.eventAggregator.publish('FilesUploaded', { failed: failed, duplicates: duplicates, uploaded: uploaded_file_ids });
                            This.call_server_post('default/notify_new_files', { uploaded_file_ids: uploaded_file_ids, what: what });
                        }
                    })
                    .catch(e => console.log('error occured ', e));
            }
        }
    }

    upload(payload, what) {
        payload = JSON.stringify(payload);
        switch (what) {
            case 'PHOTOS': return this.httpClient.fetch(`photos/upload_photo`, { method: 'POST', body: payload });
            case 'DOCS': return this.httpClient.fetch(`docs/upload_doc`, { method: 'POST', body: payload })
            case 'AUDIOS': return this.httpClient.fetch(`audios/upload_audio`, { method: 'POST', body: payload });
            case 'GROUP-LOGO': return this.httpClient.fetch(`groups/upload_logo`, { method: 'POST', body: payload });
            case 'APPLOGO': return this.httpClient.fetch(`admin/upload_logo`, { method: 'POST', body: payload });
            case 'PHOTO': return this.httpClient.fetch(`groups/upload_photo`, { method: 'POST', body: payload });
            case 'CONTACTS': return this.httpClient.fetch(`groups/upload_contacts`, { method: 'POST', body: payload });
        }
    }

    get_constants() {
        this.call_server_post('starter/get_constants')
            .then(response => {
                this.constants = response;
                this.start_listening();
            });
    }

    async listen(group) {
        let listener;
        await this.call_server('default/get_tornado_host', { group: group })
            .then(data => {
                const ws = data.ws;
                listener = this.web2py_websocket(ws, this.handle_ws_message);
                if (!listener) {
                    alert("html5 websocket not supported by your browser, try Google Chrome");
                };
                if (group == this.constants.ptp_key) {
                    this.ptp_connected = true;
                }
            });
        return listener;
    }

    handle_ws_message(msg) {
        console.log("web socket message: ", msg)
        if (msg.data.startsWith('+anonymous')) return;
        if (msg.data.startsWith('-anonymous')) return;
        let obj;
        try {
            obj = JSON.parse(msg.data);
        }
        catch (e) {
            console.log("ERROR handling ws message ", msg, " Exception ", e);
            return;
        }

        const key = obj.key;
        const data = obj.data;
        THIS.eventAggregator.publish(key, data);
    }

    web2py_websocket(url, onmessage, onopen?, onclose?) {
        if ("WebSocket" in window) {
            const ws = new WebSocket(url);
            ws.onopen = onopen ? onopen : (function () { });
            ws.onmessage = onmessage;
            ws.onclose = onclose ? onclose : (function () { });
            console.log("url in web socket: ", url);
            return ws; // supported
        } else return false; // not supported
    }

    hit(what, item_id?) {
        this.call_server('members/count_hit', { what: what, item_id: item_id | 0 })
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
