import { autoinject, singleton, computedFrom } from "aurelia-framework";
import { DialogService } from "aurelia-dialog";
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { Query } from "../services/query/query";
import { EventAggregator } from "aurelia-event-aggregator";
import { MemberList } from "../services/member_list";
import { ArticleList } from "../services/article_list";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { MemberGateway } from "../services/gateway";
import { QState, Question } from "../resources/elements/quiz/quiz-model";
import * as toastr from "toastr";

@autoinject()
@singleton()
export class Members {
    filter = "";
    user;
    api;
    i18n;
    router;
    eventAggregator;
    _members = [];
    memberList;
    articleList;
    articles_exist = false;
    selectedId;
    faces_per_line = 8;
    win_width;
    theme;
    sorting_options;
    selected_members = new Set([]);
    order = "";
    member_group_list;
    caller_id;
    caller_type;
    relatives_mode = false;
    relative_list;
    relatives_path;
    origin_member_id;
    other_member_id;
    only_unapproved = "";
    approval_options;
    scroll_area;
    scroll_top = 0;
    questions: Question[] = [];
    checked_answers = [];
    nota_questions = [];
    qualified_members = null;
    to_clear_now = false;
    quiz_help_data;
    old_editing_mode = false;
    anchor = -1; //for multiple selections
    agent = { size: 9999 };
    dialog: DialogService;

    constructor(
        user: User,
        api: MemberGateway,
        eventAggregator: EventAggregator,
        memberList: MemberList,
        articleList: ArticleList,
        theme: Theme,
        i18n: I18N,
        router: Router,
        dialog: DialogService
    ) {
        this.user = user;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.memberList = memberList;
        this.articleList = articleList;
        this._members = [];
        this.eventAggregator.subscribe("EditModeChange", (payload) => {
            this.user = payload;
        });
        this.dialog = dialog;
        this.eventAggregator.subscribe("NewMemberAdded", (member_details) => {
            this.member_added(member_details);
        });
        this.sorting_options = [
            {
                value: "selected;-has_profile_photo",
                name: this.i18n.tr("members.random-order"),
            },
            {
                value: "selected;last_name;first_name",
                name: this.i18n.tr("members.by-last-name"),
            },
            {
                value: "selected;first_name;last_name;first_name",
                name: this.i18n.tr("members.by-first-name"),
            },
            {
                value: "selected;-birth_date",
                name: this.i18n.tr("members.by-age-young-first"),
            },
            {
                value: "selected;birth_date",
                name: this.i18n.tr("members.by-age-old-first"),
            },
            {
                value: "selected;-id",
                name: this.i18n.tr("members.newly-added"),
            },
        ];
        if (this.user.privileges.EDITOR) {
            this.sorting_options.push({
                value: "has_profile_photo",
                name: this.i18n.tr("members.profile-missing-first"),
            });
        }
        this.approval_options = [
            { value: "", name: this.i18n.tr("members.all-members") },
            { value: "x", name: this.i18n.tr("members.unapproved-only") },
        ];
        this.quiz_help_data = { items: this.i18n.tr("members.members") };
    }

    activate(params, routeConfig) {
        if (params.filter) {
            this.filter = params.filter;
        }
        return this.memberList.getMemberList().then((members) => {
            this._members = members.member_list;
            for (let member of this._members) {
                member.rand = Math.random() * 1000;
            }
            if (routeConfig.name == "associate-members") {
                this.caller_id = params.caller_id;
                this.caller_type = params.caller_type;
                let arr;
                if (params.associated_members) {
                    arr = params.associated_members.map((i) => Number(i));
                } else {
                    arr = [];
                }
                this.selected_members = new Set(arr);
                for (let member of this._members) {
                    if (this.selected_members.has(member.id)) {
                        member.selected = 1;
                    } else {
                        member.selected = 0;
                    }
                }
            }
            this.win_width = window.outerWidth;
            this.theme.display_header_background = true;
        });
    }

    attached() {
        this.articleList.getArticleList().then((articles) => {
            this.articles_exist = articles.article_list.length > 0;
        });
        this.theme.display_header_background = true;
        this.theme.page_title = this.caller_type
            ? "members." + this.caller_type
            : "members.members";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    member_added(member_details) {
        //todo: experiments
        this._members = this._members.splice(0, 0, {
            name: member_details.name,
            gender: member_details.gender,
            id: member_details.id,
        });
    }

    not_ready(member) {
        return member.visibility < 2 && !this.user.editing;
    }

    order_changed(event) {
        this.memberList.sort_member_list(this.order);
    }

    toggle_selection(member) {
        if (member.selected) {
            member.selected = 0;
            this.selected_members.delete(member.id);
        } else {
            this.selected_members.add(member.id);
            member.selected = 1;
        }
        if (this.relatives_mode) {
            let n = this.selected_members.size;
            if (n == 2) {
                this.other_member_id = member.id;
                this.get_relatives_path();
            } else if (n == 1 && member.selected == 0) {
                //we just unselected the other member
                this.relatives_path = null; // only one member is selected now
                if (member.id == this.origin_member_id) {
                    //other member becomes origin,
                    this.origin_member_id = member.id;
                    this.calc_relative_list();
                }
                this.other_member_id = null;
            } else {
                this.relatives_mode = false;
                this.relatives_path = null;
                this.relative_list = null;
            }
        }
    }

    clear_selection() {
        this.selected_members = new Set();
        for (let mem of this._members) {
            mem.selected = 0;
        }
    }

    get_relatives_path() {
        this.api
            .call_server_post("members/get_relatives_path", {
                origin_member_id: this.origin_member_id,
                other_member_id: this.other_member_id,
            })
            .then((response) => {
                this.build_relatives_path(response.relatives_path);
            });
    }

    calc_relative_list() {
        let lst = Array.from(this.selected_members);
        let member_id = lst[0];
        this.origin_member_id = member_id;
        this.api
            .call_server_post("members/get_all_relatives", {
                member_id: member_id,
            })
            .then((response) => {
                this.build_relative_list(response.relative_list);
                this.relatives_mode = true;
            });
    }

    toggle_relatives_mode() {
        if (this.relatives_mode) {
            this.relative_list = null;
            this.relatives_path = null;
            this.relatives_mode = false;
        } else {
            this.filter = "";
            this.calc_relative_list();
        }
    }

    private build_relative_list(lst) {
        let member_index = this.build_member_index();
        let relatives = [];
        let is_odd = false;
        for (let level of lst) {
            let cls = is_odd ? "odd-level" : "";
            for (let member_id of level) {
                let member = member_index[member_id];
                member.odd_level = cls;
                relatives.push(member_index[member_id]);
            }
            is_odd = !is_odd;
        }
        this.relative_list = relatives;
    }

    build_relatives_path(lst) {
        let member_index = this.build_member_index();
        let relatives_path = [];
        for (let mid of lst) {
            relatives_path.push(member_index[mid]);
        }
        this.relatives_path = relatives_path;
    }

    private build_member_index() {
        let result = {};
        for (let member of this._members) {
            result[member.id] = member;
        }
        return result;
    }

    member_clicked(member, event, index) {
        if (this.anchor < 0) this.anchor = index;
        if (event.ctrlKey) {
            this.toggle_selection(member);
        } else if (event.altKey) {
            this.clear_selection();
        } else if (event.shiftKey) {
            this.select_block(member, index);
        } else {
            event.stopPropagation();
            this.scroll_top = this.scroll_area.scrollTop;
            this.router.navigateToRoute("member-details", {
                id: member.id,
                keywords: "",
            });
        }
    }

    select_block(member, index) {
        this.toggle_selection(member);
        let checked = member.selected;
        let i0, i1;
        if (this.anchor < index) {
            i0 = this.anchor;
            i1 = index;
        } else {
            i0 = index;
            i1 = this.anchor;
        }
        for (let i = i0; i < i1; i++) {
            let mem = this._members[i];
            mem.selected = checked;
            if (checked) {
                this.selected_members.add(mem.id);
            } else {
                this.selected_members.delete(mem.id);
            }
        }
    }

    save_member_group(group_id) {
        let member_ids = Array.from(this.selected_members);
        let caller_type = this.caller_type;
        this.caller_type = "";
        this.api
            .call_server_post("members/save_group_members", {
                user_id: this.user.id,
                caller_id: this.caller_id,
                caller_type: caller_type,
                member_ids: member_ids,
            })
            .then((response) => {
                this.clear_member_group();
                if (caller_type == "story") {
                    this.router.navigateToRoute("story-detail", {
                        id: this.caller_id,
                        used_for: this.api.constants.story_type.STORY4EVENT,
                    });
                }
                if (caller_type == "term") {
                    this.router.navigateToRoute("term-detail", {
                        id: this.caller_id,
                        used_for: this.api.constants.story_type.STORY4TERM,
                    });
                }
            });
    }

    clear_member_group() {
        for (let member of this._members) {
            member.selected = 0;
        }
        this.selected_members = new Set();
    }

    @computedFrom("_members", "relative_list", "relatives_path", "order")
    get members() {
        if (this.relatives_path) {
            return { ignore: true, arr: this.relatives_path };
        }
        if (this.relative_list) {
            return this.relative_list;
        }
        if (
            this.order == "selected;birth_date" ||
            this.order == "selected;-birth_date"
        ) {
            return this._members.filter(
                (member) => member.birth_date != "0001-01-01"
            );
        }

        return this._members;
    }

    get topic_members() {
        if (this.caller_type == "story" || this.caller_type == "term") {
            return "select-members";
        } else {
            return "members";
        }
    }

    @computedFrom("user.editing", "selected_members.size")
    get q_state() {
        if (this.old_editing_mode != this.user.editing) {
            this.qualified_members = null;
            this.old_editing_mode = this.user.editing;
        }
        if (this.user.editing) {
            if (this.selected_members.size > 0) return QState.APPLYING;
            return QState.EDITING;
        } else {
            return QState.USING;
        }
    }

    alive(what) {}

    filter_gender(gender) {}

    get changes_pending() {
        if (
            this.q_state == QState.APPLYING &&
            this.checked_answers.length > 0 &&
            this.selected_members.size > 0
        ) {
            return true;
        }
        return false;
    }

    apply_changes() {
        let item_list = Array.from(this.selected_members);
        this.api.call_server_post("quiz/apply_answers", {
            item_list: item_list,
            checked_answers: this.checked_answers,
        });
        this.to_clear_now = true;
        for (let member of this.members) {
            member.selected = false;
        }
        this.selected_members = new Set();
    }

    questions_changed(event) {
        this.checked_answers = event.detail.checked_answers; //for some reason it is not synced with the element, unlike questions
        this.nota_questions = event.detail.nota_questions;
        if (this.q_state == QState.USING) {
            if (
                this.checked_answers.length == 0 &&
                this.nota_questions.length == 0
            ) {
                this.qualified_members = null;
                return;
            }
            this.api
                .call_server_post("members/qualified_members", {
                    checked_answers: this.checked_answers,
                    nota_questions: this.nota_questions,
                })
                .then((response) => {
                    this.qualified_members = new Set(
                        response.qualified_members
                    );
                });
        } else if (this.q_state == QState.APPLYING) {
        }
    }

    goto_articles() {
        this.router.navigateToRoute("articles");
    }

    @computedFrom("theme.width")
    get photo_size() {
        let size = 130;
        if (!this.theme.is_desktop) {
            size = 90;
            let ppl = Math.floor(this.theme.width / size);
            size = this.theme.width / ppl;
        }
        return size - 20;
    }

    @computedFrom("theme.height")
    get member_list_height() {
        if (this.theme.is_desktop) return this.theme.height - 320;
        return null;
    }

    get members_section_class() {
        if (this.theme.is_desktop) return "container content-area";
        return null;
    }

    check_duplicates() {
        this.api
            .call_server_post("members/check_duplicates")
            .then((response) => {
                let duplicates = response.duplicates;
                if (duplicates.length == 0)
                    toastr.success("No duplicates found");
                else {
                    toastr.warning(duplicates.length + " duplicates found!");
                    this.selected_members = new Set();
                    for (let itm of duplicates)
                        for (let mid of itm) {
                            this.selected_members.add(mid);
                        }
                    for (let member of this._members) {
                        if (this.selected_members.has(member.id))
                            member.selected = 1;
                        else member.selected = 0;
                    }
                    this.order = "selected;first_name;last_name;first_name";
                    this.memberList.sort_member_list(this.order);
                }
            });
    }

    open_query_editor() {
        console.log("dialog: ", this.dialog);
        this.dialog.open({ viewModel: Query, model: {}, lock: false });
    }

    @computedFrom("user.advanced")
    get max_members_displayed() {
        if (this.user.advanced) return 10000;
        return 4000;
    }

    @computedFrom("user.editing", "articles_exist")
    get show_objects_button() {
        let b =
            this.user.config.enable_articles &&
            this.theme.is_desktop &&
            this.articles_exist &&
            !this.user.editing;
        b &&= !this.user.config.articles_in_menu;
        return b;
    }
}
