export class Answer {
    text = "";
    aid = 0;
    qid = 0;
    checked = false;
    input_mode = false;
    editing_mode = false;
    description = "";

    constructor(qid, text = "", aid = 0) {
        this.qid = qid;
        this.text = text;
        this.aid = aid;
    }
}

export class Question {
    prompt = "";
    description = "";
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
