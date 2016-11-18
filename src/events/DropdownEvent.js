goog.provide('dj.events.DropdownEvent');

// goog
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {string} type
 * @extends {goog.events.Event}
 */
dj.events.DropdownEvent = function(type, model)
{
	goog.base(this, type);

	/**
	 * @type {dj.models.DropdownModel}
	 */
	this.model = model;
};

goog.inherits(
	dj.events.DropdownEvent,
	goog.events.Event
);

/**
 * @enum {string}
 */
dj.events.DropdownEvent.EventType = {
	CHANGE: 'dj.events.DropdownEvent.EventType.CHANGE'
};