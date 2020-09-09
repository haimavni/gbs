import { autoinject, singleton, noView, computedFrom } from "aurelia-framework";
import { Cookies } from './cookies';
import { supportsWebp} from './dom_utils';

@autoinject()
@singleton()
@noView()
export class ThemeA {
    cookies: Cookies;
    webpSupported: boolean;

    constructor(cookies: Cookies) {
        this.cookies = cookies;
        this.detectWebSupport();

    }

    detectWebSupport() {
        this.webpSupported = this.cookies.get('WEBP-SUPPORTED');
        if (this.webpSupported == null) {
            supportsWebp().then(result => {
                this.webpSupported  = result;
                this.cookies.put('WEBP-SUPPORTED', result)
            })
        }
    }

}
