goog.provide('dj.ext.router.models.ContentModel');

/**
 * @struct
 * @constructor
 * @param {Node} fragment
 */
dj.ext.router.models.ContentModel = function(fragment)
{
	/**
	 * @public
	 * @type {Node}
	 */
	this.fragment = fragment;
};