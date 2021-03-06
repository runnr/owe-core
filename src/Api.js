"use strict";

const helpers = require("@owe/helpers");

const Binding = require("./Binding");
const exposed = require("./exposed");
const proxify = require("./proxify");

const errorHandled = Symbol("errorHandled");
const boundObject = Symbol("boundObject");
const object = Symbol("object");
const route = Symbol("route");
const origin = Symbol("origin");

/**
 * Represents an API node.
 */
class Api {
	/**
	 * @constructor
	 * @param {object|Promise} pObject A bound object this {@link Api} should be exposing. This may also be a Promise that resolves to a bound object.
	 * @param {any[]} pRoute The stack of routes that led to this Api pointer.
	 * @param {object} [pOrigin={}] An object to use as the origin of this Api.
	 */
	constructor(pObject, pRoute, pOrigin) {
		this[route] = pRoute || [];
		this[origin] = pOrigin || {};

		this[boundObject] = Promise.resolve(pObject).then(object => {
			if(!Binding.isBound(object))
				throw new exposed.TypeError(`Object at position '${this[route].map(helpers.string.convert).join("/")}' is not exposed.`);

			return object;
		}).catch(errorHandlers.route.bind(this));
	}

	/**
	 * Setter for the origin of an {@link Api}.
	 * @param {object} value The origin object for the new Api node.
	 * @return {Api} Returns a new {@link Api} with the given origin, that points at the same exposed object.
	 */
	origin(value) {
		if(!value || typeof value !== "object")
			throw new TypeError("Api origin has to be an object.");

		const clone = Object.create(this);

		clone[origin] = value;

		return clone;
	}

	/**
	 * Routes the Api according to its exposed objects routing function.
	 * @param {...any} destination The destination to route to. Multiple destinations are handled like a chained {@link Api#route} call.
	 * @return {Api} A new {@link Api} for the object the routing function returned.
	 */
	route(destination) {
		let api = new Api(
			this[boundObject].then(object => Binding.getBinding(object).route(
				this[route],
				this[origin],
				destination
			)),
			[...this[route], destination],
			this[origin]
		);

		for(let i = 1; i < arguments.length; i++)
			api = api.route(arguments[i]);

		return api;
	}

	/**
	 * Closes the Api with the closing function of its exposed object.
	 * @param {any} [data=undefined] The data to close with.
	 * @return {Promise} A promise that resolves to the return value of the closing function.
	 */
	close(data) {
		return this[boundObject].then(object => {
			return Binding.getBinding(object).close(this[route], this[origin], data);
		}).catch(errorHandlers.close.bind(this, data));
	}

	/**
	 * Shorthand for `this.close().then()`.
	 * @param {function} success The success function.
	 * @param {function} fail The fail function.
	 * @return {Promise} Result of `this.close()`.
	 */
	then(success, fail) {
		return this.close().then(success, fail);
	}

	/**
	 * Shorthand for `this.close().catch()`.
	 * @param {function} fail The fail function.
	 * @return {Promise} Rejects if `this.close()` rejects.
	 */
	catch(fail) {
		return this.close().catch(fail);
	}

	/**
	 * Resolves to the exposed object this {@link Api} is pointing to.
	 * @type {Promise}
	 */
	get object() {
		return this[object]
			|| (this[object] = this[boundObject].then(object => Binding.getBinding(object).target));
	}

	/**
	 * A proxy that returns `this.route(A).proxified` when property `A` is accessed and `this.close(B)` when called with parameter `B`.
	 * `then` and `catch` however are directly passed through.
	 * @type {Proxy}
	 */
	get proxified() {
		return proxify(this);
	}
}

Api.prototype[proxify.passthrough] = new Set(["then", "catch"]);

const errorHandlers = {
	/**
	 * Handle routing errors.
	 * @private
	 * @param {Error} err Error.
	 * @return {undefined}
	 */
	route(err) {
		try {
			if(!(errorHandled in err)) {
				err.type = "route";
				err.route = this[route];
				err[errorHandled] = true;
			}
		}
		finally {
			throw err;
		}
	},

	/**
	 * Handle closing errors.
	 * @private
	 * @param {any} data The data that caused err.
	 * @param {Error} err Error.
	 * @return {undefined}
	 */
	close(data, err) {
		try {
			if(!(errorHandled in err)) {
				err.type = "close";
				err.route = this[route];
				err.data = data;
				err[errorHandled] = true;
			}
		}
		finally {
			throw err;
		}
	}
};

module.exports = Api;
