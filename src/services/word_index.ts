import { MemberGateway } from './gateway';
import { autoinject, singleton, noView, computedFrom } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
@singleton()
@noView()
export class WordIndex {
    api;
    _word_index = [];
    word_index_length = 1000000;
    eventAggregator: EventAggregator;
    working = false;
    ready = false;

    constructor(api: MemberGateway, eventAggregator: EventAggregator) {
        this.api = api;
        this.eventAggregator = eventAggregator;
        this.eventAggregator.subscribe('WORD_INDEX_CHANGED', (response) => {
            this.update_word_index(response.story_id, response.added_words, response.deleted_words, response.new_words);
        })
    }

    async get_word_index() {
        if (this.working) return;
        this.working = true;
        if (this._word_index.length == 0) {
            let start = 0;
            this._word_index = [];
            for (let i = 0; i < 6; i += 1) {
                if (this.ready) break;
                start = this._word_index.length;
                await this.read_index_chunk(start)
                    .then(response => {
                        if (this._word_index.length >= this.word_index_length) {
                            this.ready = true;
                        }
                    });
            }
        }
        return new Promise(resolve => {
            resolve(this._word_index)
        });
    }

    read_index_chunk(start) {
        return this.api.call_server('members/get_stories_index', { start: start })
            .then(response => {
                this._word_index = this._word_index.concat(response.stories_index);
                this.word_index_length = response.length;
            });
    }

    @computedFrom('ready')
    get word_index() {
        if (this.ready)
            return this._word_index;
        return null;
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
                if (index_items[0].story_ids.length == 0) {
                    let i = this._word_index.findIndex(item => item.word_id == dw);
                    if (i > 0) {
                        this._word_index.splice(i, 1);
                    }
                }
            }
        }
    }

}