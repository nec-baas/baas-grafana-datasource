/// <reference path="./grafana-sdk.d.ts" />

import {Completion, CursorPosition} from "app/plugins/sdk";
import {BaasDatasource} from './datasource';

/**
 * Field Completer
 */
export class FieldCompleter {

    objCache: any;

    constructor(private datasource: BaasDatasource, private bucket: string) {
        this.objCache = null;
    }

    /**
     * Get completions.
     * @param editor
     * @param session 
     * @param pos cursor position
     * @param prefix
     * @param callback
     */
    getCompletions(editor: any, session: any, pos: CursorPosition, prefix: string, callback: (error: any, completions: Completion[]) => void) {
        if (!this.bucket || pos.row != 0) {
            callback(null, []);
            return;
        }

        if (this.objCache != null) {
            const completions = this.buildCompletions(this.objCache, session.toString(), pos.column);
            callback(null, completions);
        } else {
            this.datasource.getLatestObject(this.bucket)
                .then(obj => {
                    this.objCache = obj;
                    const completions = this.buildCompletions(obj, session.toString(), pos.column);
                    callback(null, completions);
                });
        }
    }

    /**
     * Set bucket
     * @param {string} bucket name
     */
    setBucket(bucket: string) {
        this.bucket = bucket;
        this.clearCache()
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.objCache = null;
    }

    private buildCompletions(obj: object, inputStr: string, cursor: number): Completion[] {
        const inputFields = inputStr.split('.');

        // カーソルが何番目のフィールドを指しているか特定
        const pos = inputStr.substring(0, cursor).split('.').length - 1;

        // 現在位置のオブジェクトを抽出しキーリストを作成
        for (let i = 0; i < pos; i++) {
            if (obj == null || typeof obj !== 'object') {
                break;
            }
            obj = obj[inputFields[i]];
        }

        const completions: Completion[] = [];
        if (obj != null && typeof obj === 'object') {
            for (let key of Object.keys(obj)) {
                completions.push({
                    caption: key,
                    value: key,
                    meta: 'field name'
                });
            }
        }

        return completions;
    }
}
