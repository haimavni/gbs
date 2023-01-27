import { bindable, BindingMode, INode } from 'aurelia';
import { debounce } from '../../../services/debounce';

export class MyMapCustomElement {
    has_location = false;
    @bindable({ mode: BindingMode.twoWay }) longitude = 35.22;
    @bindable({ mode: BindingMode.twoWay }) latitude = 31.77;
    @bindable({ mode: BindingMode.twoWay }) zoom = 12;
    @bindable can_mark = true;
    @bindable marked = false;
    @bindable ignore = false;
    back;
    tracked_zoom = 0;
    longitude_distance = 0;
    markers = [];
    google_maps: any;
    map: any;
    autocomplete;
    searchBox;
    search_pattern = '';
    update_location_debounced;

    bounds_changed(event) {
        if (this.ignore) {
            return;
        }
        this.zoom = this.map.zoom;
        this.longitude = this.map.center.lng();
        this.latitude = this.map.center.lat();
        this.update_location_debounced('bounds-changed');
    }

    constructor(@INode private readonly element: INode) {
        this.element = element;
        this.update_location_debounced = debounce(
            this.update_location,
            1500,
            false
        );
    }

    async map_loaded(x, map, event) {
        if (!this.google_maps) {
            this.google_maps = (<any>window).google.maps;
        }
        this.map = map;
        this.create_search_box();
        if (this.marked) {
            await this.place_marker();
        }
    }

    create_search_box() {
        // Create the search box and link it to the UI element.
        const input = document.getElementById('pac-input') as HTMLInputElement;
        this.searchBox = new this.google_maps.places.SearchBox(input);
        const LatLngBounds = this.google_maps.LatLngBounds;
        this.searchBox.addListener('places_changed', () => {
            const places = this.searchBox.getPlaces();
            if (!places || places.length == 0 || !places[0].geometry) return;
            this.search_pattern = '';
            const latlng = places[0].geometry.viewport;
            //console.log("latlng: ", latlng);
            const lat_lng = latlng.getCenter();
            const lat: number = lat_lng.lat();
            const lng: number = lat_lng.lng();
            if (this.can_mark) {
                this.longitude = lng;
                this.latitude = lat;
                this.place_marker().then(() => {});
            } else {
                this.map.setCenter({ lng: lng, lat: lat });
            }
        });
        this.map.controls[this.google_maps.ControlPosition.TOP_CENTER].push(
            input
        );
    }

    async create_marker(event: CustomEvent) {
        event.stopPropagation();
        //if (!this.can_mark) return;
        const zoom = this.map.zoom;
        const latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        if (this.can_mark) {
            await this.place_marker();
        } else {
            this.map.setCenter({ lng: this.longitude, lat: this.latitude });
        }
        return false;
    }

    async place_marker() {
        const zoom = this.map.zoom;
        this.markers = [{ latitude: this.latitude, longitude: this.longitude }];
        await sleep(1000);
        this.zoom = zoom;
        this.map.setZoom(zoom);
        this.update_location_debounced('marker-placed');
    }

    dispatch_event(what) {
        const changeEvent = new CustomEvent('location-changed', {
            detail: {
                what: what,
                latitude: this.latitude,
                longitude: this.longitude,
                zoom: this.zoom,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    update_location(what = 'locate') {
        this.dispatch_event(what);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
