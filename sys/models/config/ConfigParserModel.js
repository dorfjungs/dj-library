goog.provide('dj.sys.models.config.ConfigParserModel');

// dj
goog.require('dj.sys.models.config.AbstractConfigModel');
goog.require('dj.sys.parsers.ElementConfigParser');
goog.require('dj.sys.parsers.ElementsConfigParser');

/**
 * @struct
 * @constructor
 * @param {Array<dj.sys.parsers.AbstractConfigParser>=} optParsers
 * @extends {dj.sys.models.config.AbstractConfigModel}
 */
dj.sys.models.config.ConfigParserModel = function(optParsers)
{
	dj.sys.models.config.ConfigParserModel.base(this, 'constructor');

	/**
	 * @public
	 * @type {Array<dj.sys.parsers.AbstractConfigParser>}
	 */
	this.parsers = optParsers || [
		new dj.sys.parsers.ElementConfigParser(),
		new dj.sys.parsers.ElementsConfigParser()
	];
};

goog.inherits(
	dj.sys.models.config.ConfigParserModel,
	dj.sys.models.config.AbstractConfigModel
);