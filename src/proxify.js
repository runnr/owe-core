"use strict";

const proxyMap = new WeakMap();

const target = Object.freeze(Object.setPrototypeOf(() => {}, null));

/**
 * A proxy for an object that has a Set for this property key will pass through all properties with a name that can be found in that Set.
 * Used internally to define the properties of Apis that should be passed through (i. e. "then" and "catch").
 * @memberof proxify
 * @private
 * @type symbol
 */
const passthrough = Symbol("passthrough");

/**
 * A proxy that returns `this.route(A).proxified` when property `A` is accessed and `this.close(B)` when called with parameter `B`.
 * `then` and `catch` however are directly passed through.
 * Returns a proxy for the given Api. Accessing a property `A` of it will return `proxify(api.route(A))`. Calling the proxy with an argument `B` will return `api.close(B)`.
 * When the properties `then` and `catch` of the proxy are accessed they will not be translated into `route` calls but passed through to `api` directly instead.
 * @module proxify
 * @param {Api|ClientApi} api The Api to proxify.
 * @return {Proxy} A proxified version of the given Api.
 */
function proxify(api) {
	if(!api || typeof api !== "object")
		throw new TypeError("Only objects can be proxified.");

	if(typeof api.route !== "function" || typeof api.close !== "function")
		throw new TypeError("Only objects that offer an owe Api interface can be proxified.");

	const passthroughSet = api[passthrough];

	const proxy = new Proxy(target, {
		get(target, property) {
			if(typeof property === "symbol" || passthroughSet && passthroughSet.has(property) && property in api)
				return typeof api[property] === "function" ? api[property].bind(api) : api[property];

			return proxify(api.route(property));
		},

		apply(target, context, args) {
			return api.close(args[0]);
		},

		deleteProperty() {
			return false;
		}
	});

	proxyMap.set(proxy, api);

	return proxy;
}

/**
 * Reverts the proxify function.
 * @memberof proxify
 * @param {Proxy} proxy A proxy that was returned by {@link proxify}.
 * @return {Api|ClientApi} The Api that was used to construct `proxy`.
 */
function revert(proxy) {
	return proxyMap.get(proxy);
}

module.exports = Object.assign(proxify, { revert, passthrough });
