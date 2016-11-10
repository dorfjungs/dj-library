goog.provide('dj.soy.TemplateRenderer');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.async.nextTick');
goog.require('goog.structs.Map');
goog.require('goog.Promise');
goog.require('goog.soy');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.soy.TemplateRenderer = function()
{
    goog.base(this);

    /**
     * @private
     * @type {goog.structs.Map<string, Function>}
     */
    this.templates_ = new goog.structs.Map();

    /**
     * @private
     * @type {number}
     */
    this.strategy_ = dj.soy.TemplateRenderer.Strategy.REPLACE;
};

goog.inherits(
    dj.soy.TemplateRenderer,
    goog.events.EventTarget
);

/**
 * @const
 * @type {string}
 */
dj.soy.TemplateRenderer.TEMPLATE_IDENTIFIER = 'dj-template';

/**
 * Defines the way the template will be rendered:
 *
 * REPLACE - The template element replaces itself with the rendered template
 * NESTED - The rendered template will be placed in the template element
 *
 * @enum {number}
 */
dj.soy.TemplateRenderer.Strategy = {
    REPLACE: 0,
    NESTED: 1
};

/**
 * @param {string} id
 * @param {Function} template
 */
dj.soy.TemplateRenderer.prototype.addTemplate = function(id, template)
{
    this.templates_.set(id, template);
};

/**
 * @param {Element} root
 * @return {goog.Promise}
 */
dj.soy.TemplateRenderer.prototype.render = function(root)
{
    var elements = root.querySelectorAll(
        dj.soy.TemplateRenderer.TEMPLATE_IDENTIFIER);

    goog.array.forEach(elements, function(element){
        var id = element.getAttribute('id');
        var template = this.templates_.get(id);
        var attributes = {};

        if (goog.dom.dataset.has(element, 'attributes')) {
            attributes = goog.json.parse(/** @type {string} */ (
                goog.dom.dataset.get(element, 'attributes')
            ));
        }

        var templateElement = goog.soy.renderAsElement(template, attributes);

        if (this.strategy_ == dj.soy.TemplateRenderer.Strategy.REPLACE) {
            goog.dom.replaceNode(templateElement, element);
        }
        else {
            goog.dom.appendChild(element, templateElement);
        }
    }, this);

    return new goog.Promise(function(resolve, reject){
        goog.async.nextTick(resolve);
    }, this);
};