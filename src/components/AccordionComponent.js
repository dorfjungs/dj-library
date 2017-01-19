goog.provide('dj.components.AccordionComponent');

// goog
goog.require('goog.ui.IdGenerator');
goog.require('goog.structs.Map');
goog.require('goog.Promise');

// dj
goog.require('dj.components.BaseComponent');
goog.require('dj.models.AccordionItemModel');

/**
 * @constructor
 * @extends {dj.components.BaseComponent}
 */
dj.components.AccordionComponent = function()
{
    goog.base(this);

    /**
     * @private
     * @type {goog.structs.Map<string, dj.models.AccordionItemModel>}
     */
    this.items_ = new goog.structs.Map();
};

goog.inherits(
    dj.components.AccordionComponent,
    dj.components.BaseComponent
);

/**
 * @type {string}
 */
dj.components.AccordionComponent.ACTIVE_CLASS = 'active';

/** @inheritDoc */
dj.components.AccordionComponent.prototype.init = function()
{
    return new goog.Promise(function(resolve, reject){
        // Collect and parse items
        var items = this.getElementsByClass('item');

        goog.array.forEach(items, function(item){
            var model = this.parseItem_(item);
            this.items_.set(model.id, model);
        }, this);

        goog.async.nextTick(resolve);
    }, this);
};

/**
 * @private
 * @param {Element} item
 * @return {dj.models.AccordionItemModel}
 */
dj.components.AccordionComponent.prototype.parseItem_ = function(item)
{
    var id = goog.ui.IdGenerator.getInstance().getNextUniqueId();
    var header = goog.dom.getElementByClass('header', item);
    var content = goog.dom.getElementByClass('content', item);
    var model = new dj.models.AccordionItemModel(id, item, header, content);

    goog.dom.dataset.set(header, 'id', id);

    this.getHandler().listen(header, goog.events.EventType.CLICK,
        this.handleHeaderClick_);

    model.active = goog.dom.classlist.contains(model.parent,
        dj.components.AccordionComponent.ACTIVE_CLASS);

    return model;
};

/**
 * @private
 * @param {goog.events.BrowserEvent} event
 */
dj.components.AccordionComponent.prototype.handleHeaderClick_ = function(event)
{
    var header = /** @type {Element} */ (event.currentTarget);
    var id = goog.dom.dataset.get(header, 'id');
    var item = this.items_.get(id);

    this.toggleItem_(item);
};

/**
 * @param {dj.models.AccordionItemModel} item
 */
dj.components.AccordionComponent.prototype.toggleItem_ = function(item)
{
    this.items_.forEach(function(model){
        goog.dom.classlist.enable(
            model.parent,
            dj.components.AccordionComponent.ACTIVE_CLASS,
            model.active = model.id == item.id && !model.active
        );
    });
};