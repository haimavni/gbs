import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, computedFrom, singleton } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { Misc } from '../services/misc';
import { Videos } from '../videos/videos';
import { MemberList } from '../services/member_list';

@autoinject
@singleton()
export class Memorial {
    filter = "";
    api;
    user;
    theme;
    router;
    win_width;
    win_height;
    scroll_area;
    scroll_top = 0;
    i18n;
    num_of_stories = 0;
    no_results = false;
    highlight_unselectors = "";
    misc: Misc;
    memberList: MemberList;
    members = [];
    order_option = {value: 'alfabetic'};
    order_options;

    constructor(api: MemberGateway, user: User, i18n: I18N, router: Router, videos: Videos,
        memberList: MemberList, theme: Theme, misc: Misc) {
        this.api = api;
        this.user = user;
        this.misc = misc;
        this.theme = theme;
        this.i18n = i18n;
        this.router = router;
        this.memberList = memberList;
        this.order_options = [
            { name: i18n.tr('members.alfabetic-order'), value: 'alfabetic' },
            { name: i18n.tr('members.earliest-first'), value: 'earliest-first' },
            { name: i18n.tr('members.latest-first'), value: 'latest-first' },
            { name: i18n.tr('members.nearest-yarzeit'), value: 'nearest-yarzeit' }
        ];
    }


    activate() {
        this.api.call_server_post("members/get_deceased_members").then(response => {
            this.members = response.members;
            this.handle_order_change();
        })
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.theme.page_title = "members.memorial";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    member_clicked(member, event, index) {
        event.stopPropagation();
        this.scroll_top = this.scroll_area.scrollTop;
        this.router.navigateToRoute('member-details', { id: member.id, keywords: "" });
    }

    handle_order_change() {
        switch(this.order_option.value) {
            case "alfabetic": 
                this.members.sort((mem1, mem2) => 
                    mem1.last_name < mem2.last_name ? -1 : 
                    mem1.last_name > mem2.last_name ? +1 : 
                    mem1.death_day_since_epoch - mem2.death_day_since_epoch);
                break;
            case "earliest-first":
                this.members.sort((mem1, mem2) => 
                    mem1.death_day_since_epoch - mem2.death_day_since_epoch);
                break;
            case "latest-first":
                this.members.sort((mem1, mem2) => 
                    mem2.death_day_since_epoch - mem1.death_day_since_epoch);
                break;
            case "nearest-yarzeit":
                this.members.sort((mem1, mem2) => 
                    mem1.death_day_of_year_relative - mem2.death_day_of_year_relative);
                break;
        }
    }

    @computedFrom('theme.height')
    get panel_height() {
        return this.theme.height - 350;
    }

    scroll(h) {
        let div = document.getElementById('story-filters');
        div.scrollTop = h;
    }


}
