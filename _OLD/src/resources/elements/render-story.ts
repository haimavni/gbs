import { autoinject, noView, bindable, InlineViewStrategy, bindingMode } from 'aurelia-framework';
import { Popup } from '../../services/popups';

//@noView
@autoinject
export class RenderStoryCustomElement {
    @bindable({ defaultBindingMode: bindingMode.oneWay }) html = '<h1>BoomBoom</h1>';
    popup;

    constructor(popup: Popup) {
        this.popup = popup;
    }

    attached() {
        let html = this.html;
        let pat_str = '(<a .*?)href="(.*?)"(.*?)>(.*?)</a>';
        let pat = new RegExp(pat_str, 'gi');
        html = html.replace(/\n/g, '');
        html = html.replace(pat, function (m, m1, m2, m3, m4) {
            return `<a href=${m2} target="_blank">${m4}</a>`
            //return m + 'target="_blank" ' + m1 + m2 + m3 + m4;
            //return m1 + " click.trigger=\"popup_window('POPUP', '" + m2 + "')\"" + m3 + '>' + m4 + "</a>"
        });
        //apply modifications here
        this.html = html; //'<template>' + html + '</template>';
    }

    popup_window(name, url) {
        console.log("enter poppup")
        let w = window.outerWidth - 200;
        let h = window.outerHeight - 200;
        let params = "height=" + h + ",width=" + w + ",left=100,top=100";
        this.popup.popup(name, url, params);
    }

    getViewStrategy() {
        return new InlineViewStrategy(this.html);
    }
}
