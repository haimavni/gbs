import { bindable, inject, DOM, bindingMode, computedFrom, autoinject } from 'aurelia-framework';
import { MemberGateway } from '../../services/gateway';
import { I18N } from 'aurelia-i18n';
import { Misc } from '../../services/misc';

export class Answer {
    text = "";
    aid = 0;
    qid = 0;
    checked = false;
    input_mode = false;
    editing_mode = false;

    constructor(qid, text = "", aid = 0) {
        this.qid = qid;
        this.text = text;
        this.aid = aid;
    }
}

export class Question {
    prompt = "";
    qid = 0;
    input_mode = false;
    is_open = false;
    editing_mode = false;
    editable = false;
    answers: Answer[] = [];

    constructor(prompt = "", qid = 0, editable = true, answers = []) {
        this.prompt = prompt;
        this.qid = qid;
        this.editable = editable;
        this.answers = [];
        for (let answer of answers) {
            this.answers.push(new Answer(this.qid, answer.text, answer.aid))
        }
        if (!prompt) {
            this.input_mode = true;
        }
    }

    add_answer(text, aid) {
        this.answers.push(new Answer(this.qid, text, aid));
    }

    get checked() {
        for (let ans of this.answers) {
            if (ans.checked) return 'checked'
        }
        return '';
    }
}

export enum QState {
    USING,
    APPLYING,
    EDITING
}

@inject(DOM.Element, MemberGateway, I18N)
export class QuizCustomElement {
    @bindable q_state: QState;
    @bindable name;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) questions: Question[] = [];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) checked_answers = [];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) to_clear_now = false;
    api;
    i18n;
    autoClose = 'disabled';
    filter_menu_open = false;
    EDITING;
    element;
    dirty;

    constructor(element, api: MemberGateway, i18n: I18N) {
        this.api = api;
        this.i18n = i18n;
        this.EDITING = QState.EDITING;
        this.element = element;
    }

    attached() {
        this.api.call_server('quiz/read_menu', { name: this.name })
            .then(response => {
                this.questions = [];
                this.checked_answers = [];
                for (let q of response.questions) {
                    this.questions.push(new Question(q.prompt, q.qid, true, q.answers))
                }
                if (this.questions.length == 0) {
                    this.questions.push(new Question('', 0, true, []))
                }
            })
    }

    question_array_to_questions(questions_arr) {
        let questions: Question[] = [];
        for (let q of questions_arr) {
            questions.push(new Question(q.prompt, q.qid, false, q.answers))
        }
        return questions;
    }

    toggled(state) {
        //console.log("state: ", state);
    }

    apply_answer(question, answer) {
        if (this.q_state == QState.APPLYING) {
            for (let ans of question.answers) {
                if (ans.aid == answer.aid) {
                    ans.checked = !ans.checked;
                } else {
                    ans.checked = false;
                }
            }
        } else if (this.q_state == QState.USING) {
            answer.checked = !answer.checked;
        }
        this.calc_checked_answers();
        this.dispatch_event();
        this.dirty = this.is_dirty() ? 'dirty' : '';
    }

    get main_button_text() {
        let txt;
        switch (this.q_state) {
            case QState.APPLYING:
                txt = 'quiz.fill-questions';
                break;
            case QState.USING:
                txt = 'quiz.filters';
                break;
            case QState.EDITING:
                txt = 'quiz.edit-questions';
                break;
        }
        return this.i18n.tr(txt);
    }

    q_toggled(question: Question, event) {
        for (let q of this.questions) {
            if (q.qid != question.qid) {
                q.is_open = false;
            }
        }
        if (this.q_state == QState.EDITING) {
            if (question.answers.length == 0 || Misc.last(question.answers).text) {
                let ans: Answer = new Answer(question.qid)
                question.answers.push(ans)
            }
        } else if (this.q_state == QState.APPLYING) {
            let found = false;
            for (let ans of question.answers) {
                if (ans.checked) {
                    found = true
                } else if (found) {
                    ans.checked = false;
                }
            }
        }
    }

    answer_blurred(question: Question, answer: Answer) {
        answer.editing_mode = false;
    }

    main_filter_toggled() {
        this.filter_menu_open = !this.filter_menu_open;
        if (this.q_state == QState.EDITING) {
            for (let question of this.questions) {
                question.is_open = false;
            }
            if (this.filter_menu_open) {
                //create new empty question for adding
                if (this.questions.length == 0 || Misc.last(this.questions).prompt) {
                    let q_empty = new Question("", 0, true, []);
                    q_empty.input_mode = true;
                    this.questions.push(q_empty);
                    this.questions = this.questions.splice(0);
                }
            } else {
                //remove the extra empty question
                if (this.questions.length > 0 && !Misc.last(this.questions).prompt) {
                    this.questions.pop();
                }
            }
        }
    }

    edit_question(question: Question, event) {
        question.editing_mode = true;
        question.is_open = false;
        return false;
    }

    edit_answer(answer) {
        answer.editing_mode = true;
        return false;
    }

    answer_check_if_cr(question, answer, event) {
        if (event.keyCode == 13 || event.keyCode == 27) {
            answer.editing_mode = false;
            if (event.keyCode == 13) {
                this.save_answer(question, answer);
            }
            return false;
        }
        return true;
    }

    question_check_if_cr(question, event) {
        if (event.keyCode == 13 || event.keyCode == 27) {
            question.editing_mode = false;
            if (event.keyCode == 13) {
                this.save_question(question);
            }
            return false;
        }
        return true;
    }

    save_answer(question, answer) {
        answer.editing_mode = false;
        this.api.call_server_post('quiz/save_answer', { question_id: question.qid, answer_id: answer.aid, text: answer.text })
            .then(response => {
                answer.aid = response.answer_id;
                if ((Misc.last(question.answers).text)) {
                    question.answers.push(new Answer(question.qid));
                }
            })
    }

    save_question(question) {
        question.editing_mode = false;
        this.api.call_server_post('quiz/save_question', { name: this.name, question_id: question.qid, prompt: question.prompt })
            .then(response => {
                question.qid = response.question_id;
                if (Misc.last(this.questions).prompt) {
                    this.questions.push(new Question());
                }
            })
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('q-change', {
            detail: {
                q_state: this.q_state,
                checked_answers: this.checked_answers
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    clear_all_answers() {
        this.checked_answers = [];
        for (let question of this.questions) {
            for (let answer of question.answers) {
                answer.checked = false;
            }
        }
        this.checked_answers = [];
    }

    calc_checked_answers() {
        this.checked_answers = [];
        for (let question of this.questions) {
            for (let answer of question.answers) {
                if (answer.checked) {
                    this.checked_answers.push(answer.aid)
                }
            }
        }
    }

    @computedFrom('q_state')
    get dummy() {
        this.questions = this.questions.filter(q => q.prompt);
        for (let q of this.questions) {
            q.is_open = false;
            q.answers = q.answers.filter(a => a.text);
            for (let a of q.answers) {
                a.checked = false;
            }
        }
        this.dirty = "";
        this.checked_answers = [];
        this.filter_menu_open = false;
        return "";
    }

    is_dirty() {
        let drt;
        for (let question of this.questions) {
            for (let ans of question.answers) {
                if (ans.checked) return true;
            }
        }
        return false;
    }

    @computedFrom('to_clear_now')
    get clear_now() {
        if (this.to_clear_now) {
            this.clear_all_answers();
            this.to_clear_now = false;
            this.dirty = false;
        }
        return "";
    }

}
