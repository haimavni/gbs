import { IPopup } from '../services/popups';

export class RenderStory {
    html;

    constructor(@IPopup private readonly popup: IPopup) {

    }

    activate(params) {
        let html = params.html;
        if (!params.raw) {
            let pat_str = '(<a .*?)href=\"(.*?)\"(.*?)>(.*?)</a>';
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

}
