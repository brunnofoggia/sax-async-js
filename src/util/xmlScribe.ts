import { size } from 'lodash';

import { NodeElementAttributes } from '../interfaces/xml.interface';
import { escapeForXML } from './escapeForXml';

export function declaration(_declaration: { encoding?: string; standalone?: string }) {
    const encoding = _declaration.encoding || 'UTF-8';
    const attr: any = { version: '1.0', encoding };

    if (_declaration.standalone) {
        attr.standalone = _declaration.standalone;
    }

    return open('?xml', attr, true).replace('/>', '?>');
}

export function open(name: string, attrList: NodeElementAttributes, selfClosed = false) {
    return `<${name}${attributes(attrList)}${selfClosed ? ' /' : ''}>`;
}

export function attributes(attributes: NodeElementAttributes) {
    if (!attributes || !size(attributes)) return '';

    const _attributes = [''];
    for (const [key, value] of Object.entries(attributes)) {
        _attributes.push(attribute(key, value));
    }
    return _attributes.join(' ');
}

export function attribute(key: string, value: string) {
    return `${key}="${escapeForXML(value)}"`;
}

export function close(name: string) {
    return `</${name}>`;
}

export function cdata(text: string) {
    return ('<![CDATA[' + text).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>';
}

const xml = {
    declaration,
    open,
    attributes,
    close,
};

export default xml;
