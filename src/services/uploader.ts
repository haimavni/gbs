import { MemberGateway } from '../services/gateway';
import { autoinject, noView } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import {ThemeA} from './theme-a';

let This;

@autoinject()
@noView()
class Uploader {
    api: MemberGateway;
    eventAggregator: EventAggregator;
    themeA: ThemeA;

    constructor(api: MemberGateway, eventAggregator: EventAggregator, themeA: ThemeA) {
        this.api = api;
        this.eventAggregator = eventAggregator;
        this.themeA = themeA;
        This = this;
    }

    uploadFiles(user_id, fileList, end_point, info = {}) {
        //let This = this;
        let n = fileList.length;
        let uploaded_file_ids = [];
        let failed = [];
        let duplicates = [];
        let total_size = 0;
        for (let file of fileList) {
            total_size += file.size;
        }
        let total_uploaded = 0;

        this.eventAggregator.publish('FileWasUploaded', { files_left: n, total_size: total_size });
        for (let file of fileList) {
            let fr = new FileReader();
            fr.readAsBinaryString(file);
            let payload = { user_id: user_id }
            fr.onload = function () {
                payload['file'] = { user_id: user_id, name: file.name, size: file.size, BINvalue: this.result, info: info, webp_supported: This.themeA.webpSupported };
                This.upload(payload, end_point)
                    .then(response => {
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
                            This.call_server_post('default/notify_new_files', { uploaded_file_ids: uploaded_file_ids, what: end_point });
                        }
                    })
                    .catch(e => console.log('error occured ', e));
            }
        }
    }

    upload(payload, end_point) {
        payload = JSON.stringify(payload);
        return this.api.call_server_post(end_point, payload);
        // switch (what) {
        //     case 'PHOTOS': return this.httpClient.fetch(`photos/upload_photo`, { method: 'POST', body: payload });
        //     case 'DOCS': return this.httpClient.fetch(`docs/upload_doc`, { method: 'POST', body: payload })
        //     case 'AUDIOS': return this.httpClient.fetch(`audios/upload_audio`, { method: 'POST', body: payload });
        //     case 'GROUP-LOGO': return this.httpClient.fetch(`groups/upload_logo`, { method: 'POST', body: payload });
        //     case 'APPLOGO': return this.httpClient.fetch(`admin/upload_logo`, { method: 'POST', body: payload });
        //     case 'PHOTO': return this.httpClient.fetch(`groups/upload_photo`, { method: 'POST', body: payload });
        //     case 'CONTACTS': return this.httpClient.fetch(`groups/upload_contacts`, { method: 'POST', body: payload });
        // }
    }


}
