goog.provide('dj.ext.components.AccordionComponent');

// goog
goog.require('goog.ui.IdGenerator');
goog.require('goog.structs.Map');
goog.require('goog.Promise');

// dj
goog.require('dj.sys.components.AbstractComponent');
goog.require('dj.ext.models.AccordionItemModel');

/**
 * @constructor
 * @extends {dj.sys.components.AbstractComponent}
 */
dj.ext.components.AccordionComponent = function()
{
    dj.ext.components.AccordionComponent.base(this, 'constructor');

    /**
     * @private
     * @type {goog.structs.Map<string, dj.ext.models.AccordionItemModel>}
     */
    this.items_ = new goog.structs.Map();
};

goog.inherits(
    dj.ext.components.AccordionComponent,
    dj.sys.components.AbstractComponent
);

/**
 * @type {string}
 */
dj.ext.components.AccordionComponent.ACTIVE_CLASS = 'active';

/**
 * @inheritDoc
 */
dj.ext.components.AccordionComponent.prototype.init = function()
{
    return this.baseInit(dj.ext.components.AccordionComponent, function(resolve, reject){
        var items = this.getElementsByClass('item');

        goog.array.forEach(items, function(item){
            var model = this.parseItem_(item);
            this.items_.set(model.id, model);
        }, this);

        goog.async.nextTick(resolve);
    });
};

/**
 * @private
 * @param {Element} item
 * @return {dj.ext.models.AccordionItemModel}
 */
dj.ext.components.AccordionComponent.prototype.parseItem_ = function(item)
{
    var id = goog.ui.IdGenerator.getInstance().getNextUniqueId();
    var header = goog.dom.getElementByClass('header', item);
    var content = goog.dom.getElementByClass('content', item);
    var model = new dj.ext.models.AccordionItemModel(id, item, header, content);

    goog.dom.dataset.set(header, 'id', id);

    this.getHandler().listen(header, goog.events.EventType.CLICK,
        this.handleHeaderClick_);

    model.active = goog.dom.classlist.contains(model.parent,
        dj.ext.components.AccordionComponent.ACTIVE_CLASS);

    return model;
};

/**
 * @private
 * @param {goog.events.BrowserEvent} event
 */
dj.ext.components.AccordionComponent.prototype.handleHeaderClick_ = function(event)
{
    var header = /** @type {Element} */ (event.currentTarget);
    var id = goog.dom.dataset.get(header, 'id');
    var item = this.items_.get(id);

    this.toggleItem_(item);
};

/**
 * @private
 * @param {dj.ext.models.AccordionItemModel} item
 */
dj.ext.components.AccordionComponent.prototype.toggleItem_ = function(item)
{
    this.items_.forEach(function(model){
        goog.dom.classlist.enable(
            model.parent,
            dj.ext.components.AccordionComponent.ACTIVE_CLASS,
            model.active = model.id == item.id && !model.active
        );
    });
};