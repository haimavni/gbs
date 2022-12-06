/* eslint-disable no-global-assign */
import { IMemberGateway } from "../services/gateway";
import { IPopup } from "../services/popups";
import { IEventAggregator } from "aurelia";
import { IRouter } from "@aurelia/router";
import { IUser } from "../services/user";
import { ICookies } from "../services/cookies";
import { IMisc } from "../services/misc";
import { ITheme } from "../services/theme";
import { IShowPhoto } from "../services/show-photo";
import { IMemberList } from "../services/member_list";
import { I18N } from "@aurelia/i18n";

export class Home {
    photo_list;
    video_list = [];
    member_of_the_day = { gender: "", name: "" };
    member_prefix;
    was_born_in;
    died_in;
    stories_sample;
    message_list;
    subscriber1;
    scroll_area;
    active_part = 3;
    photo_strip_height = 220;

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @IRouter readonly router: IRouter,
        @IUser readonly user: IUser,
        @ICookies readonly cookies: ICookies,
        @ITheme readonly theme: ITheme,
        @I18N readonly i18n: I18N,
        @IMemberList readonly memberList: IMemberList,
        @IShowPhoto readonly show_photo: IShowPhoto,
        @IPopup readonly popup: IPopup,
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @IMisc readonly misc: IMisc
    ) {
        const x = this.cookies.get("SLIDESHOW-TOPICS");
        const slideshow_topics = JSON.parse(x);
        this.photo_list = this.api.call_server_post("photos/get_photo_list", {
            selected_recognition: "recognized",
            selected_topics: slideshow_topics,
            no_slide_show: true,
        });
        this.api
            .call_server_post("members/get_stories_sample")
            .then((result) => (this.stories_sample = result.stories_sample));
        memberList.getMemberList(); //to load in the background
        this.api.call_server_post("members/get_message_list").then((result) => {
            this.message_list = result.message_list;
        });
        this.api
            .call_server_post("videos/get_video_sample")
            .then((response) => this.set_video_list(response.video_list));
        this.show_photo = show_photo;
        this.popup = popup;
        this.eventAggregator = eventAggregator;
    }

    set_video_list(video_list) {
        this.video_list = video_list.map((v) => this.video_data(v));
    }

    video_data(v) {
        return {
            src: this.thumbnail(v.src),
            video_id: v.video_id,
            name: v.name,
        };
    }

    add_message() {
        const name = this.i18n.tr("home.new-message");
        this.message_list.splice(0, 0, {
            story_id: null,
            name: name,
            used_for: this.api.constants.story_type.STORY4MESSAGE,
            story_text: "",
            preview: "",
        });
    }

    push_story(story, customEvent) {
        event = customEvent.detail;
        this.api
            .call_server_post("members/push_message_up", {
                story_id: story.story_id,
            })
            .then((response) => {
                const idx = this.message_list.findIndex(
                    (item) => item.story_id == story.story_id
                );
                const msgs = this.message_list.slice(idx, idx + 1);
                this.message_list.splice(idx, 1);
                this.message_list.splice(0, 0, msgs[0]);
                this.scroll_area.scrollTop = 0;
            });
    }

    pin_story(story, customEvent) {
        event = customEvent.detail;
        this.api
            .call_server_post("members/pin_message", {
                story_id: story.story_id,
            })
            .then((response) => {
                const idx = this.message_list.findIndex(
                    (item) => item.story_id == story.story_id
                );
                if (response.pinned) {
                    const msgs = this.message_list.slice(idx, idx + 1);
                    this.message_list.splice(idx, 1);
                    msgs[0].pinned = true;
                    this.message_list.splice(0, 0, msgs[0]);
                    this.scroll_area.scrollTop = 0;
                } else {
                    this.message_list[idx].pinned = false;
                }
            });
    }

    hande_story_change(story, customEvent) {
        event = customEvent.detail;
        if (story.deleted) {
            this.api
                .call_server_post("members/delete_story", {
                    story_id: story.story_id,
                })
                .then((response) => {
                    const idx = this.message_list.findIndex(
                        (item) => item.story_id == story.story_id
                    );
                    this.message_list.splice(idx, 1);
                });
        }
    }

    attached() {
        this.api
            .call_server_post("members/get_random_member")
            .then((result) => {
                this.member_of_the_day = result.member_data;
                if (!this.member_of_the_day) return;
                this.member_prefix =
                    this.member_of_the_day.gender == "F"
                        ? "home.female-member-of-the-day"
                        : "home.male-member-of-the-day";
                this.was_born_in =
                    this.member_of_the_day.gender == "F"
                        ? "home.female-was-born-in"
                        : "home.male-was-born-in";
                this.died_in =
                    this.member_of_the_day.gender == "F"
                        ? "home.female-died-in"
                        : "home.male-died-in";
            });
        this.subscriber1 = this.eventAggregator.subscribe(
            "Zoom1",
            (payload: any) => {
                const photo_ids = payload.slide_list.map(
                    (photo) => photo.photo_id
                );
                this.show_photo.show(payload.slide, payload.event, photo_ids);
            }
        );
        this.photo_strip_height = Math.round(this.theme.height / 5);
    }

    get member_of_the_day_life_cycle_text() {
        return this.misc.calc_life_cycle_text(this.member_of_the_day);
    }

    detached() {
        this.subscriber1.dispose();
    }

    jump_to_member_of_the_day_page(member_id) {
        this.router.load(`/member-details/${member_id}`);
    }

    goto_full_collection() {
        this.router.load("/stories");
    }

    jump_to_the_full_story(story) {
        this.router.load(`/story-detail/${story.story_id}/story`);
    }

    on_height_change(event) {
        event.stopPropagation();
        const { new_height } = event.detail;
    }

    get panel_height() {
        return this.theme.height - this.photo_strip_height - 205;
    }

    drag_end_panel(customEvent) {
        if (this.theme.is_desktop) return;
        const event = customEvent.detail;
        const dx = event.dx;
        const dy = event.dy;
        if (Math.abs(dy * 5) >= Math.abs(dx)) return true;
        if (dx < -30 && this.active_part < 3) {
            this.active_part += 1;
        } else if (dx > 30 && this.active_part > 1) {
            this.active_part -= 1;
        }
    }

    thumbnail(video_src) {
        return `https://i.ytimg.com/vi/${video_src}/mq2.jpg`;
    }

    jump_to_video(video) {
        this.router.load(`/annotate-video/${video.video_id}`);
    }
}
