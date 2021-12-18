
import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';

@autoinject()
export class ConfigMemberStories {
    member_stories = {lst: [], changed: 0};
    all_member_stories = [];
    filter = '';
    dialogController;
    story_types = new Set();
    orig_story_types = new Set();
    is_multi_type = false;
    story_type_arr = [];
    active_story_types = {};
    toggled = 0;
    active_types = {};

    constructor(dialogController: DialogController) {
        this.dialogController = dialogController;
    }

    activate(model) {
        this.member_stories = model.member_stories;
        this.all_member_stories = model.all_member_stories;
        this.story_types = this.get_story_types();
        this.story_type_arr = Array.from(this.story_types)
        for (let t of this.story_type_arr) {
            this.orig_story_types.add(t);
        }
        this.is_multi_type = this.story_types.size > 1;
    }

    @computedFrom('filter')
    get filter_changed() {
        this.update_story_list();
        return false;
    }

    save() {
        this.dialogController.ok({lst: this.member_stories.lst});
    }

    get_story_types() {
        let result = new Set();
        for (let st of this.all_member_stories) {
            if (st.used_for != 1)
                result.add(st.used_for)
        }
        return result
    }

    toggle(styp) {
        if (this.story_types.has(styp)) {
            this.story_types.delete(styp)
        } else {
            this.story_types.add(styp)
        }
        this.update_story_list();
    }

    update_story_list() {
        this.member_stories.lst = this.all_member_stories.filter(item => this.story_types.has(item.used_for) || item.used_for == 1);
        if (this.filter) {
            this.member_stories.lst = this.member_stories.lst.filter(item => 
                item.name.includes(this.filter) || item.used_for==1 || item.story_text.includes(this.filter));
        }
        this.member_stories.changed = 1;
        this.active_story_types = {};
        let arr = Array.from(this.story_types);
        for (let a of arr) {
            this.active_story_types['result' + a] = true;
        }
    }
    
}