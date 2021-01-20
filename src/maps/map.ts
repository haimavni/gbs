import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { I18N } from 'aurelia-i18n';
import { debounce } from '../services/debounce';

@autoinject()
export class Map {
    api: MemberGateway;
    user;
    i18n: User;
    has_location = false;
    longitude = 35.22;
    latitude = 31.77;
    zoom = 12;
    back;
    tracked_zoom: number = 0;
    longitude_distance = 0;
    map_visible = false;
    markers = [];
    google_maps: any;
    map: any;
    //update_photo_location_debounced;

    location_address;

    update_photo_location_debounced() {
        console.log("temporary place holder. zoom: ", this.map.zoom);
    }
    bounds_changed(event) {
        this.zoom = this.map.zoom;
        this.update_photo_location_debounced();
    }

    constructor(user: User, api: MemberGateway) {
        this.user = user;
        this.api = api;
    }

    map_loaded(x, map, event) {
        console.log("map loaded: ", map, " event: ", event);
        if (!this.google_maps) {
            this.google_maps = (<any>window).google.maps;
            console.log("google maps: ", this.google_maps);
        }
        this.map = map;
    }

    async create_marker(event: CustomEvent) {
        event.stopPropagation();
        if (!this.user.editing) return;
        let tracked_zoom = this.tracked_zoom;
        let zoom = this.map.zoom;
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.markers = [{ latitude: this.latitude, longitude: this.longitude }];
        //for some reason, the above changes zoom to an extremely high value
        await sleep(400);
        this.zoom = zoom;
        this.update_photo_location_debounced();
        return false;
    }

    /*update_photo_location() {
        if (! this.user.editing) return;
        this.api.call_server_post('photos/update_photo_location', { photo_id: this.photo_id, longitude: this.longitude, latitude: this.latitude, zoom: this.tracked_zoom });
    }*/

    async onSubmitAddress() {
        const place = await this.geocode(this.location_address);
        console.log(place);
    }

  geocode(value) {
  }/*
    return new Promise((resolve, reject) => {
      new google.maps.Geocoder().geocode({ address: value }, (results, status) => {
        status === google.maps.GeocoderStatus.OK ? resolve(results[0]) : reject();
      });
    });
  }*/


}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
