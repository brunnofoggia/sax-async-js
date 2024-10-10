import { isFunction, omit, size } from 'lodash';
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

    constructor(strict = true, options: any = {}) {
        this.saxParams = { strict, options: omit(options, 'stream') };
        if (options.stream) this.setStream(options.stream);
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

        // Read stream chunks
        for await (const saxesEvents of this.parse(readable) ?? []) {
            // Process batch of events
            for (const saxesEvent of saxesEvents ?? []) {
                const args = saxesEvent.args?.length === 1 ? saxesEvent.args[0] : saxesEvent.args;

                // Emit ordered events and process them in the event handlers strictly one-by-one
                // See https://github.com/sindresorhus/emittery#emitserialeventname-data
                await eventEmitter.emitSerial(saxesEvent.type, args);
            }
        }
    }

    private async *parse(iterable: NodeJS.ReadableStream): AsyncGenerator<SaxEvent[], void, undefined> {
        const saxParser = this.initializeSax();
        let events = this.proxySaxEvents(saxParser);

        let error;
        saxParser.on('error', (_error) => {
            // collect error to throw it later
            error = new Err(error.message, error.code);
            error.stack = _error.stack;
        });

        for await (const chunk of iterable) {
            this.parseChunk(chunk, saxParser);
            if (error) {
                throw error;
            }

            yield events;
            events = [];
        }

        yield [
            {
                type: 'end',
            },
        ];
    }

    private parseChunk(chunk, saxParser) {
        try {
            saxParser.write(chunk as string);
        } catch (error) {
            throw new Err(error.message, ERROR_CODE.PARSE_ERROR);
        }
    }

    private proxySaxEvents(saxParser): SaxEvent[] {
        // As a performance and error handling optimization, we gather all events instead of passing
        // them one by one, which would cause each event to go through the event queue
        const events: SaxEvent[] = [];
        for (const saxEvent in SaxEventEnum) {
            if (saxEvent === 'error') continue;

            saxParser.on(saxEvent, (...args) => {
                events.push({
                    type: saxEvent as any,
                    args,
                });
            });
        }

        return events;
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
        return (this.sax = new SAXStream(this.saxParams.strict, this.saxParams.options));
    }
}
