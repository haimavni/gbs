import {autoinject} from 'aurelia-framework';
import {MemberGateway} from '../services/gateway';
import {User} from '../services/user';
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
    autocomplete;
    searchBox;
    update_location_debounced;

    bounds_changed(event) {
        this.zoom = this.map.zoom;
        this.update_location_debounced();
    }

    constructor(user: User, api: MemberGateway) {
        this.user = user;
        this.api = api;
        this.update_location_debounced = debounce(this.update_location, 1500, false);
    }

    async map_loaded(x, map, event) {
        if (!this.google_maps) {
            this.google_maps = (<any>window).google.maps;
        }
        this.map = map;
        await sleep(400);
        this.create_search_box();
    }

    create_search_box() {
        // Create the search box and link it to the UI element.
        const input = document.getElementById("pac-input") as HTMLInputElement;
        this.searchBox = new this.google_maps.places.SearchBox(input);
        let LatLngBounds = this.google_maps.LatLngBounds;
        this.searchBox.addListener("places_changed", () => {
            const places = this.searchBox.getPlaces();
            if (!places || places.length == 0 || !places[0].geometry) return;
            let latlng = places[0].geometry.viewport;
            let lat: number = (latlng.Wa.j + latlng.Wa.i) / 2;
            let lng: number = (latlng.Ra.j + latlng.Ra.i) / 2;
            this.map.setCenter({lng: lng, lat: lat});
        });
        this.map.controls[this.google_maps.ControlPosition.TOP_CENTER].push(input);
    }

    async create_marker(event: CustomEvent) {
        event.stopPropagation();
        if (!this.user.editing) return;
        let zoom = this.map.zoom;
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.markers = [{latitude: this.latitude, longitude: this.longitude}];
        //for some reason, the above changes zoom to an extremely high value
        await sleep(400);
        this.zoom = zoom;
        this.update_location_debounced();
        return false;
    }

    update_location() {
        //if (! this.user.editing) return;
        //this.api.call_server_post('photos/update_photo_location', { photo_id: this.photo_id, longitude: this.longitude, latitude: this.latitude, zoom: this.zoom });
        //dispatch event
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
