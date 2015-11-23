/**
 * @module owe-core
 */
"use strict";

const Api = require("./Api");
const Binding = require("./Binding");
const State = require("./State");

const client = require("./client");

const resourceMap = new WeakMap();

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

	router = typeof router !== "function" ? () => undefined : router;
	closer = typeof closer !== "function" ? () => undefined : closer;

	if(type !== undefined && typeof type !== "symbol") {

		if(typeof type === "object" && type !== null && "valueOf" in type)
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

Object.assign(owe, {

	/**
	 * A reference to the {@link client} namespace.
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
	 * Checks whether a given object is bound.
	 * @method
	 */
	isBound: Binding.isBound.bind(Binding), // kek.

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
	},

	/**
	 * Attaches resource data to a given object. The resource data is usually used to store metadata (e. g. a content type) for an object.
	 * @param {!object|!function} object The object that should get the given resource data.
	 * @param {!object} data The resource data that should be attached to `object`.
	 * @return {!object|!function} The given object.
	 */
	resource(object, data) {
		if(data === undefined)
			return resourceMap.get(object) || {};

		if((typeof object !== "object" || object === null) && typeof object !== "function" || resourceMap.has(object))
			throw new TypeError("Could not transform given object into a resource.");

		if(typeof data !== "object" || data === null)
			throw new TypeError("Resource data has to be an object.");

		resourceMap.set(object, data);

		return object;
	}
});

module.exports = owe;
