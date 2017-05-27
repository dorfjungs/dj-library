goog.provide('dj.ext.math.Range');

// dj
goog.require('dj.ext.math');

// goog
goog.require('goog.math.Range');

/**
 * @constructor
 * @param {number} a
 * @param {number} b
 * @extends {goog.math.Range}
 */
dj.ext.math.Range = function(a, b)
{
    dj.ext.math.Range.base(this, 'constructor', a, b);
};

goog.inherits(
    dj.ext.math.Range,
    goog.math.Range
);

/**
 * @param {number} value
 * @param {dj.ext.math.Range} range
 * @return number
 */
dj.ext.math.Range.prototype.mapTo = function(value, range)
{
    return dj.ext.math.mapRange(value, this.start, this.end, range.start, range.end);
};