goog.provide('dj.models.DropdownModel');

/**
 * @constructor
 * @param {string} name
 * @param {string} content
 * @param {Element} element
 */
dj.models.DropdownModel = function(name, content, element)
{
	/**
	 * @type {string}
	 */
	this.name = name;

	/**
	 * @type {string}
	 */
	this.content = content;

	/**
	 * @type {Element}
	 */
	this.element = element;
};