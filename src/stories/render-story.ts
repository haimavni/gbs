import { autoinject, noView, bindable, InlineViewStrategy } from 'aurelia-framework';
import { Popup } from '../services/popups';

@noView
@autoinject
export class RenderStory {
    html;
    popup;

    constructor(popup: Popup) {
        this.popup = popup;
    }

    activate(params) {
        let html = params.html;
        if (!params.raw) {
            let pat_str = '(<a .*?)href="(.*?)"(.*?)>(.*?)</a>';
            let pat = new RegExp(pat_str, 'gi');
            html = html.replace(/\n/g, '');
            html = html.replace(pat, function (m, m1, m2, m3, m4) {
                if (m4 == "המשך" || m4 == "Link") return m;
                return m1 + " click.trigger=\"popup_window('POPUP', '" + m2 + "')\"" + m3 + '>' + m4 + "</a>"
            });
        }
        //apply modifications here
        this.html = '<template>' + html + '</template>';
    }

    popup_window(name, url) {
        let w = window.outerWidth - 200;
        let h = window.outerHeight - 200;
        let params = "height=" + h + ",width=" + w + ",left=100,top=100";
        this.popup.popup(name, url, params);
    }

    getViewStrategy() {
        return new InlineViewStrategy(this.html);
    }

}
