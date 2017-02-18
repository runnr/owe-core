"use strict";

const State = require("./State");

/**
 * The types of Bindings.
 * @memberof Binding
 * @enum {symbol}
 */
const types = {

	/**
	 * @ignore
	 */
	__proto__: null, // Set prototype to null.

	/**
	 * Only allow bindings to unbound objects; throw otherwise. Afterwards the given object is bound ({@link Binding.isBound} will return true).
	 */
	normal: Symbol("normal"),

	/**
	 * Allow any object or function as binding target. Afterwards the given object will not be changed: Unbound if it was unbound before, bound (with the same {@link Binding}) if it was bound before.
	 */
	clone: Symbol("clone"),

	/**
	 * Allow any object or function as binding target. Afterwards the given object is bound ({@link Binding.isBound} will return true). If the object was bound before, the old binding is overridden.
	 */
	rebind: Symbol("rebind")
};

const bindingMap = new WeakMap();

/**
 * Stores the router and closer functions of bound objects.
 */
class Binding {

	/**
	 * @constructor
	 * @param {object|function} object The object that will be bound.
	 * @param {function} router The router function for this binding.
	 * @param {function} closer The closer function for this binding.
	 * @param {types} [type=Binding.types.normal] The {@linkplain Binding.types type of binding} to be used.
	 * @param {object} clonedObject Only set if type=clone. Object the given object is a clone of.
	 */
	constructor(object, router, closer, type, clonedObject) {
		if(type === undefined)
			type = types.normal;
		else if(type !== types.normal && type !== types.clone && type !== types.rebind)
			throw new Error(`Given type '${type}' is invalid.`);

		if(typeof object !== "object" && typeof object !== "function")
			throw new TypeError(`Only objects and functions can be bound. Got '${object}'.`);

		if(Binding.isBound(object) && type !== types.rebind && type !== types.clone)
			throw new Error(`Object '${object}' is already bound.`);

		if(typeof router !== "function" || typeof closer !== "function")
			throw new TypeError("Bindings require a router and a closer function or another binding to copy.");

		if(typeof router[types.clone] === "function")
			router = router[types.clone];

		const usedRouter = type === types.clone && clonedObject !== undefined ? function() {
			return Promise.resolve(router.apply(this, arguments))
				.then(result => result === object ? clonedObject : result);
		} : router;

		if(usedRouter !== router)
			usedRouter[types.clone] = router;

		Object.assign(this, {

			/**
			 * Stores the router function.
			 * @alias Binding#router
			 * @type {function}
			 */
			router: usedRouter,

			/**
			 * Stores the closer function.
			 * @alias Binding#closer
			 * @type {function}
			 */
			closer,

			/**
			 * The object that is bound by this Binding.
			 * @alias Binding#target
			 * @type {object}
			 */
			target: object,

			/**
			 * The binding type that was used to create this Binding.
			 * @alias Binding#type
			 * @type {Binding.types}
			 */
			type
		});
	}

	/**
	 * Returns whether the given object is bound (it has a Binding associated to it).
	 * @static
	 * @param {any} object The object to check. This can be any value. The method will always return `false` for non-objects.
	 * @return {boolean} `true` if the object is bound. `false` if not.
	 */
	static isBound(object) {
		return object && (typeof object === "object" || typeof object === "function") && bindingMap.has(object) || false;
	}

	/**
	 * Returns the Binding object of the given object if it is bound.
	 * undefined elsewise.
	 * @param {object} object The object that should be checked.
	 * @return {?Binding} The binding of object.
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

Binding.types = types;

function traverse(type, typeName) {
	return function(route, origin, data) {
		const state = new State(this.target, route, typeName, origin, this);

		return this[type].call(state, data, state);
	};
}

Object.assign(Binding.prototype,

	/**
	 * @lends Binding#
	 */
	{

		/**
		 * Calls {@link Binding#router} with a {@link State} object as its this-context.
		 * @method
		 * @param {any[]} route The value for {@link State#route}
		 * @param {object} origin The value for {@link State#origin}
		 * @param {any} destination The destination to route to.
		 */
		route: traverse("router", "route"),

		/**
		 * Calls {@link Binding#closer} with a {@link State} object as its this-context.
		 * @method
		 * @param {any[]} route The value for {@link State#route}
		 * @param {object} origin The value for {@link State#origin}
		 * @param {any} destination The data to close with.
		 */
		close: traverse("closer", "close")
	});

State.setBinding(Binding);

module.exports = Binding;
