goog.provide('dj.ext.models.DropdownModel');

/**
 * @constructor
 * @param {string} name
 * @param {string} content
 * @param {Element} element
 */
dj.ext.models.DropdownModel = function(name, content, element)
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