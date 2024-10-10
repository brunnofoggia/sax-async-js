import { QualifiedTag, SAXOptions, Tag as SaxTag } from 'sax';

export type EventList = {
    [key in SaxEventType]: any;
};

export interface SaxEvent {
    type: SaxEventType;
    args?: EventArguments[];
}

export interface EventArguments {
    tag?: SaxTag | QualifiedTag | string;
    text?: string;
    [key: string]: any;
}

export enum SaxEventEnum {
    // most used
    'opentag' = 'opentag',
    'text' = 'text',
    'closetag' = 'closetag',
    'end' = 'end',
    // common
    'cdata' = 'cdata',
    'opencdata' = 'opencdata',
    'closecdata' = 'closecdata',
    // namespace
    'opennamespace' = 'opennamespace',
    'closenamespace' = 'closenamespace',
    // other
    'doctype' = 'doctype',
    'processinginstruction' = 'processinginstruction',
    'sgmldeclaration' = 'sgmldeclaration',
    'attribute' = 'attribute',
    'comment' = 'comment',
    'ready' = 'ready',
    'close' = 'close',
    'readable' = 'readable',
    'drain' = 'drain',
    'finish' = 'finish',
    // global
    'script' = 'script',
    'data' = 'data',
    'error' = 'error',
    'pipe' = 'pipe',
    'unpipe' = 'unpipe',
}

export interface SaxConstructorParams {
    strict: boolean;
    options: SAXOptions;
}

export type SaxEventType = keyof typeof SaxEventEnum;

export interface Tag extends SaxTag {}
