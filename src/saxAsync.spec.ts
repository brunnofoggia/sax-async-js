import { Readable } from 'stream';

import '@test/common/jest.test';
import { SaxAsync } from './saxAsync';
import { buildErrorCode, Err } from './common/utils/error';
import { ERROR_CODE } from './enum/error';

describe('SaxAsync', () => {
    let saxAsync: SaxAsync;

    beforeEach(() => {
        saxAsync = new SaxAsync();
    });

    it('should set stream correctly', () => {
        const stream = new Readable();
        saxAsync.setStream(stream);
        expect(saxAsync.getStream()).toBe(stream);
    });

    describe('events', () => {
        it('should throw error if event handler is not a function', () => {
            expect(() => saxAsync.on('event', 'not a function')).toThrowCode(ERROR_CODE.EVENT_NOT_FUNCTION);
        });

        it('should add event handler correctly', () => {
            const handler = jest.fn();
            saxAsync.on('event', handler);
            expect(saxAsync['events']['event']).toBe(handler);
        });

        it('should remove event handler correctly', () => {
            const handler = jest.fn();
            saxAsync.on('event', handler);
            saxAsync.off('event');
            expect(saxAsync['events']['event']).toBeUndefined();
        });

        it('should reset all event handlers', () => {
            const handler = jest.fn();
            saxAsync.on('event1', handler);
            saxAsync.on('event2', handler);
            saxAsync.resetEvents();
            expect(saxAsync['events']).toEqual({});
        });

        it('should attach events to target correctly', async () => {
            const handler = jest.fn();
            saxAsync.on('event', handler);
            const target = { on: jest.fn() };
            await saxAsync['attachEventsTo'](target);
            expect(target.on).toHaveBeenCalledWith('event', handler);
        });

        it('should throw error if no events to attach', async () => {
            expect(() => saxAsync['attachEventsTo']({})).toThrowCode(ERROR_CODE.NO_EVENTS);
        });
    });

    describe('parser', () => {
        it('should throw error if stream is not set during execution', async () => {
            await expect(() => saxAsync.execute()).rejects.toThrowCode(ERROR_CODE.READSTREAM_NOT_SET);
        });

        it('should throw error when xml string is not valid', async () => {
            expect.assertions(2);

            const stream = new Readable();
            stream.push('chunk');
            stream.push(null);
            saxAsync.setStream(stream);

            try {
                for await (const events of saxAsync['parse'](stream)) {
                    break;
                }
            } catch (error) {
                expect(error).toBeInstanceOf(Err);
                expect(error.code).toEqual(buildErrorCode(ERROR_CODE.PARSE_ERROR));
            }
        });

        it('should parse stream chunks', async () => {
            expect.assertions(6);

            const stream = new Readable();
            const tag = '<test />';
            stream.push(tag);
            stream.push(null);
            saxAsync.setStream(stream);

            for await (const events of saxAsync['parse'](stream)) {
                expect(events[0]['type']).toEqual('opentag');
                expect(events[0]['args'][0]).toEqual({
                    name: 'test',
                    isSelfClosing: true,
                    attributes: {},
                });
                expect(events[1]['type']).toEqual('closetag');
                expect(events[1]['args'][0]).toEqual('test');
                expect(events[2]['type']).toEqual('data');
                expect(events[2]['args'][0]).toEqual(tag);
                break;
            }
        });
    });

    describe('asynchronous events', () => {
        it('should wait asynchronous callback to be finished', async () => {
            expect.assertions(2);

            let counter = 0;
            const stream = new Readable();
            const tag = '<test />';
            stream.push(tag);
            stream.push(null);
            saxAsync.setStream(stream);

            saxAsync.on('opentag', async (node) => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(counter++).toEqual(0);
            });

            saxAsync.on('closetag', async (node) => {
                expect(counter++).toEqual(1);
            });

            await saxAsync.execute();
        });
    });
});
