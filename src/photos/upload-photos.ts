import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogController } from 'aurelia-dialog';

@autoinject()
export class UploadPhotos {

  api;
  router;
  photos: FileList;
  user: User;
  ea: EventAggregator;
  dc: DialogController;
  upload_finished = false;
  number_uploaded;
  number_duplicates;
  failed = [];
  working = false;

  constructor(api: MemberGateway, router: Router, user: User, ea: EventAggregator, dc: DialogController) {
    this.api = api;
    this.router = router;
    this.user = user;
    this.ea = ea;
    this.dc = dc;
  }

  save() {
    this.working = true;
    this.ea.subscribe('FilesUploaded', response => {
      this.working = false;
      this.upload_finished = true;
      this.number_uploaded = response.number_uploaded;
      this.number_duplicates = response.number_duplicates;
      this.failed = response.failed;
      window.setTimeout(() => {
        this.dc.ok(response);
      }, 15000);
    });
    if (this.photos) {
      this.api.uploadPhotos(
        this.photos
      );
    }
  }
}
