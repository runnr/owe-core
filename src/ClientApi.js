/**
 * @module ClientApi
 */
"use strict";

const protocol = Symbol("protocol");
const route = Symbol("route");

/**
 * Represents an API node at a remote server.
 */
class ClientApi {

	/**
	 * @constructor
	 * @param {object} pProtocol The protocol object to be used for server communication.
	 * @param {any[]} pRoute The stack of routes that led to this ClientApi pointer.
	 */
	constructor(pProtocol, pRoute) {
		this[protocol] = pProtocol;
		this[route] = pRoute || [];
	}

	/**
	 * Routes the ClientApi via its protocol.
	 * @param {any} destination The destination to route to.
	 * @return {ClientApi} A new {@link ClientApi} for the object the routing function returned.
	 */
	route(destination) {
		const destinations = arguments.length > 1 ? [...arguments] : [destination];

		return new ClientApi(this[protocol], [...this[route], ...destinations]);
	}

	/**
	 * Closes the Api via its protocol.
	 * @param {any} [data=undefined] The data to close with.
	 * @return {Promise} A promise that resolves to the return value of the remote API.
	 */
	close(data) {
		try {
			return Promise.resolve(this[protocol].closer(this[route], data));
		}
		catch(err) {
			return Promise.reject(err);
		}
	}

	/**
	 * Shorthand for this.close().then().
	 * @param {function} success The success function.
	 * @param {function} fail The fail function.
	 * @return {Promise} Result of this.close().
	 */
	then(success, fail) {
		return this.close().then(success, fail);
	}

	/**
	 * Shorthand for this.close().catch().
	 * @param {function} fail The fail function.
	 * @return {Promise} Rejects if this.close() rejects.
	 */
	catch(fail) {
		return this.close().catch(fail);
	}

	/**
	 * @return {boolean} The connection state of the protocol this ClientApi uses.
	 */
	get connected() {
		return this[protocol].connected;
	}

	/**
	 * Observe connection changes of the protocol this ClientApi uses.
	 * @param {function} observer The observer to use.
	 * @return {undefined}
	 */
	observeProtocol(observer) {
		Object.observe(this[protocol], observer, ["connectedUpdate"]);
	}

	/**
	 * Removed connection observer from the protocol this ClientApi uses.
	 * @param {function} observer The observer to be removed.
	 * @return {undefined}
	 */
	unobserveProtocol(observer) {
		Object.unobserve(this[protocol], observer);
	}
}

module.exports = ClientApi;
