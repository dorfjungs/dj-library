goog.provide('dj.models.OverlayModel');

/**
 * @constructor
 * @param {Element} trigger
 * @param {string} url
 * @param {string=} optPushStateUrl
 * @param {string=} optAllowPushState
 * @param {string=} optAllowJumpback
 */
dj.models.OverlayModel = function(trigger, url, optPushStateUrl, optAllowPushState, optAllowJumpback)
{
    /**
     * The trigger element
     * which initiates the
     * actions
     *
     * @private
     * @type {Element}
     */
    this.trigger_ = trigger;

    /**
     * Url the send the request
     * to
     *
     * @private
     * @type {string}
     */
    this.url_ = url;

    /**
     * This url is used to set in
     * address bar as history push.
     *
     * @private
     * @type {string}
     */
    this.pushStateUrl_ = optPushStateUrl || '';

    /**
     * Determinates if the
     * pushstateurl should
     * be used
     *
     * @private
     * @type {boolean}
     */
    this.allowPushState_ = optAllowPushState && optAllowPushState == 'false' ? false : true;

    /**
     * Detemerminates if the
     * user will jump back to
     * this model if the
     * overlay was closed
     *
     * @private
     * @type {boolean}
     */
    this.allowJumpback_ = optAllowJumpback && optAllowJumpback == 'false' ? false : true;

    /**
     * Cached content from
     * the previous use
     *
     * @type {string}
     * @private
     */
    this.content_ = '';
};

/**
 * @return {boolean}
 */
dj.models.OverlayModel.prototype.hasContent = function()
{
    return this.content_ != '';
};

/**
 * @param {string} content
 */
dj.models.OverlayModel.prototype.setContent = function(content)
{
    this.content_ = content;
};

/**
 * @return {string}
 */
dj.models.OverlayModel.prototype.getContent = function()
{
    return this.content_;
};

/**
 * @return {string}
 */
dj.models.OverlayModel.prototype.getUrl = function()
{
    return this.url_;
};

/**
 * @return {Element}
 */
dj.models.OverlayModel.prototype.getTrigger = function()
{
    return this.trigger_;
};

/**
 * @return {boolean}
 */
dj.models.OverlayModel.prototype.hasPushStateUrl = function()
{
    return this.pushStateUrl_ != '';
};

/**
 * @return {string}
 */
dj.models.OverlayModel.prototype.getPushStateUrl = function()
{
    return this.pushStateUrl_;
};

/**
 * @return {boolean}
 */
dj.models.OverlayModel.prototype.getAllowPushState = function()
{
    return this.allowPushState_;
};

/**
 * @return {boolean}
 */
dj.models.OverlayModel.prototype.getAllowJumpback = function()
{
    return this.allowJumpback_;
};