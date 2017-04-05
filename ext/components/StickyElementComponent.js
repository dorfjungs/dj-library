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
     * @type {goog.math.Size}
     */
    this.elementSize_ = new goog.math.Size(0, 0);

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.parentOffset_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {goog.math.Size}
     */
    this.parentSize_ = new goog.math.Size(0, 0);

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.startElementOffset_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.stickedPosition_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.userOffset_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {Element}
     */
    this.parentElement_ = null;

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

    /**
     * @private
     * @type {boolean}
     */
    this.stickingParentBottom_ = false;

    /**
     * @private
     * @type {boolean}
     */
    this.parentBoundsActive_ = false;
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
 * @const
 * @type {string}
 */
dj.ext.components.StickyElementComponent.prototype.BOUND_BOTTOM_CLASS = 'bound-bottom';

/** @inheritDoc */
dj.ext.components.StickyElementComponent.prototype.ready = function()
{
    return this.baseReady(dj.ext.components.StickyElementComponent, function(resolve, reject){
        this.parentBoundsActive_ = /** @type {boolean} */ (this.getConfig('parent-bounds'));
        this.userOffset_.y = /** @type {number} */ (parseInt(this.getConfig('offset-y'), 10) || 0);

        if (this.parentBoundsActive_) {
            this.parentElement_ = goog.dom.getParentElement(this.getElement());
        }

        // Create ghost element
        this.createGhost_();

        // Wait for next to if the ghost needs to be inserted
        goog.async.nextTick(resolve);
    });
};

/** @inheritDoc */
dj.ext.components.StickyElementComponent.prototype.init = function()
{
    return this.baseInit(dj.ext.components.StickyElementComponent, function(resolve, reject){
        // Listen for scroll
        this.listenScroll();
        this.listenResize();

        // Update offset position
        this.updateOffset_();

        // Resolve on next tick after checking the initial position
        goog.async.nextTick(function(){
            this.checkPosition_();
            resolve();
        }, this);
    });
};

/** @inheritDoc */
dj.ext.components.StickyElementComponent.prototype.handleScroll = function()
{
    dj.ext.components.StickyElementComponent.base(this, 'handleScroll');

    this.checkPosition_();
};

/** @inheritDoc */
dj.ext.components.StickyElementComponent.prototype.handleResize = function()
{
    dj.ext.components.StickyElementComponent.base(this, 'handleResize');

    this.updateOffset_();
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

    if (this.parentBoundsActive_) {
        var boundBottom = this.parentOffset_.y + this.parentSize_.height - this.elementSize_.height - this.userOffset_.y;

        if (!this.stickingParentBottom_) {
            if (position.y >= boundBottom) {
                this.boundElement_(position);
            }
        }
        else {
            if (position.y < boundBottom) {
                this.unboundElement_(position);
            }
        }
    }
};

/**
 * @private
 * @param {goog.math.Coordinate} position
 */
dj.ext.components.StickyElementComponent.prototype.boundElement_ = function(position)
{
    this.stickingParentBottom_ = true;

    goog.style.setStyle(this.getElement(), {
        'position': 'absolute',
        'bottom': '0',
        'left': '',
        'top': ''
    });

    goog.dom.classlist.enable(this.getElement(), dj.ext.components.StickyElementComponent.prototype.BOUND_BOTTOM_CLASS, this.stickingParentBottom_);
};

/**
 * @private
 * @param {goog.math.Coordinate} position
 */
dj.ext.components.StickyElementComponent.prototype.unboundElement_ = function(position)
{
    this.stickingParentBottom_ = false;
    this.stickElement_(position);

    goog.dom.classlist.enable(this.getElement(), dj.ext.components.StickyElementComponent.prototype.BOUND_BOTTOM_CLASS, this.stickingParentBottom_);
};

/**
 * @private
 * @param {goog.math.Coordinate} position
 */
dj.ext.components.StickyElementComponent.prototype.stickElement_ = function(position)
{
    this.sticking_ = true;
    this.stickedPosition_ = position;

    goog.dom.classlist.enable(this.getElement(),
        dj.ext.components.StickyElementComponent.prototype.ACTIVE_CLASS, this.sticking_);

    this.enableGhost_(this.sticking_);

    goog.style.setStyle(this.getElement(), 'position', 'fixed');

    if (this.parentBoundsActive_) {
        this.setPosition_(this.elementOffset_.x, this.startElementOffset_.y - this.parentOffset_.y + this.userOffset_.y);
    }
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
        'top': '',
        'left': ''
    });
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 */
dj.ext.components.StickyElementComponent.prototype.setPosition_ = function(x, y)
{
    goog.style.setStyle(this.getElement(), {
        'left': x + 'px',
        'top': y + 'px',
        'bottom': '',
        'right': ''
    });
};

/**
 * @private
 */
dj.ext.components.StickyElementComponent.prototype.createGhost_ = function()
{
    this.ghostElement_ = this.getElement().cloneNode(true);

    goog.style.setStyle(this.ghostElement_, {
        'visibility': 'hidden',
        'display': 'none'
    });

    goog.dom.classlist.enable(this.ghostElement_, 'sticky-ghost', true);
    goog.dom.insertSiblingBefore(this.ghostElement_, this.getElement());
};

/**
 * @private
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
 * @private
 */
dj.ext.components.StickyElementComponent.prototype.updateOffset_ = function()
{
    this.startElementOffset_ = goog.style.getPageOffset(this.ghostElement_);
    this.elementOffset_ = goog.style.getPageOffset(this.ghostElement_);
    this.elementSize_ = goog.style.getSize(this.getElement());

    this.elementOffset_.x -= this.userOffset_.x;
    this.elementOffset_.y -= this.userOffset_.y;

    if (this.parentElement_) {
        this.parentOffset_ = goog.style.getPageOffset(this.parentElement_);
        this.parentSize_ = goog.style.getSize(this.parentElement_);
    }

    if (this.sticking_ && !this.stickingParentBottom_) {
        this.stickElement_(this.getScrollPosition());
    }
};