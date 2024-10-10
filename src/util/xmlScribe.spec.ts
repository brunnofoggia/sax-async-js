import { declaration, open, attributes, attribute, close, cdata } from './xmlScribe';

describe('xmlScribe', () => {
    it('should import correctly', () => {
        expect(declaration).toBeDefined();
        expect(open).toBeDefined();
        expect(attributes).toBeDefined();
        expect(attribute).toBeDefined();
        expect(close).toBeDefined();
        expect(cdata).toBeDefined();
    });

    describe('declaration', () => {
        it('should generate XML declaration with default encoding', () => {
            const result = declaration({});
            expect(result).toBe('<?xml version="1.0" encoding="UTF-8" ?>');
        });

        it('should generate XML declaration with specified encoding', () => {
            const result = declaration({ encoding: 'ISO-8859-1' });
            expect(result).toBe('<?xml version="1.0" encoding="ISO-8859-1" ?>');
        });

        it('should generate XML declaration with standalone attribute', () => {
            const result = declaration({ standalone: 'yes' });
            expect(result).toBe('<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>');
        });
    });

    describe('open', () => {
        it('should generate opening tag with attributes', () => {
            const result = open('tag', { id: '123', class: 'test' });
            expect(result).toBe('<tag id="123" class="test">');
        });

        it('should generate self-closing tag with attributes', () => {
            const result = open('tag', { id: '123', class: 'test' }, true);
            expect(result).toBe('<tag id="123" class="test" />');
        });

        it('should generate opening tag without attributes', () => {
            const result = open('tag', {});
            expect(result).toBe('<tag>');
        });
    });

    describe('attributes', () => {
        it('should generate attributes string', () => {
            const result = attributes({ id: '123', class: 'test' });
            expect(result).toBe(' id="123" class="test"');
        });

        it('should return empty string for no attributes', () => {
            const result = attributes({});
            expect(result).toBe('');
        });
    });

    describe('attribute', () => {
        it('should generate single attribute string', () => {
            const result = attribute('id', '123');
            expect(result).toBe('id="123"');
        });

        it('should escape attribute values', () => {
            const result = attribute('data', 'some "quoted" value & special <characters>');
            expect(result).toBe('data="some &quot;quoted&quot; value &amp; special &lt;characters&gt;"');
        });
    });

    describe('close', () => {
        it('should generate closing tag', () => {
            const result = close('tag');
            expect(result).toBe('</tag>');
        });
    });

    describe('cdata', () => {
        it('should generate CDATA section', () => {
            const result = cdata('some text');
            expect(result).toBe('<![CDATA[some text]]>');
        });

        it('should escape CDATA end sequence', () => {
            const result = cdata('some ]]> text');
            expect(result).toBe('<![CDATA[some ]]]]><![CDATA[> text]]>');
        });
    });
});
