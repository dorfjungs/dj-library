goog.provide('dj.math.Range');

// dj
goog.require('dj.math');

// goog
goog.require('goog.math.Range');

/**
 * @constructor
 * @param {number} a
 * @param {number} b
 * @extends {goog.math.Range}
 */
dj.math.Range = function(a, b)
{
    goog.base(this, a, b);
};

goog.inherits(
    dj.math.Range,
    goog.math.Range
);

/**
 * @param {number} value
 * @param {dj.math.Range} range
 * @return number
 */
dj.math.Range.prototype.mapTo = function(value, range)
{
    return dj.math.mapRange(value, this.start, this.end, range.start, range.end);
};