goog.provide('dj.ext.router.events.RouteEvent');

// dj.ext
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {string} type
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 * @param {number} triggerType
 * @extends {goog.events.Event}
 */
dj.ext.router.events.RouteEvent = function(type, fromRoute, toRoute, triggerType)
{
	dj.ext.router.events.RouteEvent.base(this, 'constructor', type);

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
     * @type {number}
     */
    this.triggerType = triggerType;
};

goog.inherits(
	dj.ext.router.events.RouteEvent,
	goog.events.Event
);

/**
 * @enum {number}
 */
dj.ext.router.events.RouteEvent.TriggerType = {
    USER: 1,
    PROGRAMMATICALLY: 2
};

/**
 * @enum {string}
 */
dj.ext.router.events.RouteEvent.EventType = {
    ROUTE_FIRST: 'dj.ext.router.route_first',
	ROUTE_STARTED: 'dj.ext.router.route_started',
	ROUTE_ENDED: 'dj.ext.router.route_ended'
};