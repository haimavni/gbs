import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogController } from 'aurelia-dialog';

@autoinject()
export class UploadDocs {

    api;
    router;
    docs: FileList;
    user: User;
    ea: EventAggregator;
    dc: DialogController;
    upload_finished = false;
    uploaded;
    duplicates;
    failed = [];
    docs_left = 0;
    working = false;
    host_name;

    constructor(api: MemberGateway, router: Router, user: User, ea: EventAggregator, dc: DialogController) {
        this.api = api;
        this.router = router;
        this.user = user;
        this.ea = ea;
        this.dc = dc;
    }

    attached() {
        this.host_name = window.location.hostname;
    }

    save() {
        this.working = true;
        this.ea.subscribe('FilesUploaded', response => {
            console.log("files uploaded. response: ", response);
            this.working = false;
            this.upload_finished = true;
            this.uploaded = response.uploaded;
            this.duplicates = response.duplicates;
            this.failed = response.failed;
            window.setTimeout(() => {
                this.dc.ok(response);
            }, 15000);
        });
        this.ea.subscribe('FileWasUploaded', response => {
            this.docs_left = response.files_left
        });
        if (this.docs) {
            this.api.uploadFiles(
                this.user.id,
                this.docs,
                'DOCS'
            );
        }
    }
}
