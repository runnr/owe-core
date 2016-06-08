"use strict";

const proxyMap = new WeakMap();
const passthrough = Symbol("passthrough");

const target = Object.freeze(Object.setPrototypeOf(() => {}, null));

function proxify(api) {
	if(!api || typeof api !== "object")
		throw new TypeError("Only objects can be proxified.");

	if(typeof api.route !== "function" || typeof api.close !== "function")
		throw new TypeError("Only objects that offer an owe Api interface can be proxified.");

	const passthroughSet = api[passthrough];

	const proxy = new Proxy(target, {
		get(target, property) {
			if(passthroughSet && passthroughSet.has(property) && property in api)
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

function revert(proxy) {
	return proxyMap.get(proxy);
}

module.exports = Object.assign(proxify, { revert, passthrough });
