/// <reference path="grafana-sdk.d.ts" />
import { Completion, CursorPosition } from "app/plugins/sdk";
import { BaasDatasource } from './datasource';
/**
 * Field Completer
 */
export declare class FieldCompleter {
    private datasource;
    private bucket;
    objCache: any;
    constructor(datasource: BaasDatasource, bucket: string);
    /**
     * Get completions.
     * @param editor
     * @param session
     * @param pos cursor position
     * @param prefix
     * @param callback
     */
    getCompletions(editor: any, session: any, pos: CursorPosition, prefix: string, callback: (error: any, completions: Completion[]) => void): void;
    /**
     * Set bucket
     * @param {string} bucket name
     */
    setBucket(bucket: string): void;
    /**
     * Clear cache
     */
    clearCache(): void;
    private buildCompletions;
}
