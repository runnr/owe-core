/**
 * @module Binding
 */
"use strict";

const State = require("./State");

/**
 * The types of Bindings.
 * @constant {object}
 * @namespace Binding~types
 * @property {symbol} normal Only allow bindings to unbound objects; throw otherwise. Afterwards the given object is bound ({@link Binding.isBound} will return true).
 * @property {symbol} clone Allow any object or function as binding target. Afterwards the given object will not be changed: Unbound if it was unbound before, bound (with the same {@link Binding}) if it was bound before.
 * @property {symbol} rebind Allow any object or function as binding target. Afterwards the given object is bound ({@link Binding.isBound} will return true). If the object was bound before, the old binding is overridden.
 */
const types = {
	normal: Symbol("normal"),
	clone: Symbol("clone"),
	rebind: Symbol("rebind")
};

Object.freeze(types);

const bindingMap = new WeakMap();

/**
 * Stores the router and closer functions of bound objects.
 * @class
 */
class Binding {

	/**
	 * @param {object|function} object The object that will be bound.
	 * @param {function} router The router function for this binding.
	 * @param {function} closer The closer function for this binding.
	 * @param {types} [type={@linkcode Binding~types.normal}] The {@link Binding~types type of binding} to be used.
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

		const usedRouter = type === types.clone && clonedObject !== undefined ? function() {
			return Promise.resolve(router.apply(this, arguments)).then(function(result) {
				return result === object ? clonedObject : result;
			});
		} : router;

		usedRouter[types.clone] = router;

		/**
		 * Stores the router function.
		 * @member {function} router
		 */
		this.router = usedRouter;

		/**
		 * Stores the closer function.
		 * @member {function} closer
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
			 * @member {Binding~types} type
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
		return object && (typeof object === "object" || typeof object === "function") && bindingMap.has(object) || false;
	}

	/**
	 * Returns the Binding object of the given object if it is bound.
	 * undefined elsewise.
	 * @param {object} object The object that should be checked.
	 * @return {Binding|undefined} The binding of object.
	 */
	static getBinding(object) {
		return object && (typeof object === "object" || typeof object === "function") && bindingMap.get(object) || undefined;
	}

	/**
	 * Binds an unbound object.
	 * @static
	 * @param {?object|function} object The object to be bound. If the given object (strictly) equals null, a new empty object will be used as the binding target.
	 * @param {!function} router The router function to be used for the binding.
	 * @param {!function} closer The closer function to be used fro the binding.
	 * @param {symbol} [type=Binding.types.normal] The type of binding to be used.
	 * @return {object|function} The object that was given. Now bound. If null was given, the newly created empty bound object will be returned.
	 */
	static bind(object, router, closer, type) {

		const target = object === null || type === types.clone ? Object.create(null, {
				object: {
					value: object
				}
			}) : object;

		bindingMap.set(target, new this(object, router, closer, type, target));

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
			bindingMap.delete(object);

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

/**
 * @name Binding.types
 * @borrows Binding~types as types
 */
Object.defineProperty(Binding, "types", {
	value: types
});

if(State.setBinding)
	State.setBinding(Binding);

module.exports = Binding;
