import { IDialogService } from "@aurelia/dialog";
import { CustomDialog } from "../../services/custom-dialog";
import { ITheme } from "../../services/theme";
import { BindingMode, INode, bindable } from "aurelia";

export class DlgStringCustomElement {
    @bindable title;
    @bindable({ mode: BindingMode.twoWay }) str;
    @bindable placeholder;
    @bindable anchor;

    constructor(
        @INode private readonly element: HTMLElement,
        @IDialogService private readonly dialogService: IDialogService,
        @ITheme private readonly theme: ITheme
    ) {}

    inputString() {
        let model = {
            title: this.title,
            placeholder: this.placeholder,
            str: this.str,
            html: `<template>
                        <div style="background-color:beige;padding:20px;">
                        <h3 style="width:100%; margin-bottom:12px;text-align:center;">\${model.title}</h3>
                        <form class="form-inline" dir="rtl">
                            <input type="text" value.bind="model.str" placeholder.bind="model.placeholder" style="margin:15px;padding:6px;">
                            <button click.trigger="controller.ok(model.str)" style="margin:15px"><i class="fa fa-check"></i></button>
                        </form>
                        </div>
                </template>`,
        };

        this.theme.hide_title = true;
        this.dialogService
            .open({
                component: () => CustomDialog,
                template: model.html,
                model: model,
                lock: false,
            })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                if (response.status === "ok") {
                    this.str = model.str;
                    this.dispatch_event();
                }
            });
    }

    dispatch_event() {
        let changeEvent = new CustomEvent("str-change", {
            detail: {
                string_value: this.str,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
        this.str = "";
    }
}
