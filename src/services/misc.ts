
import { autoinject, singleton, noView, computedFrom } from "aurelia-framework";
import { MemberGateway } from "./gateway";
import { I18N } from 'aurelia-i18n';

@autoinject()
@singleton()
@noView()
export class Misc {
    i18n;
    api;

    constructor(api: MemberGateway, i18n: I18N) {
        this.api = api;
        this.i18n = i18n;
    }

    calc_life_cycle_text(member_info) {
        let s = "";
        let birth_place = member_info.PlaceOfBirth;
        let birth_date = member_info.date_of_birth ? member_info.date_of_birth.date : "";
        let death_place = member_info.place_of_death;
        let death_date = member_info.date_of_death ? member_info.date_of_death.date : "";
        let gender = member_info.gender || "M";
        if (birth_date) {
            s += this.i18n.tr('members.born-' + gender.toLowerCase()) + " ";
            if (birth_place) {
                s += this.i18n.tr('members.in-place') + birth_place + " ";
            }
            s += this.i18n.tr('members.in-date') + birth_date + '.';
        }
        if (death_date) {
            let cod_idx = member_info.cause_of_death || 0;
            if (!this.api.constants.cause_of_death) return s;
            let keys = Object.keys(this.api.constants.cause_of_death);
            let cod = "";
            for (let key of keys) {
                if (this.api.constants.cause_of_death[key] == cod_idx) {
                    key = 'consts.' + (key.replace(/_/g, '-') + '-' + gender).toLowerCase();
                    cod = this.i18n.tr(key);
                    break;
                }
            }
            s += " " + cod + " ";
            if (death_place) {
                s += this.i18n.tr('members.in-place') + death_place + " ";
            }
            s += this.i18n.tr('members.in-date') + death_date + '.';
        }
        return s;
    }

    old_display_name(rec) {
        let s = rec.Name || '';
        if (rec.FormerName)
            s += ' (' + rec.FormerName + ')';
        if (rec.NickName)
            s += ' - ' + rec.NickName;
        return s;
    }

    calc_member_display_name(rec) {
        if (!rec.first_name)
            return this.old_display_name(rec);
        let s = rec.first_name + ' ' + rec.last_name
        if (rec.former_first_name || rec.former_last_name) {
            s += ' (';
            if (rec.former_first_name)
                s += rec.former_first_name
            if (rec.former_last_name) {
                if (rec.former_first_name)
                    s += ' '
                s += rec.former_last_name
            }
            s += ')'
        }
        if (rec.NickName)
            s += ' - ' + rec.NickName;
        return s;
    }

    static last(array) {
        return array[array.length - 1];
    }

}
