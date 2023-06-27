import { I18N } from "@aurelia/i18n";
import { IRouter } from "@aurelia/router";
import { ITheme } from "../services/theme";
import { IMemberGateway } from "../services/gateway";

export class HitCounts {
    total_count;
    itemized_counts;
    what_options;
    what_option = "MEMBER";
    order_options;
    order_option = "NEW";
    items = [];
    pageSize = 15;

    constructor(
        @ITheme private readonly theme: ITheme,
        @IRouter private readonly router: IRouter,
        @IMemberGateway private readonly api: IMemberGateway,
        @I18N private readonly i18n: I18N
    ) {
        this.what_options = [
            { value: "MEMBER", name: this.i18n.tr("members.members") },
            { value: "PHOTO", name: this.i18n.tr("photos.photos") },
            { value: "EVENT", name: this.i18n.tr("stories.stories") },
            { value: "TERM", name: this.i18n.tr("terms.terms") },
        ];
        this.order_options = [
            { value: "NEW", name: this.i18n.tr("by-new-count") },
            { value: "OLD", name: this.i18n.tr("by-old-count") },
        ];
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.theme.page_title = "user.number-of-hits";
        this.get_statistics();
    }

    get_statistics() {
        this.api
            .call_server("hits/get_hit_statistics", {
                order: this.order_option,
            })
            .then((response) => {
                this.total_count = response.total_count;
                this.itemized_counts = response.itemized_counts;
                this.items = this.itemized_counts[this.what_option];
            });
    }

    change_what(event) {
        if (!this.itemized_counts) return [];
        this.items = this.itemized_counts[this.what_option];
    }

    change_order_option() {
        this.get_statistics();
    }
}
