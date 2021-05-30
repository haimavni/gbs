import { MemberGateway } from './gateway';
import { autoinject} from "aurelia-framework";

let This_Uploader;

@autoinject()
export class Uploader {
    api: MemberGateway;
    files: FileList;
    end_point;
    file_types = "image/*";
    total_size = 0;
    total_uploaded_size = 0;
    chunk_size = 1024*1024;
    high_mark = 20; //no more then 20 uploads simultaneously
    low_mark = 15;  //resume uploading if at most 15 uploads are being processed
    header_str = "Upload";
    n_concurrent = 0;
    info;
    working = false;

    constructor(api: MemberGateway) {
        this.api = api;
        This_Uploader = this;
    }

    activate(model) {
        this.end_point = model.end_point;
        this.header_str = model.header_str || "Upload files";
        this.file_types = model.file_types || "image/*";
        this.info = model.info;
    }

    uploadFiles(user_id, fileList, end_point, info = {}) {
        //let This_Uploader = this;
        let n = fileList.length;
        let uploaded_file_ids = [];
        let failed = [];
        let duplicates = [];
        let total_size = 0;
        for (let file of fileList) {
            total_size += file.size;
        }
        console.log("num files: ", n, " total size: ", total_size);
        this.working = true;
        for (let file of fileList) {
            this.upload_file(file, user_id);
            // let fr = new FileReader();
            // fr.readAsBinaryString(file);
            // let payload = { user_id: user_id }
            // fr.onload = function () {
            //     payload['file'] = { user_id: user_id, name: file.name, size: file.size, BINvalue: this.result, info: info, webp_supported: This_Uploader.themeA.webpSupported };
            //     This_Uploader.upload(payload, end_point)
            //         .then(response => {
            //             if (response.upload_result.failed) {
            //                 failed.push(file.name)
            //             } else if (response.upload_result.duplicate) {
            //                 duplicates.push(response.upload_result.duplicate)
            //             } else {
            //                 uploaded_file_ids.push(response.upload_result.photo_id)
            //             }
            //             n -= 1;
            //             if (n == 0) {
            //                 //This_Uploader.eventAggregator.publish('FilesUploaded', { failed: failed, duplicates: duplicates, uploaded: uploaded_file_ids });
            //                 This_Uploader.call_server_post('default/notify_new_files', { uploaded_file_ids: uploaded_file_ids, what: end_point });
            //             }
            //         })
            //         .catch(e => console.log('error occured ', e));
            // }
        }
    }

    async upload_file(file: File, user_id) {
        let start = 0;
        let end;
        let payload;
        let fr;
        console.log("entered upload file. file: ", file);
        await sleep(15000);
        while (start < file.size) {
            end = Math.min(start + this.chunk_size, file.size);
            let blob: Blob = file.slice(start, end);
            payload = {user_id: user_id};
            fr = new FileReader;
            fr.readAsBinaryString(blob);
            console.log("start,end: ", start, end);
            fr.onload = async function () {
                payload['file'] = {
                    user_id: user_id, name: file.name, size: file.size, BINvalue: this.result,
                    info: This_Uploader.info, webp_supported: This_Uploader.themeA.webpSupported,
                    start: start,
                    end: end
                };
                if (This_Uploader.n_concurrent > This_Uploader.high_mark) {
                    for (let i = 0; i < 1000; i++) {
                        await sleep(100);
                        if (This_Uploader.n_concurrent < This_Uploader.low_mark) break;
                    }
                }
                This_Uploader.n_concurrent += 1;
                console.log("This_Uploader.end_point ", This_Uploader.end_point);
                await sleep(12000);
                // This_Uploader.api.call_server_post(This_Uploader.end_point, payload)
                //     .then(response => {
                //         This_Uploader.n_concurrent -= 1;
                //         if (response.upload_result.failed) {
                //             This_Uploader.failed.push(file.name)
                //         } else if (response.upload_result.duplicate) {
                //             This_Uploader.duplicates.push(response.upload_result.duplicate)
                //         } else {
                //             This_Uploader.uploaded_file_ids.push(response.upload_result.photo_id)
                //         }
                //         This_Uploader.total_uploaded_size += end - start;
                //     })
            }
            start += this.chunk_size;
        }
    }

    upload(payload, end_point) {
        //payload = JSON.stringify(payload);
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
