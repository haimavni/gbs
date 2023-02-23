import { IEventAggregator } from 'aurelia';
import { IDialogController } from '@aurelia/dialog';
import { IRouter, IRouteableComponent } from '@aurelia/router';
import { IMemberGateway } from '../services/gateway';
import { IUser } from '../services/user';

export class UploadPhotos implements IRouteableComponent {
    photos: FileList;
    upload_finished = false;
    uploaded;
    duplicates;
    failed = [];
    photos_left = 0;
    working = false;
    host_name;

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

    cancel() {
        this.dc.cancel();
    }

    save() {
        this.working = true;
        this.ea.subscribe('FilesUploaded', (response: any) => {
            this.working = false;
            this.upload_finished = true;
            this.uploaded = response.uploaded;
            this.duplicates = response.duplicates;
            this.failed = response.failed;
            window.setTimeout(() => {
                this.dc.ok(response);
            }, 1500);
        });
        this.ea.subscribe('FileWasUploaded', (response: any) => {
            this.photos_left = response.files_left;
        });
        if (this.photos) {
            this.api.uploadFiles(this.user.id, this.photos, 'PHOTOS');
        }
    }
}
