goog.provide('dj.ext.components.StickyElementComponent');

// dj
goog.require('dj.sys.components.AbstractComponent');

// goog
goog.require('goog.math.Coordinate');

/**
 * @constructor
 * @extends {dj.sys.components.AbstractComponent}
 */
dj.ext.components.StickyElementComponent = function()
{
    dj.ext.components.StickyElementComponent.base(this, 'constructor');

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.elementOffset_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.stickedPosition_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {Element}
     */
    this.ghostElement_ = null;

    /**
     * @private
     * @type {boolean}
     */
    this.sticking_ = false;
};

goog.inherits(
    dj.ext.components.StickyElementComponent,
    dj.sys.components.AbstractComponent
);

/**
 * @const
 * @type {string}
 */
dj.ext.components.StickyElementComponent.prototype.ACTIVE_CLASS = 'stuck';

/**
 * @inheritDoc
 */
dj.ext.components.StickyElementComponent.prototype.init = function()
{
    return this.baseInit(dj.ext.components.StickyElementComponent, function(resolve, reject){
        // Listen for scroll
        this.listenScroll();

        // Create ghost element
        this.createGhost_();

        // Initial calls
        this.updateOffset_();

        // Resolve on next tick
        goog.async.nextTick(function(){
            this.checkPosition_();
            resolve();
        }, this);
    });
};

/**
 * @inheritDoc
 */
dj.ext.components.StickyElementComponent.prototype.handleScroll = function()
{
    dj.ext.components.StickyElementComponent.base(this, 'handleScroll');

    this.checkPosition_();
};

/**
 * @private
 */
dj.ext.components.StickyElementComponent.prototype.checkPosition_ = function()
{
    var position = this.getScrollPosition();

    if (this.sticking_) {
        if (position.y <= this.elementOffset_.y) {
            this.unstickElement_();
        }
    }
    else if (position.y >= this.elementOffset_.y) {
        this.stickElement_(position);
    }
};

/**
 * @param {goog.math.Coordinate} position
 * @private
 */
dj.ext.components.StickyElementComponent.prototype.stickElement_ = function(position)
{
    this.sticking_ = true;
    this.stickedPosition_ = position;
    this.enableGhost_(this.sticking_);

    goog.dom.classlist.enable(this.getElement(),
        dj.ext.components.StickyElementComponent.prototype.ACTIVE_CLASS, this.sticking_);

    goog.style.setStyle(this.getElement(), {
        'position': 'fixed',
        'top': 0
    });
};

/**
 * @private
 */
dj.ext.components.StickyElementComponent.prototype.unstickElement_ = function()
{
    this.sticking_ = false;
    this.enableGhost_(this.sticking_);

    goog.dom.classlist.enable(this.getElement(),
        dj.ext.components.StickyElementComponent.prototype.ACTIVE_CLASS, this.sticking_);

    goog.style.setStyle(this.getElement(), {
        'position': '',
        'top': ''
    });
};

/**
 * @private
 */
dj.ext.components.StickyElementComponent.prototype.createGhost_ = function()
{
    this.ghostElement_ = this.getElement().cloneNode(true);

    goog.style.setStyle(this.ghostElement_, {
        'visiblity': 'hidden',
        'display': 'none'
    });

    goog.dom.insertSiblingBefore(this.ghostElement_, this.getElement());
};

/**
 * @param {boolean} enable
 */
dj.ext.components.StickyElementComponent.prototype.enableGhost_ = function(enable)
{
    goog.style.setStyle(this.ghostElement_, {
        'visiblity': 'hidden',
        'display': enable ? '' : 'none'
    });
};

/**
 *
 */
dj.ext.components.StickyElementComponent.prototype.updateOffset_ = function()
{
    this.elementOffset_ = goog.style.getPageOffset(this.getElement());
};