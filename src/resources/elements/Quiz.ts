import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { set_intersection, set_union, set_diff } from '../../services/set_utils';
import { CustomDialog } from '../../services/custom-dialog';
import { DialogService } from 'aurelia-dialog';
import * as Collections from 'typescript-collections';
import { I18N } from 'aurelia-i18n';
import { User } from '../../services/user';
import { Misc } from '../../services/misc';

class Answer {
    text = "";
    aid = 0;
    checked = false;
    input_mode = false;

    constructor(text, aid) {
        this.text = text;
        this.aid = aid;
    }
}

class Question {
    question = "";
    qid = 0;
    checked = false;
    input_mode = false;
    editable = false;
    answers: Answer[];

    constructor(question, qid, editable, answers=[]) {
        this.question = question,
        this.qid = qid,
        this.editable = editable;
        for (let answer of answers) {
            this.answers.push(new Answer(answer.text, answer.aid))
        }
    }

    add_answer(text, id) {
        this.answers.push(new Answer(text , id));
    }
}

class Questionaire {
    name: string = "";
    questions: Question[] = [];

    constructor(name, questions: Question[] = []) {
        this.name = name;
        for (let question of questions) {
            this.questions.push(question);
        }
    }
    add_question(question) {
        this.questions.push(question);
    }
}

@inject(DOM.Element, I18N, DialogService, User)
export class Quiz {
    @bindable ready_to_apply: boolean;
    user;
    questions = [
        {
            question: 'שאלה ראשונה', qid: 0, input_mode: false, is_open: false,
            answers: [{ text: 'answer11', aid: 0, checked: true, input_mode: false }, { text: 'answer12', aid: 1, checked: false, input_mode: false }, { text: 'answer13', aid: 2, checked: false, input_mode: false }]
        },
        {
            question: 'שאלה שניה', qid: 1, input_mode: false, is_open: false,
            answers: [{ text: 'answer21', aid: 3, checked: false, input_mode: false }, { text: 'answer22', aid: 4, checked: true, input_mode: false }, { text: 'answer23', aid: 5, checked: false, input_mode: false }]
        },
        {
            question: 'שאלה שלישית', qid: 2, input_mode: false, is_open: false,
            answers: [{ text: 'answer31', aid: 6, checked: false, input_mode: false }, { text: 'answer32', aid: 7, checked: false, input_mode: false }, { text: 'answer33', aid: 8, checked: true, input_mode: false }]
        }
    ];
    autoClose = 'disabled';
    filter_menu_open = false;


    constructor(user: User) {
        this.user = user;
    }

    toggled(state) {
        console.log("state: ", state);
    }

    @computedFrom('user.editing', 'selected_members')
    get q_state() {
        if (this.user.editing) {
            //ready_to_apply may be, for example, this.selected_members.size > 0
            if (this.ready_to_apply) return 'applying-q';
            return 'editing-q'
        } else return 'using-q'
    }

    apply_answer(question, answer) {
        if (this.q_state == 'applying-q') {
            for (let ans of question.answers) {
                ans.checked = ans.aid == answer.aid;
            }
        } else if (this.q_state == 'using-q') {
            answer.checked = !answer.checked;
        }
    }

    q_toggled(question, event) {
        for (let q of this.questions) {
            if (q.qid != question.qid) {
                q.is_open = false;
            }
        }
        if (this.q_state == 'editing-q') {
            if (question.answers.length == 0 || Misc.last(question.answers).text) {
                question.answers.push({text: "", aid: 0, checked: false, input_mode: false})
            }
        }
    }

    main_filter_toggled() {
        this.filter_menu_open = !this.filter_menu_open;
        if (this.q_state == 'editing-q') {
            for (let question of this.questions) {
                question.is_open = false;
            }
            if (this.filter_menu_open) {
                //create new empty question for adding
                if (this.questions.length == 0 || Misc.last(this.questions).question) {
                    let q_empty = { question: "", qid: 0, input_mode: true, is_open: false, answers: [] };
                    this.questions.push(q_empty);
                    this.questions = this.questions.splice(0);
                }
            } else {
                //remove the extra empty question
                if (this.questions.length > 0 && !Misc.last(this.questions).question) {
                    this.questions.pop();
                }
            }
        }
    }

    edit_question(question) {
        question.editing_mode = true;
        return false;
    }

    edit_answer(answer) {
        answer.editing_mode = true;
        return false;
    }

    check_if_cr(item, event) {
        if (event.keyCode == 13) {
            item.editing_mode = false;
            //return false;
        }
        return true;
    }

}
