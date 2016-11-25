goog.provide('dj.components.StickyElementComponent');

// dj
goog.require('dj.components.BaseComponent');
goog.require('dj.providers.ResizeProvider');
goog.require('dj.providers.ScrollProvider');

// goog
goog.require('goog.math.Coordinate');

/**
 * @constructor
 * @extends {dj.components.BaseComponent}
 */
dj.components.StickyElementComponent = function()
{
    goog.base(this);

    /**
     * @private
     * @type {dj.providers.ResizeProvider}
     */
    this.resizeProvider_ = dj.providers.ResizeProvider.getInstance();

    /**
     * @private
     * @type {dj.providers.ScrollProvider}
     */
    this.scrollProvider_ = dj.providers.ScrollProvider.getInstance();

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
    dj.components.StickyElementComponent,
    dj.components.BaseComponent
);

/**
 * @const
 * @type {string}
 */
dj.components.BaseComponent.prototype.ACTIVE_CLASS = 'stuck';

/**
 * @inheritDoc
 */
dj.components.BaseComponent.prototype.init = function()
{
    return new goog.Promise(function(resolve, reject){
        // Create ghost element
        this.createGhost_();

        // Add listeners
        this.scrollProvider_.onScroll(this.checkPosition_, this);

        // Initial calls
        this.updateOffset_();

        // Resolve on next tick
        goog.async.nextTick(function(){
            this.checkPosition_(this.scrollProvider_.getScrollPosition());
            resolve();
        }, this);
    }, this);
};

/**
 * @param {goog.math.Coordinate} position
 * @private
 */
dj.components.BaseComponent.prototype.checkPosition_ = function(position)
{
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
dj.components.BaseComponent.prototype.stickElement_ = function(position)
{
    this.sticking_ = true;
    this.stickedPosition_ = position;
    this.enableGhost_(this.sticking_);

    goog.dom.classlist.enable(this.getElement(),
        dj.components.BaseComponent.prototype.ACTIVE_CLASS, this.sticking_);

    goog.style.setStyle(this.getElement(), {
        'position': 'fixed',
        'top': 0
    });
};

/**
 * @private
 */
dj.components.BaseComponent.prototype.unstickElement_ = function()
{
    this.sticking_ = false;
    this.enableGhost_(this.sticking_);

    goog.dom.classlist.enable(this.getElement(),
        dj.components.BaseComponent.prototype.ACTIVE_CLASS, this.sticking_);

    goog.style.setStyle(this.getElement(), {
        'position': '',
        'top': ''
    });
};

/**
 * @private
 */
dj.components.BaseComponent.prototype.createGhost_ = function()
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
dj.components.BaseComponent.prototype.enableGhost_ = function(enable)
{
    goog.style.setStyle(this.ghostElement_, {
        'visiblity': 'hidden',
        'display': enable ? '' : 'none'
    });
};

/**
 *
 */
dj.components.BaseComponent.prototype.updateOffset_ = function()
{
    this.elementOffset_ = goog.style.getPageOffset(this.getElement());
};