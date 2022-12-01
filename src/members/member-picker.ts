import { IDialogController } from "@aurelia/runtime-html";
import { IEventAggregator } from "aurelia";
import { IUser } from "../services/user";
import { IMemberList } from "../services/member_list";
import { IRouter, IRouteableComponent } from "@aurelia/router";
import { IMemberGateway } from "../services/gateway";
import { I18N } from "@aurelia/i18n";

export class MemberPicker implements IRouteableComponent {
    filter = "";
    gender = "";
    face_identifier = false;
    face;
    members = [];
    selectedId;
    make_profile_photo = false;
    candidates = [];
    excluded = new Set();
    child_name;
    child_id;
    member_id;
    agent = { size: 9999 };
    back_to_text;
    help_topic;
    multi = false;
    selected_member_ids = new Set();
    was_empty = true;
    excluded_names = new Set();

    constructor(
        @IUser private user: IUser,
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @IMemberList readonly memberList: IMemberList,
        @IDialogController readonly dialogController: IDialogController,
        @IRouter readonly router: IRouter,
        @IMemberGateway readonly api: IMemberGateway,
        @I18N readonly i18n: I18N
    ) {
        this.members = [];

        this.eventAggregator.subscribe("EditModeChange", (payload: any) => {
            this.user = payload;
        });
    }

    prepare_lists() {
        return this.memberList.getMemberList().then((members) => {
            //let parents = members.member_list.slice();
            let parents = this.memberList.get_members().slice();
            if (this.gender) {
                parents = parents.filter(
                    (member) => member.gender == this.gender
                );
            }
            this.members = parents;
            if (this.candidates) {
                this.reorder_members_candidates_first();
            }
            this.members = this.members.filter(
                (member) =>
                    member.id == this.member_id || !this.excluded.has(member.id)
            );
        });
    }

    async loading(model) {
        this.candidates = model.candidates ? model.candidates : [];
        this.child_id = model.child_id;
        this.gender = model.gender;
        this.child_name = model.child_name; //the child for whom we select parent
        this.face_identifier = model.face_identifier;
        this.face = model.current_face;
        this.excluded = model.excluded ? model.excluded : new Set();
        this.member_id = model.member_id;
        this.help_topic = model.help_topic;
        await this.prepare_lists();
        this.multi = model.multi;
        this.filter = "";
        this.back_to_text = model.back_to_text || "members.back-to-photos";
        for (const member of this.members) {
            member.selected = "";
        }
        if (model.preselected) {
            console.log("model.preselected: ", model.preselected);
            for (const member_id of model.preselected) {
                this.was_empty = false;
                this.selected_member_ids.add(member_id);
                const member = this.members.find((mem) => mem.id == member_id);
                member.selected = "selected";
                console.log("member: ", member);
            }
            this.members.sort((a, b) =>
                a.selected ? -1 : b.selected ? +1 : 0
            );
        }
        if (model.member_id > 0) {
            this.memberList.get_member_by_id(model.member_id).then((result) => {
                this.filter = result.first_name + " " + result.last_name;
            });
        }
        const ex_list = Array.from(this.excluded);
        for (const member_id of ex_list) {
            this.memberList.get_member_by_id(member_id).then((member) => {
                const name = member.first_name + " " + member.last_name;
                this.excluded_names.add(name);
            });
        }
    }

    reorder_members_candidates_first() {
        const cand_ids = this.candidates.map((cand) => cand.member_id);
        const cand_set = new Set(cand_ids);
        for (const m of this.members) {
            m.score = cand_set.has(m.id) ? 0 : 1;
        }
        this.members.sort((a, b) => a.score - b.score);
    }

    select(member) {
        if (this.multi) {
            if (this.selected_member_ids.has(member.id)) {
                this.selected_member_ids.delete(member.id);
                member.selected = "";
            } else {
                this.selected_member_ids.add(member.id);
                member.selected = "selected";
            }
        } else {
            this.memberList.add_recent(member);
            this.dialogController.ok({
                member_id: member.id,
                make_profile_photo: this.make_profile_photo,
            });
        }
    }

    save() {
        const member_ids = Array.from(this.selected_member_ids);
        this.selected_member_ids = new Set();
        for (const member of this.members) {
            member.selected = "";
        }
        this.dialogController.ok({ member_ids: member_ids });
    }

    async create_new_member() {
        let member_ids = [];
        await this.api
            .call_server("members/member_by_name", { name: this.filter.trim() })
            .then((response) => {
                member_ids = response.member_ids;
            });
        if (this.gender) {
            const parent_of =
                this.gender == "M"
                    ? this.i18n.tr("members.pa-of")
                    : this.i18n.tr("members.ma-of");
            this.api
                .call_server("members/create_parent", {
                    gender: this.gender,
                    child_name: this.child_name,
                    child_id: this.child_id,
                    parent_of: parent_of,
                })
                .then((response) => {
                    this.dialogController.ok({
                        member_id: response.member_id,
                        new_member: response.member,
                    });
                });
        } else {
            for (const member_id of member_ids) {
                if (this.excluded.has(member_id)) {
                    const msg =
                        this.filter +
                        this.i18n.tr("members.already-identified");
                    alert(msg);
                    return;
                }
            }
            const default_name = this.i18n.tr("members.default-name");
            this.api
                .call_server("members/create_new_member", {
                    photo_id: this.face.photo_id,
                    face_x: this.face.x,
                    face_y: this.face.y,
                    face_r: this.face.r,
                    name: this.filter,
                    default_name: default_name,
                })
                .then((response) => {
                    this.dialogController.ok({
                        member_id: response.member_id,
                        new_member: response.member,
                    });
                });
        }
    }

    get place_holder() {
        let key = "members.filter";
        if (this.user.editing) key += "-can-add";
        return this.i18n.tr(key);
    }

    get is_excluded() {
        if (this.excluded_names.has(this.filter)) return true;
        return false;
    }
}
