"use strict";

const resourceMap = new WeakMap();

/**
 * Attaches resource data to a given object. The resource data is usually used to store metadata (e. g. a content type) for an object.
 * @module resource
 * @param {!object|!function} object The object that should get the given resource data.
 * @param {!object} data The resource data that should be attached to `object`.
 * @return {!object|!function} The given object.
 */
function resource(object, data) {
	if(data === undefined)
		return resourceMap.get(object) || {};

	if(!object || typeof object !== "object" && typeof object !== "function" || resourceMap.has(object))
		throw new TypeError("Could not transform given object into a resource.");

	if(!data || typeof data !== "object")
		throw new TypeError("Resource data has to be an object.");

	resourceMap.set(object, data);

	return object;
}

module.exports = resource;
