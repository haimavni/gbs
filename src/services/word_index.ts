import { MemberGateway } from './gateway';
import { autoinject, singleton, noView } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
@singleton()
@noView()
export class WordIndex {
    api;
    _word_index;
    eventAggregator: EventAggregator;

    constructor(api: MemberGateway, eventAggregator: EventAggregator) {
        this.api = api;
        this.eventAggregator = eventAggregator;
        this.eventAggregator.subscribe('WORD_INDEX_CHANGED', (response) => {
            this.update_word_index(response.story_id, response.added_words, response.deleted_words, response.new_words);
        })
    }

    get_word_index() {
        if (this._word_index) {
            return new Promise(resolve => {
                resolve(this._word_index)
            })
        } else {
            console.time('get_words_index');
            return this.api.call_server('members/get_stories_index')
                .then(response => {
                    this._word_index = response.stories_index;
                    console.timeEnd('get_words_index');
                    return this._word_index;
                });
        }
    }

    update_word_index(story_id, added_words, deleted_words, new_words) {
        for (let aw of added_words) {
            let index_items = this._word_index.filter(item => item.word_id == aw);
            if (index_items.length == 0) {
                let new_index_item = { name: new_words[aw], word_id: aw, story_ids: [story_id], word_count: 1 }
                this._word_index.push(new_index_item)
            } else {
                index_items[0].story_ids.push(story_id)
            }
        }
        for (let dw of deleted_words) {
            let index_items = this._word_index.filter(item => item.word_id == dw);
            let idx = index_items[0].story_ids.indexOf(story_id);
            if (idx > -1) {
                index_items[0].story_ids.splice(idx, 1);
                if (index_items[0].story_ids.length==0) {
                    let i = this._word_index.findIndex(item => item.word_id==dw);
                    if (i > 0) {
                        this._word_index.splice(i, 1);
                    }
                }
            }
        }
    }

}