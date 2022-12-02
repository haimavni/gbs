import { IRouter } from "@aurelia/router";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import {
    ICustomElementViewModel,
    IDialogController,
    IEventAggregator,
} from "aurelia";

export class UploadDocs implements ICustomElementViewModel {
    upload_finished = false;
    uploaded;
    duplicates;
    failed = [];
    docs_left = 0;
    working = false;
    host_name;
    docs: FileList;

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @IRouter readonly router: IRouter,
        @IUser readonly user: IUser,
        @IEventAggregator readonly ea: IEventAggregator,
        @IDialogController readonly dc: IDialogController
    ) {}

    attached() {
        this.host_name = window.location.hostname;
    }

    save() {
        this.working = true;
        this.ea.subscribe("FilesUploaded", (response: any) => {
            this.working = false;
            this.upload_finished = true;
            this.uploaded = response.uploaded;
            this.duplicates = response.duplicates;
            this.failed = response.failed;
            
            window.setTimeout(() => {
                this.dc.ok(response);
            }, 15000);
        });
        this.ea.subscribe("FileWasUploaded", (response: any) => {
            this.docs_left = response.files_left;
        });
        if (this.docs) {
            this.api.uploadFiles(this.user.id, this.docs, "DOCS");
        }
    }
}
