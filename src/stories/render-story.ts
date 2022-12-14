import { customElement } from 'aurelia';
import { Popup } from '../services/popups';

@customElement({
    name: 'render-story',
    template: ''
})
export class RenderStory {
    html;
    popup;

    constructor(popup: Popup) {
        this.popup = popup;
    }

    loading(params) {
        let html = params.html;
        if (!params.raw) {
            const pat_str = '(<a .*?)href="(.*?)"(.*?)>(.*?)</a>';
            const pat = new RegExp(pat_str, 'gi');
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
        const w = window.outerWidth - 200;
        const h = window.outerHeight - 200;
        const params = "height=" + h + ",width=" + w + ",left=100,top=100";
        this.popup.popup(name, url, params);
    }

}
