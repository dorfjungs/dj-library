goog.provide('dj.math');

/**
 * @param {number} value
 * @param {number} inStart
 * @param {number} inEnd
 * @param {number} outMin
 * @param {number} outMax
 */
dj.math.mapRange = function(value, inStart, inEnd, outMin, outMax)
{
    return outMin + (outMax - outMin) / (inEnd - inStart) * (value - inStart);
};