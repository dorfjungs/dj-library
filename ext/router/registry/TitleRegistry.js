goog.provide('dj.ext.router.registry.TitleRegistry');

// goog
goog.require('goog.structs.Map');
goog.require('goog.string');

/**
 * @constructor
 */
dj.ext.router.registry.TitleRegistry = function()
{
    /**
     * @private
     * @type {Map<string, string>}
     */
    this.titleMap_ = new Map();
};

/**
 * @public
 * @param {string} url
 * @param {string} title
 */
dj.ext.router.registry.TitleRegistry.prototype.register = function(url, title)
{
    this.titleMap_.set(url, title);
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @return {boolean}
 */
dj.ext.router.registry.TitleRegistry.prototype.match = function(route)
{
    return !goog.string.isEmptyOrWhitespace(this.getUrl(route));
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @return {string}
 */
dj.ext.router.registry.TitleRegistry.prototype.getTitle = function(route)
{
    return this.titleMap_.get(this.getUrl(route));
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @return {string}
 */
dj.ext.router.registry.TitleRegistry.prototype.getUrl = function(route)
{
    var urls = Array.from(this.titleMap_.keys());

    for (var i = 0, len = urls.length; i < len; i++) {
        if (route.match(urls[i])) {
            return urls[i];
        }
    }

    return '';
};