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
        let webpSupported = this.cookies.get('WEBP-SUPPORTED');
        if (webpSupported != 'YES' && webpSupported != 'NO') {
            supportsWebp().then(result => {
                this.webpSupported  = result;
                let s = result ? 'YES' : 'NO';
                this.cookies.put('WEBP-SUPPORTED', s)
            })
        } else {
            this.webpSupported = webpSupported == 'YES';
        }
    }

}
