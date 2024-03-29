import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from "../services/theme";
import { MemberGateway } from "../services/gateway";
import {Popup} from '../services/popups';

@autoinject()
export class HitCountsNew {
    theme;
    api;
    router;
    i18n;
    total_count;
    itemized_counts;
    what_options;
    what_option = "MEMBER";
    items = [];
    pageSize = 15;
    whats = ["APP", "MEMBER", "PHOTO", "EVENT", "TERM", "DOC", "VIDEO"];
    periods = [0, 30, 7, 1];
    curr_what = null;
    curr_period = 0;
    curr_what_prev = null;
    starter = null;
    popup: Popup;
    hit_map;

    constructor(theme: Theme, router: Router, api: MemberGateway, i18n: I18N, popup: Popup) {
        this.theme = theme;
        this.router = router;
        this.api = api;
        this.i18n = i18n;
        this.popup = popup;
        this.what_options = [];
        this.hit_map = {
            "APP": this.i18n.tr("hits.app"),
            "MEMBER": this.i18n.tr("members.members"),
            "ARTICLE": this.i18n.tr("articles.articles"),
            "PHOTO": this.i18n.tr("photos.photos"),
            "EVENT": this.i18n.tr("stories.stories"),
            "TERM": this.i18n.tr("terms.terms"),
            "DOC": this.i18n.tr("docs.docs"),
            "DOCSEG": this.i18n.tr("docs.docsegs"),
            "VIDEO": this.i18n.tr("videos.videos")
        }
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.theme.page_title = "user.number-of-hits";
    }

    async bind() {
        console.log("bind called")
        await this.get_statistics();
        this.curr_what = "APP"
        console.log("after get statistics?");
        this.change_what(null);
    }

    get_statistics() {
        console.log("get statistics");
        return this.api
            .call_server("hits/get_hit_statistics", {})
            .then((response) => {
                console.log("hits response is ", response);
                this.itemized_counts = response.result;
                console.log("itemized counts: ", this.itemized_counts);
                this.starter = 'starter';
                const hit_kinds = response.hit_kinds;
                // this.what_options = hit_kinds.map(what => {value: what, name: this.hit_map[what]})
                this.what_options = [];
                for (let what of hit_kinds) {
                    const obj = {value: what, name: this.hit_map[what]}
                    this.what_options.push(obj)
                }
            });
    }

    change_what(event) {
        if (!this.itemized_counts) return [];
        this.calc_count_list();
    }

    period_name(period) {
        let key;
        switch(period) {
            case 0: 
                key = "hits.all-time";
                break;
            case 30:
                key = 'hits.last-month';
                break;
            case 7:
                key = 'hits.last-week';
                break;
            case 1:
                key = 'hits.yesterday';
                break;
        }
        return this.i18n.tr(key)
    }

    @computedFrom('curr_what', 'starter')
    get curr_totals() {
        console.log("curr what / prev: ", this.curr_what, this.curr_what_prev);
        //if (this.curr_what == this.curr_what_prev) return;
        this.curr_what_prev = this.curr_what;
        console.log("entered curr totals. this.itemized_counts ", this.itemized_counts);
        if (! this.itemized_counts) return 0;
        console.log("this.itemized_counts[this.curr_what].totals ", this.itemized_counts[this.curr_what].totals)
        return this.itemized_counts[this.curr_what].totals
    }

    detailed_of_periods(period) {
        this.curr_period = period;
        this.calc_count_list();
    }

    calc_count_list() {
        console.log("detailed: ", this.itemized_counts[this.curr_what].detailed)
        this.items = this.itemized_counts[this.curr_what].detailed[this.curr_period]
    }

    popup_page(url) {
        this.popup.popup('HITPAGE', url, "height=860,width=1700,left=100,top=100")
    }

}
