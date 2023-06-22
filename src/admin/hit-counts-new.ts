import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from "../services/theme";
import { MemberGateway } from "../services/gateway";

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

    constructor(theme: Theme, router: Router, api: MemberGateway, i18n: I18N) {
        this.theme = theme;
        this.router = router;
        this.api = api;
        this.i18n = i18n;
        this.what_options = [
            { value: "APP", name: this.i18n.tr("hits.app")},
            { value: "MEMBER", name: this.i18n.tr("members.members") },
            { value: "PHOTO", name: this.i18n.tr("photos.photos") },
            { value: "EVENT", name: this.i18n.tr("stories.stories") },
            { value: "TERM", name: this.i18n.tr("terms.terms") },
            { value: "DOC", name: this.i18n.tr("docs.docs")},
            { value: "DOCSEG", name: this.i18n.tr("docs.docsegs")},
            { value: "VIDEO", name: this.i18n.tr("videos.videos")}
        ];
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
                this.itemized_counts = response;
                console.log("itemized counts: ", this.itemized_counts);
                this.starter = 'starter';
                
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

}
