import { autoinject, singleton, noView, computedFrom } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';
import { Cookies } from './cookies';

const rtl_langs = new Set(['he', 'ar']);
let THEME;

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
    _locale;
    askLanguage = false;
    public rtltr;
    i18n;
    touchScreen = null;
    _interact_setting = {};
    page_title = "";
    hide_title = false;
    same_dir;
    other_dir;

    constructor(api: MemberGateway, eventAggregator: EventAggregator, cookies: Cookies, i18n: I18N) {
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
        this.i18n = i18n;
        //force locale from cookies if exists
        let locale = this.i18n.getLocale();
        if (this.locale != locale) {
            this.i18n.setLocale(this.locale)
        }
        this.rtltr = rtl_langs.has(this.locale) ? "rtl" : "ltr";
        this.same_dir = this.rtltr == "rtl" ? "right" : "left";
        this.other_dir = this.rtltr == "rtl" ? "left" : "right";
        try {
            let userLangs = navigator.languages;
            let hasHebrew = userLangs.find(lang => lang.startsWith('he'));
            this.askLanguage = !hasHebrew;
        } catch (e) {
            console.log('error occured in theme: ', e);
        }
        THEME = this;
        this.detectTouchScreen();
        this.set_heights();
    }

    detectTouchScreen() {
        if (this.touchScreen == null) {
            window.addEventListener('touchstart', function onFirstTouch() {
                THEME.touchScreen = true;
                THEME._interact_setting = { interactable: { preventDefault: 'never' } };
                window.removeEventListener('touchstart', onFirstTouch, false);
            }, false);
        }
    }

    @computedFrom('touchScreen')
    get interact_setting()
     {
        return this._interact_setting;
    }

    set_heights() {
        let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        let result = (w != this.width || h != this.height);
        this.width = w;
        this.height = h;
        this.min_height = this.height - this.footer_height;
        return result;
    }

    handle_content_resize() {
        let changed = this.set_heights();
        if (changed) {
            this.eventAggregator.publish('WINDOW-RESIZED', { width: this.width, height: this.height });
        }
    }

    get font_size() {
        if (!this._font_size) {
            this._font_size = this.cookies.get('FONT-SIZE')
            if (!this._font_size) {
                this._font_size = 'font-size-120';
                this.cookies.put('FONT-SIZE', this._font_size);
            }
        }
        return this._font_size;
    }

    set font_size(size) {
        this._font_size = size;
        this.cookies.put('FONT-SIZE', this._font_size);
    }

    get locale() {
        if (!this._locale) {
            this._locale = this.cookies.get('locale')
            if (!this._locale) {
                this._locale = this.i18n.getLocale();
            }
        }
        return this._locale;
    }

    changeLocale(locale) {
        this._locale = locale;
        //todo: merge with locale picker
        this.cookies.put('locale', this._locale);
        this.rtltr = rtl_langs.has(this.locale) ? "rtl" : "ltr";
        return this.i18n.setLocale(locale);
    }

}

