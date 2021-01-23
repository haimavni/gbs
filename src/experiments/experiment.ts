import { autoinject, computedFrom } from 'aurelia-framework';
import { User } from '../services/user';

@autoinject
export class Experiment {
    longitude: number = 35.22;
    latitude: number = 31.77;
    zoom: number = 10;
    can_mark = true;
    user: User;

    constructor(user: User) {
        this.user = user;
    }

    location_changed(event) {
        let detail = event.detail;
        console.log(detail);
        this.longitude = detail.longitude;
        this.latitude = detail.latitude;
        this.zoom = detail.zoom;
        //this.markers = detail.markers;
    }
}
