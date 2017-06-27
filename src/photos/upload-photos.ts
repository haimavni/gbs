import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';

@autoinject()
export class UploadPhotos {

  api;
  router;
  photos: FileList;
  user: User;

  constructor(api: MemberGateway, router: Router, user: User) {
    this.api = api;
    this.router = router;
    this.user = user;
  }

  save() {
    let t = typeof this.photos;
    if (this.photos) {
        this.api.uploadPhotos(
          this.photos
        ).then(() => {
          //splice photo out of the list
        });
    }
  }
}