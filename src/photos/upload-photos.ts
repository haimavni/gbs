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

  constructor(api: MemberGateway, router: Router, user: User, ea: EventAggregator, dc: DialogController) {
    this.api = api;
    this.router = router;
    this.user = user;
    this.ea = ea;
    this.dc = dc;
  }

  save() {
    this.ea.subscribe('FilesLoaded', response => {
      this.dc.ok(response);
    });
    if (this.photos) {
      this.api.uploadPhotos(
        this.photos
      );
    }
  }
}