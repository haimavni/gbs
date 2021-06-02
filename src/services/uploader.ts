import {MemberGateway} from './gateway';
import {autoinject} from "aurelia-framework";
import {User} from './user';
import {DialogController} from "aurelia-dialog";
import {Misc} from './misc';

let This_Uploader;

@autoinject()
export class Uploader {
    api: MemberGateway;
    user: User;
    misc: Misc;
    files: FileList;
    dlg: DialogController;
    endpoint;
    file_types = "image/*";
    total_size = 0;
    total_uploaded_size = 0;
    chunk_size = 1024 * 1024;
    uploaded_file_ids = [];
    failed = [];
    duplicates = [];
    high_mark = 20; //no more then 20 uploads simultaneously
    low_mark = 15;  //resume uploading if at most 15 uploads are being processed
    header_str = "Upload";
    n_concurrent = 0;
    info;
    working = false;
    crc_values = {};

    constructor(api: MemberGateway, user: User, dlg: DialogController, misc: Misc) {
        this.api = api;
        this.user = user;
        this.misc = misc;
        this.dlg = dlg;
        This_Uploader = this;
    }

    activate(model) {
        this.endpoint = model.endpoint;
        this.header_str = model.header_str || "Upload files";
        this.file_types = model.file_types || "image/*";
        this.info = model.info;
    }

    save() {
        this.uploadFiles(this.user.id, this.files);
    }

    cancel() {
        this.dlg.cancel();
    }

    async uploadFiles(user_id, fileList, info = {}) {
        //let This_Uploader = this;
        let n = fileList.length;
        for (let file of fileList) {
            this.total_size += file.size;
            this.calc_file_crc(file);
        }
        this.working = true;
        for (let i = 0; i < 100; i++) {
            let n = Object.keys(this.crc_values).length;
            if (n >= fileList.length) break;
            await sleep(100);
        }
        for (let file of fileList) {
            this.upload_file(file, user_id);
        }
    }

    async upload_file(file: File, user_id) {
        let start = 0;
        let end;
        let duplicate = false;
        await this.api.call_server_post(this.endpoint, {what: 'start', file_name: file.name, user_id: user_id, crc: this.crc_values[file.name]})
            .then(response => {
                if (response.duplicate) {
                    this.duplicates.push(file.name);
                    duplicate = true;
                }
            });
        if (duplicate) return;
        while (start < file.size) {
            end = Math.min(start + this.chunk_size, file.size);
            let is_last = end >= file.size;
            let start0 = start;
            await this.upload_chunk(file, start0, end, is_last);
            start += this.chunk_size;
        }
    }

    async upload_chunk(file, start, end, is_last) {
        //await sleep(2000);
        let blob: Blob = file.slice(start, end);
        let user_id = this.user.id;
        let payload = {user_id: user_id};
        let fr = new FileReader;
        //fr.readAsBinaryString(blob);
        fr.readAsArrayBuffer(blob);
        fr.onloadstart = function(ev) {
            //console.log("loadstart file.name ", file.name, " start ", start, "event ", ev);
        }
        fr.onloadend = function(ev: Event) {
            //console.log("loadend file.name ", file.name, " start ", start, "event ", ev);
        }
        fr.onerror = function(ev) {
            //console.log("Error ", ev);
        }
        let call_returned = false;
        fr.onload = async function (ev) {
            //console.log("load file.name ", file.name, " start ", start, "event ", ev);
            //console.log("fr after ", fr);
            let result = Array.from(new Uint8Array(this.result));
            //let result = this.result;
            payload['file'] = {
                user_id: user_id, name: file.name, size: file.size, BINvalue: result,
                info: This_Uploader.info,
                start: start,
                end: end
            };
            payload['what'] = 'save'
            payload['file_name'] = file.name;
            payload['start'] = start;
            payload['end'] = end;
            let crc = This_Uploader.crc_values[file.name]
            payload['crc'] = crc;
            if (This_Uploader.n_concurrent > This_Uploader.high_mark) {
                for (let i = 0; i < 1000; i++) {
                    await This_Uploader.misc.sleep(100);
                    if (This_Uploader.n_concurrent < This_Uploader.low_mark) break;
                }
            }
            This_Uploader.n_concurrent += 1;
            //console.log("start: ", file.name, " @", start, " payload: ", payload);
            This_Uploader.api.call_server_post(This_Uploader.endpoint, payload)
                .then(response => {
                    call_returned = true
                    //console.log("response is ", response);
                    This_Uploader.n_concurrent -= 1;
                    if (response.upload_result.failed) {
                        This_Uploader.failed.push(file.name)
                    } else if (response.upload_result.duplicate) {
                        This_Uploader.duplicates.push(response.upload_result.duplicate)
                    } else {
                        This_Uploader.uploaded_file_ids.push(response.upload_result.photo_id)
                    }
                    This_Uploader.total_uploaded_size += end - start;
                    if (This_Uploader.total_uploaded_size >= This_Uploader.total_size) {
                        This_Uploader.dlg.ok({
                            failed: This_Uploader.failed,
                            duplicated: This_Uploader.duplicates,
                            uploaded: This_Uploader.uploaded_file_ids
                        });
                    }
                })
        }
        for (let i = 0; i < 10000; i++) {
            if (call_returned) {
                //console.log("call returned")
                return
            }
            await sleep(100);
        }
    }

    calc_file_crc(file) {
        let crc = 0;
        let start = 0;
        let end;
        while (start < file.size) {
            end = Math.min(start + this.chunk_size, file.size);
            let is_last = (start + this.chunk_size >= file.size);
            this.calc_chunk_crc(file, start, end, crc, is_last);
            start += this.chunk_size;
        }
    }

    calc_chunk_crc(file, start, end, crc = 0, is_last = false) {
        let blob: Blob = file.slice(start, end);
        let fr = new FileReader;
        fr.readAsBinaryString(blob);
        fr.onload = async function () {
            let arr = Int8Array.from(this.result);
            crc = This_Uploader.misc.crc32FromArrayBuffer(arr, crc);
            if (is_last) {
                This_Uploader.crc_values[file.name] = crc;
            }
        }
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
