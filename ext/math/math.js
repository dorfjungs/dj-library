goog.provide('dj.ext.math');

/**
 * @param {number} value
 * @param {number} inStart
 * @param {number} inEnd
 * @param {number} outMin
 * @param {number} outMax
 */
dj.ext.math.mapRange = function(value, inStart, inEnd, outMin, outMax)
{
    return outMin + (outMax - outMin) / (inEnd - inStart) * (value - inStart);
};