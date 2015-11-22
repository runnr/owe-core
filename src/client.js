/**
 * @module owe-core/client
 */
"use strict";

const ClientApi = require("./ClientApi");

/**
 * Creates a {@link ClientApi} for the given protocol handler.
 * @param {object} protocol The protocol that should be wrapped.
 * @param {function} [protocol.init] Called after the {@link ClientApi} that will be returned is prepared. Gets the Protocol object it was assigned to as its context.
 * @param {function} protocol.closer Called if a route is closed by the used. It gets the route array as its first parameter and the close data as its second. The protocol object the closer was assigned to is used as the context.
 * @return {ClientApi} A ClientApi for protocol.
 */
function client(protocol) {
	if(!protocol || typeof protocol !== "object")
		throw new TypeError("owe ClientApi protocols have to be objects.");

	if(typeof protocol.closer !== "function")
		throw new TypeError("owe ClientApi proctols have to offer a closer function.");

	if(protocol.init && typeof protocol.init !== "function")
		throw new TypeError("owe ClientApi protocols have to offer an init function.");

	let connected = false;
	const observers = new Set();

	protocol = Object.assign({
		get connected() {
			return connected;
		},
		set connected(value) {
			if(typeof value !== "boolean")
				throw new TypeError("Protocol connection state has to be boolean.");

			if(value === connected)
				return;

			connected = value;
			for(const observer of observers)
				observer(connected);
		},
		observe(observer) {
			if(typeof observer !== "function")
				throw new TypeError("Protocol connection state observers have to be functions.");

			observers.add(observer);
		},
		unobserve(observer) {
			observers.delete(observer);
		}
	}, protocol);

	if(protocol.init)
		protocol.init();

	return new ClientApi(protocol);
}

Object.assign(client, {
	isApi(api) {
		return api && typeof api === "object" && api instanceof ClientApi || false;
	}
});

module.exports = client;
