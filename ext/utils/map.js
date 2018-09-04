goog.provide('dj.ext.utils.map');

/**
 * @public
 * @template K, V
 * @param {(Map<K, V>|Array<Array<K|V>>|Object)=} optParams
 * @return {Map<K, V>}
 */
dj.ext.utils.map.create = function(optParams)
{
	const map = new Map(optParams instanceof Map ? optParams : []);

	if (optParams && !(optParams instanceof Map)) {
		if (goog.isObject(optParams) && !(optParams instanceof Array)) {
			for (const key in optParams) {
				map.set(key, optParams[key]);
			}
		} else {
			optParams.forEach(param => {
				map.set(param[0], param[1]);
			});
		}
	}

	return map;
};

/**
 * @public
 * @template K, V
 * @param {Map<K, V>} map
 * @return {Object}
 */
dj.ext.utils.map.toObject = function(map) 
{
	let obj = Object.create(null);

	map.forEach((value, key) => obj[key] = value);

    return obj;
};

/**
 * @public
 * @template K1, V1, K2, V2
 * @param {Map<K1, V2>} map1
 * @param {Map<K2, V2>|Object} map2
 */
dj.ext.utils.map.merge = function(map1, map2) 
{
	if (goog.isObject(map2) && !(map2 instanceof Map)) {
		for (const key in map2) {
			map1.set(key, map2[key]);
		}
	} else {
		map2.forEach((value, key) => map1.set(key, value));
	}
};