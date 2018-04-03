import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';

@autoinject
export class Terms {
    filter = "";
    term_list = [];
    api;
    user;
    theme;
    i18n;
    //for development. remove soon.
    test_date = "";
    test_span = 3;
    router;

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.router = router;
    }

    created(params, config) {
        this.api.call_server('members/get_term_list', {})
            .then(result => {
                this.term_list = result.term_list;
            });
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "terms.terms-lexicon";
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    jump_to_the_full_story(term) {
        this.router.navigateToRoute('term-detail', { id: term.story_id, what: 'story' });
    }

}
