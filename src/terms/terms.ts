import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, singleton } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';

@autoinject
@singleton()
export class Terms {
    filter = "";
    term_list = [];
    api;
    user;
    theme;
    i18n;
    router;
    scroll_area;
    scroll_top = 0;
    video_list = [];

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.router = router;
    }

    activate(params, config) {
        if (this.term_list.length > 0) return;
        this.api.call_server('members/get_term_list', {})
            .then(result => {
                this.term_list = result.term_list;
                //this.scroll_top = 0;
            });
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "terms.terms-lexicon";
        this.scroll_area.scrollTop = this.scroll_top;
        /*setTimeout(()=>{
            this.scroll_area.scrollTop = this.scroll_top;
        }, 1000)*/
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    jump_to_the_full_story(event, term) {
        this.scroll_top = this.scroll_area.scrollTop;
        if (event.target.classList.contains('is-link')) return true;
        this.router.navigateToRoute('term-detail', { id: term.story_id, what: 'term' });
    }

    handle_event(term, event) {
        if (event.detail.action == 'delete') {
            let idx = this.term_list.findIndex(trm=>trm.id==term.id);
            this.term_list.splice(idx, 1);
            this.api.call_server('members/delete_term', {term_id: term.id});
        }
    }

}
