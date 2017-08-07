goog.provide('dj.ext.dom.attributes');

// goog
goog.require('goog.array');

/**
 * @typedef {{
 *     name: string,
 *     value: string
 * }}
 */
dj.ext.dom.attributes.Attribute;

/**
 * @param {Element} element
 * @return {Object}
 */
dj.ext.dom.attributes.getAttributes = function(element)
{
    var map = {};
    var list = goog.array.map(goog.array.slice(element.attributes, 0), function(node){
        node = /** @type {Node} */ (node);

        return /** @type {dj.ext.dom.attributes.Attribute} */ {
            name: node.nodeName,
            value: node.value
        };
    });

    for (var i = 0, len = list.length; i < len; i++) {
        map[list[i].name] = list[i].value;
    }

    return map;
};