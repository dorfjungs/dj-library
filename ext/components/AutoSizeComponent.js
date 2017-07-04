goog.provide('dj.ext.components.AutoSizeComponent');

// goog
goog.require('goog.asserts');

// dj
goog.require('dj.sys.components.AbstractComponent');

/**
 * @constructor
 * @extends {dj.sys.components.AbstractComponent}
 */
dj.ext.components.AutoSizeComponent = function()
{
	dj.ext.components.AutoSizeComponent.base(this, 'constructor');
};

goog.inherits(
	dj.ext.components.AutoSizeComponent,
	dj.sys.components.AbstractComponent
);

/** @export @inheritDoc */
dj.ext.components.AutoSizeComponent.prototype.ready = function()
{
	return this.baseReady(dj.ext.components.AutoSizeComponent, function(resolve, reject){
		goog.async.nextTick(function(){
			this.setContentSize_();
			resolve();
		}, this);
	});
};

/** @export @inheritDoc */
dj.ext.components.AutoSizeComponent.prototype.init = function()
{
	return this.baseInit(dj.ext.components.AutoSizeComponent, function(resolve, reject){
		this.listenResize();
		resolve();
	});
};

/** @inheritDoc */
dj.ext.components.AutoSizeComponent.prototype.handleResize = function()
{
    dj.ext.components.AutoSizeComponent.base(this, 'handleResize');

    goog.async.nextTick(this.setContentSize_, this);
};

/**
 * @private
 */
dj.ext.components.AutoSizeComponent.prototype.setContentSize_ = function()
{
    var endHeight = 0;
    var endWidth = 0;

    goog.array.forEach(goog.dom.getChildren(this.getElement()), function(child){
    	var size = goog.style.getSize(child);

        endHeight += size.height;
        endWidth += size.width;
    });

    if (!this.getConfig('ignore-height')) {
    	goog.style.setStyle(this.getElement(), 'height', endHeight + 'px');
	}

    if (!this.getConfig('ignore-width')) {
    	goog.style.setStyle(this.getElement(), 'width', endWidth + 'px');
    }
};