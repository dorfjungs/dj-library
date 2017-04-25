goog.provide('dj.ext.router.events.ContentEvent');

// dj.ext
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {string} type
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 * @param {dj.ext.router.parsers.ContentParser} parser
 * @extends {goog.events.Event}
 */
dj.ext.router.events.ContentEvent = function(type, fromRoute, toRoute, parser)
{
	dj.ext.router.events.ContentEvent.base(this, 'constructor', type);

	/**
	 * @public
	 * @type {dj.ext.router.models.RouteModel}
	 */
	this.fromRoute = fromRoute;

	/**
	 * @public
	 * @type {dj.ext.router.models.RouteModel}
	 */
	this.toRoute = toRoute;

	/**
	 * @public
	 * @type {dj.ext.router.parsers.ContentParser}
	 */
	this.parser = parser;
};

goog.inherits(
	dj.ext.router.events.ContentEvent,
	goog.events.Event
);

/**
 * @enum {string}
 */
dj.ext.router.events.ContentEvent.EventType = {
	CONTENT_LOAD: 'dj.ext.router.content_load',
	CONTENT_LOADED: 'dj.ext.router.content_loaded',
	CONTENT_READY: 'dj.ext.router.content_ready',
	CONTENT_PARSED: 'dj.ext.router.content_parsed',
	CONTENT_SETTLED: 'dj.ext.router.content_settled',
	CONTENT_CANCELED: 'dj.ext.router.content_canceled'
};