/**
 * @module owe-core/Binding
 */
"use strict";

var State = require("./State");

/**
 * The types of Bindings.
 * @constant {object}
 * @namespace
 */
const types = {
	normal: Symbol("normal"),
	clone: Symbol("clone"),
	rebind: Symbol("rebind")
};

Object.freeze(types);

/**
 * Stores the router and closer functions of bound objects.
 */
class Binding {

	/**
	 * @param {object|function} object The object that will be bound.
	 * @param {function} router The router function for this binding.
	 * @param {function} closer The closer function for this binding.
	 * @param {symbol} [type={@linkcode Binding.types.normal}] The {@link Binding.types type of binding} to be used.
	 */
	constructor(object, router, closer, type, clonedObject) {

		if(typeof type !== "symbol")
			type = types.normal;

		if(typeof object !== "object" && typeof object !== "function")
			throw new TypeError("Only objects and functions can be bound. Got '" + object + "'.");
		if(Binding.isBound(object) && type !== types.rebind && type !== types.clone)
			throw new Error("Object '" + object + "' is already bound.");

		if(router instanceof Binding) {
			closer = router.closer;
			router = router.router[types.clone] || router.router;
		}
		else if(typeof router !== "function" || typeof closer !== "function")
			throw new TypeError("Bindings require a router and a closer function or another binding to copy.");

		var usedRouter = type === types.clone && clonedObject !== undefined ? function() {
			return Promise.resolve(router.apply(this, arguments)).then(function(result) {
				return result === object ? clonedObject : result;
			});
		} : router;

		usedRouter[types.clone] = router;

		/**
		 * Stores the router function.
		 * @type {function}
		 */
		this.router = usedRouter;

		/**
		 * Stores the closer function.
		 * @type {function}
		 */
		this.closer = closer;

		Object.defineProperties(this, {
			/**
			 * The object that is bound by this Binding.
			 * @member {object} target
			 */
			target: {
				value: object
			},
			/**
			 * The binding type that was used to create this Binding.
			 * @member {symbol} type
			 */
			type: {
				value: type
			}
		});
	}

	/**
	 * Returns whether the given object is bound (it has a Binding associated to it).
	 * @static
	 * @param {any} object The object to check. This can actually be any value. The method will always return false for non-objects.
	 * @return {boolean} true if the object is bound. false if not.
	 */
	static isBound(object) {
		return (typeof object === "object" || typeof object === "function") && object !== null && Object.getOwnPropertyDescriptor(object, this.key) !== undefined && object[this.key] instanceof this;
	}

	/**
	 * Binds an unbound object. This will add a Binding.key symbol property to the given object.
	 * @static
	 * @param {?object|function} object The object to be bound. If the given object (strictly) equals null, a new empty object will be used as the binding target.
	 * @param {!function} router The router function to be used for the binding.
	 * @param {!function} closer The closer function to be used fro the binding.
	 * @param {symbol} [type=Binding.types.normal] The type of binding to be used.
	 * @return {object|function} The object that was given. Now bound. If null was given, the newly created empty bound object will be returned.
	 */
	static bind(object, router, closer, type) {

		var target = object === null || type === types.clone ? Object.create(null, {
				object: {
					value: object
				}
			}) : object,
			binding = new this(object, router, closer, type, target);

		Object.defineProperty(target, this.key, {
			configurable: true,
			value: binding
		});

		return target;
	}

	/**
	 * Removes the binding of the given object.
	 * @static
	 * @param {any} object The bound object that should be unbound. If object is not bound, nothing happens.
	 * @return {any} Returns the object that was given. Now unbound.
	 */
	static unbind(object) {

		if(this.isBound(object))
			delete object[this.key];

		return object;

	}

}

function traverse(type) {
	return function(location, origin, data) {
		return this[type].call(new State(this.target, location, origin, this), data);
	};
}

Object.defineProperties(Binding.prototype, {
	/**
	 * Calls {@link Binding#router} with a {@link State} object as its this-context.
	 * @name Binding#route
	 * @method
	 * @param {any[]} location The value for {@link State#location}
	 * @param {object} origin The value for {@link State#origin}
	 * @param {any} destination The destination to route to.
	 */
	route: {
		value: traverse("router")
	},
	/**
	 * Calls {@link Binding#closer} with a {@link State} object as its this-context.
	 * @name Binding#close
	 * @method
	 * @param {any[]} location The value for {@link State#location}
	 * @param {object} origin The value for {@link State#origin}
	 * @param {any} destination The data to close with.
	 */
	close: {
		value: traverse("closer")
	}
});

Object.defineProperties(Binding, {
	key: {
		value: Symbol("binding")
	},
	types: {
		value: types
	}
});

if(State.setBinding)
	State.setBinding(Binding);

module.exports = Binding;
