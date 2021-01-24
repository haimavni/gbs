import {bindable, bindingMode, DOM, inject} from 'aurelia-framework';
import { debounce } from '../../../services/debounce';

@inject(DOM.Element)
export class MyMapCustomElement {
    element;
    has_location = false;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) longitude = 35.22;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) latitude = 31.77;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) zoom = 12;
    @bindable can_mark = true;
    @bindable marked = false;
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
        this.update_location_debounced("bounds-changed");
        this.longitude = this.map.center.lng();
        this.latitude = this.map.center.lat();
    }

    constructor(element) {
        this.element = element;
        this.update_location_debounced = debounce(this.update_location, 1500, false);
    }

    async map_loaded(x, map, event) {
        if (!this.google_maps) {
            this.google_maps = (<any>window).google.maps;
        }
        this.map = map;
        this.create_search_box();
        console.log("map loaded. marked? ", this.marked, " longitude: ", this.longitude);
        if (this.marked) {
            await this.place_marker();
        }
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
            if (this.can_mark) {
                this.longitude = lng;
                this.latitude = lat;
                this.place_marker().then(() => {});
            } else {
                this.map.setCenter({lng: lng, lat: lat});
            }
        });
        this.map.controls[this.google_maps.ControlPosition.TOP_CENTER].push(input);
    }

    async create_marker(event: CustomEvent) {
        event.stopPropagation();
        //if (!this.can_mark) return;
        let zoom = this.map.zoom;
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        if (this.can_mark) {
            await this.place_marker();
        } else {
            this.map.setCenter({lng: this.longitude, lat: this.latitude});
        }
        return false;
    }

    async place_marker() {
        let zoom = this.map.zoom;
        this.markers = [{latitude: this.latitude, longitude: this.longitude}];
        await sleep(10);
        this.zoom = zoom;
        this.update_location('marker-placed');
    }

    dispatch_event(what) {
        let changeEvent = new CustomEvent('location-changed', {
            detail: {
                what: what,
                latitude: this.latitude,
                longitude: this.longitude,
                zoom: this.zoom,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    update_location(what='locate') {
        this.dispatch_event(what);
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
