/* eslint-disable @typescript-eslint/no-this-alias */
import { IMemberGateway } from "./gateway";
import { IUser } from "./user";
import { IDialogController } from "@aurelia/runtime-html";
import { IMisc } from "./misc";

let This_Uploader;

export class Uploader {
    files: FileList;
    endpoint;
    what = "";
    file_types = "image/*";
    objects_name = "photos.photos";
    objects_were_selected_text = "photos.photos-were-selected";
    select_objects_text;
    uploaded_objects_text;
    duplicate_objects_text;
    failed_objects_text;
    total_size = 0;
    total_uploaded_size = 0;
    chunk_size = 1024 * 1024;
    uploaded_file_ids = [];
    failed = [];
    duplicates = [];
    high_mark = 20; //no more then 20 uploads simultaneously
    low_mark = 15; //resume uploading if at most 15 uploads are being processed
    header_str = "Upload";
    n_concurrent = 0;
    info;
    working = false;
    crc_values = {};

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @IDialogController readonly dlg: IDialogController,
        @IMisc readonly misc: IMisc
    ) {
        This_Uploader = this;
    }

    loading(model) {
        this.endpoint = model.endpoint;
        this.header_str = model.header_str || "Upload files";
        this.file_types = model.file_types || "image/*";
        this.objects_name = model.objects_name || "photos.photos";
        this.select_objects_text =
            model.select_objects_text || "photos.select-photos";
        this.objects_were_selected_text =
            model.objects_were_selected_text || "photos.photos-were-selected";
        this.uploaded_objects_text =
            model.uploaded_objects_text || "photos.uploaded";
        this.failed_objects_text = model.failed_objects_text || "photos.failed";
        this.duplicate_objects_text =
            model.duplicate_objects_text || "photos.duplicate";
        this.info = model.info;
        this.what = model.what || "PHOTOS";
    }

    save() {
        this.uploadFiles(this.user.id, this.files);
    }

    cancel() {
        this.dlg.cancel();
    }

    async uploadFiles(user_id, fileList, info = {}) {
        //let This_Uploader = this;
        const n = fileList.length;

        for (const file of fileList) {
            this.total_size += file.size;
            this.calc_file_crc(file);
        }
        this.working = true;
        for (let i = 0; i < 100; i++) {
            const n = Object.keys(this.crc_values).length;
            if (n >= fileList.length) break;
            await sleep(100);
        }
        for (const file of fileList) {
            this.upload_file(file, user_id);
        }
    }

    async upload_file(file: File, user_id) {
        let start = 0;
        let end;
        let duplicate = false;
        let record_id;
        await this.api
            .call_server_post(this.endpoint, {
                what: "start",
                file_name: file.name,
                user_id: user_id,
                crc: this.crc_values[file.name],
            })
            .then((response) => {
                if (response.duplicate) {
                    record_id = response.duplicate;
                    this.duplicates.push(record_id);
                    this.total_uploaded_size += file.size;
                    duplicate = true;
                } else {
                    record_id = response.record_id;
                }
            });
        this.check_if_finished();
        if (duplicate) return;
        while (start < file.size) {
            end = Math.min(start + this.chunk_size, file.size);
            const is_last = end >= file.size;
            const start0 = start;
            await this.upload_chunk(file, start0, end, is_last, record_id);
            start += this.chunk_size;
        }
    }

    async upload_chunk(file, start, end, is_last, record_id) {
        //await sleep(2000);
        const blob: Blob = file.slice(start, end);
        const user_id = this.user.id;
        const payload = { user_id: user_id };
        const fr = new FileReader();
        //fr.readAsBinaryString(blob);
        fr.readAsArrayBuffer(blob);
        fr.onloadstart = function (ev) {
            //console.log("loadstart file.name ", file.name, " start ", start, "event ", ev);
        };
        fr.onloadend = function (ev: Event) {
            //console.log("loadend file.name ", file.name, " start ", start, "event ", ev);
        };
        fr.onerror = function (ev) {
            //console.log("Error ", ev);
        };
        let call_returned = false;
        fr.onload = async function (ev) {
            const result = Array.from(new Uint8Array(this.result as ArrayBuffer));
            //let result = this.result;
            payload["file"] = {
                user_id: user_id,
                name: file.name,
                size: file.size,
                BINvalue: result,
                info: This_Uploader.info,
                start: start,
                end: end,
            };
            payload["what"] = "save";
            payload["file_name"] = file.name;
            payload["start"] = start;
            payload["end"] = end;
            payload["is_last"] = is_last;
            const crc = This_Uploader.crc_values[file.name];
            payload["crc"] = crc;
            payload["record_id"] = record_id;
            if (This_Uploader.n_concurrent > This_Uploader.high_mark) {
                for (let i = 0; i < 1000; i++) {
                    await This_Uploader.misc.sleep(100);
                    if (This_Uploader.n_concurrent < This_Uploader.low_mark)
                        break;
                }
            }
            This_Uploader.n_concurrent += 1;
            This_Uploader.api
                .call_server_post(This_Uploader.endpoint, payload)
                .then((response) => {
                    call_returned = true;
                    This_Uploader.n_concurrent -= 1;
                    if (is_last) {
                        This_Uploader.uploaded_file_ids.push(record_id);
                    }
                    This_Uploader.total_uploaded_size += end - start;
                    if (
                        This_Uploader.total_uploaded_size >=
                        This_Uploader.total_size
                    ) {
                        This_Uploader.api.call_server_post(
                            "default/notify_new_files",
                            {
                                uploaded_file_ids:
                                    This_Uploader.uploaded_file_ids,
                                what: This_Uploader.what,
                            }
                        );
                        This_Uploader.dlg.ok({
                            failed: This_Uploader.failed,
                            duplicates: This_Uploader.duplicates,
                            uploaded: This_Uploader.uploaded_file_ids,
                        });
                    }
                });
        };
        for (let i = 0; i < 10000; i++) {
            if (call_returned) {
                return;
            }
            await sleep(100);
        }
    }

    check_if_finished() {
        if (This_Uploader.total_uploaded_size >= This_Uploader.total_size) {
            This_Uploader.dlg.ok({
                failed: This_Uploader.failed,
                duplicates: This_Uploader.duplicates,
                uploaded: This_Uploader.uploaded_file_ids,
            });
        }
    }

    calc_file_crc(file) {
        const crc = 0;
        let start = 0;
        let end;
        while (start < file.size) {
            end = Math.min(start + this.chunk_size, file.size);
            const is_last = end >= file.size;
            this.calc_chunk_crc(file, start, end, crc, is_last);
            start += this.chunk_size;
        }
    }

    async calc_chunk_crc(file, start, end, crc = 0, is_last = false) {
        const blob: Blob = file.slice(start, end);
        const fr = new FileReader();
        fr.readAsArrayBuffer(blob);
        const done = false;
        fr.onload = async function () {
            const arr = Array.from(new Uint8Array(this.result as ArrayBuffer));
            crc = This_Uploader.misc.crc32FromArrayBuffer(arr, crc);
            if (is_last) {
                This_Uploader.crc_values[file.name] = crc;
            }
        };
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
