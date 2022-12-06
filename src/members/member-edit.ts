import { IDialogService } from "@aurelia/runtime-html";
import { IRouter } from "@aurelia/router";
import { I18N } from "@aurelia/i18n";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { IMisc } from "../services/misc";
import { MemberPicker } from "./member-picker";
import { IMemberList } from "../services/member_list";
import { ICustomElementViewModel, IEventAggregator } from "aurelia";

export class MemberEdit implements ICustomElementViewModel {
    member;
    members;
    member_info_orig;
    life_story_orig;
    update_info = "";
    date_of_birth_valid = "";
    date_of_death_valid = "";
    check_before_saving = false;

    constructor(
        @IUser private user: IUser,
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @IMemberGateway readonly api: IMemberGateway,
        @IRouter readonly router: IRouter,
        @I18N readonly i18n: I18N,
        @IDialogService readonly dialog: IDialogService,
        @IMemberList readonly memberList: IMemberList,
        @IMisc readonly misc: IMisc
    ) {

        this.eventAggregator.subscribe("EditModeChange", (payload: any) => {
            this.user = payload;
        });

        this.eventAggregator.subscribe("EditorContentChanged", () => {
            this.handle_editor_changed();
        });
        
        this.dialog = dialog;
        this.memberList = memberList;
        this.memberList.getMemberList().then((members) => {
            this.members = members;
        });
    }

    activate(model) {
        this.member = model.member;
        const m = this.member.member_info;
        this.member_info_orig = this.misc.deepClone(m);
        if (this.user.privileges.DATA_AUDITOR) m.approved = true;
        this.life_story_orig = this.member.story_info.story_text.slice();
        if (this.user.privileges.DATA_AUDITOR && m.updater_id) {
            const s = " " + this.i18n.tr("members.updated-on-date") + " ";
            this.update_info = m.updater_name + s + m.update_time;
        } else {
            this.update_info = "";
        }
    }

    get dirty_info() {
        const dirty =
            JSON.stringify(this.member.member_info) !=
            JSON.stringify(this.member_info_orig);
        this.eventAggregator.publish("DirtyInfo", dirty);
        return dirty;
    }

    prev_member() {
        this.handle_member(this.member.member_info.id, "prev");
    }

    next_member() {
        this.handle_member(this.member.member_info.id, "next");
    }

    handle_member(member_id, direction) {
        if (this.dirty_info) return;
        const dif = direction == "next" ? +1 : -1;
        let member_idx = this.members.member_list.findIndex(
            (mem) => mem.id == member_id
        );
        const n = this.members.member_list.length;
        member_idx = (member_idx + n + dif) % n;
        member_id = this.members.member_list[member_idx].id;
        this.router.load(`/member-details/${member_id}`);
    }

    cancel_edit_mode() {
        this.member.member_info = this.misc.deepClone(this.member_info_orig);
    }

    save_edited_data() {
        const data = { user_id: this.user.id };
        if (this.check_before_saving && !this.dirty_info) {
            this.check_before_saving = false;
            return;
        }
        if (this.dirty_info) {
            this.member.member_info.last_name =
                this.member.member_info.last_name.trim();
            this.member.member_info.first_name =
                this.member.member_info.first_name.trim();
            data["member_info"] = this.member.member_info;
        } else {
            data["member_id"] = this.member.member_info.id;
        }
        const id = this.member.member_info.id;
        this.api
            .call_server_post("members/save_member_info", data)
            .then((response) => {
                this.member_info_orig = this.misc.deepClone(
                    this.member.member_info
                );

                this.life_story_orig = this.member.story_info.story_text;
                this.member = this.misc.deepClone(this.member);
            });
    }

    toggle_gender() {
        if (this.member.member_info.gender == "F") {
            this.member.member_info.gender = "M";
        } else if (this.member.member_info.gender == "M") {
            this.member.member_info.gender = "F";
        } else {
            this.member.member_info.gender = "F";
        }
    }

    trim_first_name() {
        const old = this.member.member_info.first_name;
        this.member.member_info.first_name =
            this.member.member_info.first_name.trim();
        if (old != this.member.member_info.first_name)
            this.check_before_saving = true;
    }

    trim_last_name() {
        const old = this.member.member_info.last_name;
        this.member.member_info.last_name =
            this.member.member_info.last_name.trim();
        if (old != this.member.member_info.last_name)
            this.check_before_saving = true;
    }

    handle_editor_changed() {
        alert("editor content changed");
    }

    find_father(event) {
        if (event.ctrlKey) return this.remove_parent("pa");
        this.dialog
            .open({
                component: () => MemberPicker,
                model: {
                    gender: "M",
                    child_name: this.member.member_info.full_name,
                    child_id: this.member.member_info.id,
                },
                lock: false,
                position: this.setup,
                rejectOnCancel: true,
            })
            .whenClosed((response: any) => {
                this.member.member_info.father_id = response.output.member_id;
                if (response.output.new_member) {
                    const new_member = {
                        gender: "M",
                        id: this.member.member_info.father_id,
                        name: response.output.new_member.name,
                        facePhotoURL: response.output.new_member.face_url,
                    };
                    this.memberList.add_member(new_member);
                }
                const father = this.get_member_data(
                    this.member.member_info.father_id
                );
                this.eventAggregator.publish("ParentFound", father);
            });
    }

    find_mother(event) {
        if (event.ctrlKey) return this.remove_parent("ma");
        this.dialog
            .open({
                component: () => MemberPicker,
                model: {
                    gender: "F",
                    child_name: this.member.member_info.full_name,
                    child_id: this.member.member_info.id,
                },
                lock: false,
                position: this.setup,
                rejectOnCancel: true,
            })
            .whenClosed((response: any) => {
                this.member.member_info.mother_id = response.output.member_id;
                if (response.output.new_member) {
                    const new_member = {
                        gender: "F",
                        id: this.member.member_info.mother_id,
                        name: response.output.new_member.name,
                        facePhotoURL: response.output.new_member.face_url,
                    };
                    this.memberList.add_member(new_member);
                }
                const mother = this.get_member_data(
                    this.member.member_info.mother_id
                );
                this.eventAggregator.publish("ParentFound", mother);
            });
    }

    remove_parent(who) {
        this.member.family_connections.parents[who] = null;
        this.api.call_server_post("members/remove_parent", {
            member_id: this.member.member_info.id,
            who: who,
        });
    }

    get_member_data(member_id) {
        const candidates = this.memberList.members.member_list.filter(
            (member) => member.id == member_id
        );
        if (candidates) {
            return candidates[0];
        } else {
            return {};
        }
    }

    get incomplete() {
        if (!this.member.member_info.visibility) return "";
        if (
            this.date_of_birth_valid != "valid" ||
            this.date_of_death_valid != "valid" ||
            (this.member.member_info.gender != "F" &&
                this.member.member_info.gender != "M") ||
            !this.member.member_info.first_name
        )
            return "disabled";
        return "";
    }

    setup(modalContainer: Element, modalOverlay: Element) {}
}
