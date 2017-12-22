import { autoinject, singleton, noView } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';
import { Cookies } from './cookies';

@autoinject()
@singleton()
@noView()
export class Theme {
    api;
    eventAggregator: EventAggregator;
    files: {};
    width = 0;
    height = 0;
    display_header_background = false;
    min_height = 0;
    footer_height = 67;
    cookies;
    _font_size;// = "font-size-110";

    constructor(api: MemberGateway, eventAggregator: EventAggregator, cookies: Cookies) {
        this.api = api;
        this.cookies = cookies;
        this.eventAggregator = eventAggregator;
        this.api.call_server('members/get_theme_data')
            .then(response => this.files = response.files);
        window.addEventListener('resize', () => {
            console.log('addEventListener - resize');
            this.handle_content_resize();
        }, true);
        window.setTimeout(() => { this.handle_content_resize(); }, 200);

    }

    handle_content_resize() {
        let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        if (w != this.width || h != this.height) {
            console.log("resize.  w, h: ", w, h);
            this.height = h;
            this.width = w;
            this.min_height = this.height - this.footer_height;
            this.eventAggregator.publish('WINDOW-RESIZED', { width: w, height: h });
        }
    }

    get font_size() {
        if (!this._font_size) {
            this._font_size = this.cookies.get('FONT-SIZE')
            if (!this._font_size) {
                this._font_size = 'font-size-110';
                this.cookies.put('FONT-SIZE', this._font_size);
            }
        }
        return this._font_size;
    }

    set font_size(size) {
        this._font_size = size;
        this.cookies.put('FONT-SIZE', this._font_size);
    }
}

