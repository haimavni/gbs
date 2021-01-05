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
    longitude = null;
    latitude = null;
    zoom = 12;
    back;
    tracked_zoom: number = 0;
    longitude_distance = 0;
    map_visible = false;
    visibility_changed = false;
    markers = [];
    map_zoom_stops = [
        176.32497445272955,
        148.8754982449835,
        95.38534383424921,
        51.15962888165051,
        26.011174973799804,
        13.058516541061568,
        6.535832712495857,
        3.2687367661950795,
        1.6344708899971288,
        0.8172482569694353,
        0.4086257299375582,
        0.20431306514901948,
        0.10215655759700581,
        0.05107828192631203,
        0.025539141354123274,
        0.012769570725943424,
        0.006384785369075274,
        0.003192392685303247,
        0.0015961963427422177,
        0.0007980981713835433,
        0.00039904908570420616,
        0.00019952454285032672,
        0.00009976227141450522,
        0.000049881135698370827
    ];
    update_photo_location_debounced;
    location_address;

    bounds_changed(event) {
        if (this.visibility_changed) {
            this.visibility_changed = false;
        }
        if (! this.map_visible) return;
        let x = event.detail.bounds.Wa;
        if (!x) return;
        let longitude_distance = x.j - x.i;
        if (longitude_distance < 0.00000001) return;
        this.tracked_zoom = this.calc_tracked_zoom(longitude_distance);
        if (! this.tracked_zoom) return;
        this.zoom = this.tracked_zoom;
        this.update_photo_location_debounced();
    }

    constructor(user: User, api: MemberGateway) {
            this.user = user;
            this.api = api;
    }

    calc_tracked_zoom(longitude_distance) {
        let zoom = 0;
        for (let dist of this.map_zoom_stops) {
            if (dist <= longitude_distance) {
                if (longitude_distance / dist > 1.2)
                    zoom -= 1;
                return zoom
            }
            else zoom += 1;
        }
        return 24;
    }

    async create_marker(event: CustomEvent) {
        event.stopPropagation();
        if (!this.user.editing) return;
        let tracked_zoom = this.tracked_zoom;
        this.zoom = tracked_zoom - 1;
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.markers = [{ latitude: this.latitude, longitude: this.longitude }];
        //for some reason, the above changes zoom to an extremely high value
        await sleep(400);
        this.zoom = tracked_zoom;
        await sleep(400);
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
