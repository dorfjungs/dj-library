goog.provide('dj.models.AccordionItemModel');

/**
 * @constructor
 * @param {string} id
 * @param {Element} parent
 * @param {Element} header
 * @param {Element} content
 */
dj.models.AccordionItemModel = function(id, parent, header, content)
{
    /**
     * @param {string}
     */
    this.id = id;

    /**
     * @type {Element}
     */
    this.parent = parent;

    /**
     * @type {Element}
     */
    this.header = header;

    /**
     * @type {Element}
     */
    this.content = content;

    /**
     * @type {boolean}
     */
    this.active = false;
};