import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { Question, Answer} from './quiz-model';

@autoinject
export class EditQuestion {
    question: Question;
    old_prompt: string;
    old_description: string;
    controller: DialogController;

    constructor(controller: DialogController) {
        this.controller = controller;
    }

    activate(question: Question) {
        this.question = question;
        this.old_prompt = this.question.prompt.slice(0);
        this.old_description = this.question.description.slice(0);
    }

    save() {
        this.controller.ok();
    }

    cancel() {
        //restore original values
        this.question.prompt = this.old_prompt;
        this.question.description = this.old_description;
        this.controller.cancel();
    }

}
