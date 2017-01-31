goog.provide('dj.ext.events.DropdownEvent');

// goog
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {string} type
 * @extends {goog.events.Event}
 */
dj.ext.events.DropdownEvent = function(type, model)
{
	goog.base(this, type);

	/**
	 * @type {dj.models.DropdownModel}
	 */
	this.model = model;
};

goog.inherits(
	dj.ext.events.DropdownEvent,
	goog.events.Event
);

/**
 * @enum {string}
 */
dj.ext.events.DropdownEvent.EventType = {
	CHANGE: 'dj.ext.events.DropdownEvent.EventType.CHANGE'
};