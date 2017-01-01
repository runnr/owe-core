/**
 * @module owe-core
 */

"use strict";

/**
 * @exports owe-core
 *//**
 * Binds the given object to a `binding` object that wraps a router and/or closer function. **This usually is the preferred way to call this function.**
 * @param {object} object The object that should be bound.
 * @param {object} binding An object containing a router and closer function.
 * @param {function} [binding.router] The router that should be used.
 * @param {function} [binding.closer] The closer that should be used.
 * @param {Binding.type|string} [type="normal"] The way `object` should be bound. Valid values are "normal", "rebind", "clone" or their respective symbol representations found in {@link Binding.types}.
 * @return {object} The object that was bound. If type was "clone" the bound cloned object is returned, object elsewise.
 *//**
 * Binds the given object to a router and closer function.
 * @param {object} object The object that should be bound.
 * @param {?function} router The router that should be used.
 * @param {?function} closer The closer that should be used.
 * @param {Binding.type|string} [type="normal"] The way `object` should be bound. Valid values are "normal", "rebind", "clone" or their respective symbol representations found in {@link Binding.types}.
 * @return {object} The object that was bound. If type was "clone" the bound cloned object is returned, object elsewise.
 */
function owe(object, router, closer, type) {
	// An object of the form { router:[function], closer:[function] } can be used as well:
	if(router && typeof router === "object") {
		if(closer !== undefined && arguments.length === 3) {
			type = closer;
			closer = undefined;
		}
		else if(closer !== undefined)
			throw new TypeError("Invalid binding functions.");

		closer = router.closer;
		router = router.router;
	}

	router = typeof router !== "function" ? () => {} : router;
	closer = typeof closer !== "function" ? () => {} : closer;

	if(type !== undefined && typeof type !== "symbol") {
		if(type && typeof type === "object" && "valueOf" in type)
			type = type.valueOf();

		if(typeof type === "string" && type in Binding.types)
			type = Binding.types[type];
		else if(typeof type === "boolean")
			type = type ? Binding.types.clone : Binding.types.normal;
		else
			throw new TypeError("Invalid binding type.");
	}

	return Binding.bind(object, router, closer, type);
}

module.exports = owe;

const Api = require("./Api");
const Binding = require("./Binding");
const State = require("./State");

const client = require("./client");
const expose = require("./exposed");
const resource = require("./resource");
const proxify = require("./proxify");

Object.assign(owe, {

	/**
	 * A reference to the {@link client} module.
	 */
	client,

	/**
	 * A reference to the {@link State} class.
	 */
	State,

	/**
	 * A reference to the {@link Binding} class.
	 */
	Binding,

	/**
	 * A reference to the {@link resource} module.
	 */
	resource,

	/**
	 * A reference to the {@link expose} module.
	 */
	expose,

	/**
	 * A reference to the {@link expose} module.
	 */
	exposed: expose,

	/**
	 * Checks whether a given object is exposed.
	 * @method
	 */
	isExposed: expose.isExposed,

	/**
	 * Checks whether a given object is bound.
	 * @method
	 */
	isBound: Binding.isBound.bind(Binding), // kek.

	/**
	 * A reference to the {@link proxify} function.
	 */
	proxify,

	/**
	 * An alias for the {@link proxify.revert} function.
	 */
	unproxify: proxify.revert,

	/**
	 * Behaves like {@link owe} but return an Api instead of the given object. If `object` is already bound, router, closer and type are optional and `api()` simply returns an {@link Api} instance for the given object.
	 * @param {object} object The object that should be bound.
	 * @param {function} router The router that should be used.
	 * @param {function} closer The closer that should be used.
	 * @param {Binding.type|string} [type=Binding.types.normal] The way `object` should be bound. Valid values are "normal", "rebind", "clone" or their respective symbol representations found in {@link Binding.types}.
	 * @return {Api} An {@link Api} instance for `object`.
	 */
	api(object, router, closer, type) {
		if(!Binding.isBound(object) || arguments.length > 1)
			object = owe(object, router, closer, type);

		return new Api(object);
	},

	/**
	 * Returns whether the given object is an {@link Api} instance.
	 * @param {any} api The api to check. This can be any value. The method will always return false for non-objects.
	 * @return {boolean} `true` if `api` is an {@link Api}. `false` if not.
	 */
	isApi(api) {
		return api && typeof api === "object" && api instanceof Api || false;
	}
});
