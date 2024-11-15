import { isFunction, omit, pick, size } from 'lodash';
import { SAXStream } from 'sax';

import Emittery from './util/emittery';
import { EventList, SaxConstructorParams, SaxEvent, SaxEventEnum } from './interfaces/sax.interface';
import { Err } from './common/utils/error';
import { ERROR_CODE } from './enum/error';

export class SaxAsync {
    private events: Partial<EventList> = {};
    private saxParams: SaxConstructorParams;
    private sax: SAXStream;
    private stream: NodeJS.ReadableStream;

    stackOfEvents: SaxEvent[];
    chunkNumber;

    constructor(strict = true, options: any = {}) {
        this.saxParams = { strict, options: omit(options, 'stream', 'ignoreDataEvents') };
        if (options.stream) this.setStream(options.stream);
        this.saxParams.ignoreDataEvents = 'ignoreDataEvents' in options ? !!options.ignoreDataEvents : false;
    }

    getStream() {
        return this.stream;
    }

    setStream(stream) {
        this.stream = stream;
    }

    on(event: string, asyncCallback: any) {
        if (!isFunction(asyncCallback)) {
            throw new Err('Event handler must be a function', ERROR_CODE.EVENT_NOT_FUNCTION);
        }
        this.events[event] = asyncCallback;
    }

    off(event: string) {
        delete this.events[event];
    }

    resetEvents() {
        this.events = {};
    }

    async execute() {
        const readable = this.stream;
        if (!readable) {
            throw new Err('Readable stream is not set', ERROR_CODE.READSTREAM_NOT_SET);
        }

        const eventEmitter = new Emittery();
        this.attachEventsTo(eventEmitter);

        this.initializeSax();
        // this.chunkNumber = 0;

        // Read stream chunks
        for await (const saxesEvents of this.parse(readable, this.sax) ?? []) {
            // Process batch of events
            let saxesEvent;
            while ((saxesEvent = saxesEvents.shift())) {
                // for (const saxesEvent of saxesEvents ?? []) {
                const args = saxesEvent.args?.length === 1 ? saxesEvent.args[0] : saxesEvent.args;

                // Emit ordered events and process them in the event handlers strictly one-by-one
                // See https://github.com/sindresorhus/emittery#emitserialeventname-data
                await eventEmitter.emitSerial(saxesEvent.type, args);
            }
        }
    }

    dispatchErrors(errors) {
        const err = new Err(errors[0].message, ERROR_CODE.PARSE_ERROR);
        throw err;
        // for (const x in errors) {
        //     const error = errors[x];
        //     console.error('error n.', x, 'message: ', error.message);
        // }
        // throw new Err('errors thrown while parsing', ERROR_CODE.PARSE_ERROR);
    }

    private async *parse(iterable: NodeJS.ReadableStream, saxParser: SAXStream): AsyncGenerator<SaxEvent[], void, undefined> {
        const errors = [];
        saxParser.on('error', (_error: any) => {
            // collect error to throw it later
            errors.push(pick(_error, ['message', 'code', 'stack']));
        });

        for await (const chunk of iterable) {
            this.stackOfEvents = [];
            // this.chunkNumber++;

            try {
                this.parseChunk(chunk, saxParser);
            } catch (_error) {
                errors.push(pick(_error, ['message', 'code', 'stack']));
            }

            if (errors.length) this.dispatchErrors(errors);
            yield this.stackOfEvents;
        }

        if (errors.length) this.dispatchErrors(errors);

        this.stackOfEvents.push({
            type: 'end',
        });
        yield this.stackOfEvents;
    }

    private parseChunk(chunk, saxParser: SAXStream) {
        try {
            saxParser.write(chunk as string);
        } catch (error) {
            throw new Err(error?.message, ERROR_CODE.PARSE_ERROR);
        }
    }

    private proxySaxEvents(saxParser: SAXStream) {
        // As a performance and error handling optimization, we gather all events instead of passing
        // them one by one, which would cause each event to go through the event queue
        this.stackOfEvents = [];
        for (const saxEvent in SaxEventEnum) {
            if (saxEvent === 'error') continue;

            saxParser.on(saxEvent, (...args) => {
                if (saxEvent === 'data' && this.saxParams.ignoreDataEvents) return;
                this.stackOfEvents.push({
                    type: saxEvent as any,
                    args,
                });
            });
        }
    }

    private async attachEventsTo(target) {
        if (!this.events || !size(this.events)) {
            throw new Err('No events to attached', ERROR_CODE.NO_EVENTS);
        }

        for (const [event, fn] of Object.entries(this.events)) {
            if (!fn) continue;
            target.on(event, fn);
        }
    }

    private initializeSax() {
        this.sax = new SAXStream(this.saxParams.strict, this.saxParams.options);
        this.proxySaxEvents(this.sax);

        return this.sax;
    }
}
