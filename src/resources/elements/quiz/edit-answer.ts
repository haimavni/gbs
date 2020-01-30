import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { Question, Answer} from './quiz-model';

@autoinject
export class EditAnswer {
    answer: Answer;
    old_text: string;
    old_description: string;
    controller: DialogController;

    constructor(controller: DialogController) {
        this.controller = controller;
    }

    activate(answer: Answer) {
        this.answer = answer;
        this.old_text = this.answer.text.slice(0);
        this.old_description = this.answer.description.slice(0);
    }

    save() {
        this.controller.ok();
    }

    cancel() {
        //restore original values
        this.answer.text = this.old_text;
        this.answer.description = this.old_description;
        this.controller.cancel();
    }

}
