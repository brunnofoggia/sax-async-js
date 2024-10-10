const XML_CHARACTER_MAP = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;',
};

export function escapeForXML(string) {
    return string && string.replace
        ? string.replace(/([&"<>'])/g, function (str, item) {
              return XML_CHARACTER_MAP[item];
          })
        : string;
}
