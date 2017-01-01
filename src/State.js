"use strict";

// Binding will be late bound, due to circular dependency between it and State.
let Binding;

/**
 * Stores the state of an API request.
 */
class State {

	/**
	 * @constructor
	 * @param {object|function} value The object of the {@link Api} that created this {@link State}.
	 * @param {any[]} route The route of the {@link Api} that created this {@link State}.
	 * @param {string} type "route" if this State is given to a router and "close" if given to a closer.
	 * @param {object} origin The origin of the {@link Api} that created this {@link State}.
	 * @param {Binding} binding The {@link Binding} object of {@link State#value}. This has to be set, because {@link Binding~types.clone clone}-Bindings do not bind the object itself and thus hold no reference to the {@link Binding}.
	 */
	constructor(value, route, type, origin, binding) {
		if(!Array.isArray(route))
			throw new TypeError("State route has to be an array.");
		if(!Binding || !(binding instanceof Binding))
			throw new TypeError("State binding has to be an instance of Binding.");

		Object.defineProperties(this, {

			/**
			 * The `value` that was given to the constructor.
			 * @name State#value
			 * @type {object|function}
			 */
			value: {
				enumerable: true,
				value
			},

			/**
			 * The `route` that was given to the constructor.
			 * @name State#route
			 * @type {any[]}
			 */
			route: {
				enumerable: true,
				value: route.slice(0)
			},

			/**
			 * The `type` ("route" or "close") that was given to the constructor.
			 * @name State#type
			 * @type {string}
			 */
			type: {
				enumerable: true,
				value: type
			},

			/**
			 * The `origin` that was given to the constructor.
			 * @name State#origin
			 * @type {object}
			 */
			origin: {
				enumerable: true,
				value: origin
			},

			/**
			 * The `binding` that was given to the constructor.
			 * @name State#binding
			 * @type {object}
			 */
			binding: {
				enumerable: true,
				value: binding
			},

			/**
			 * `true` if this state was the result of a {@link State#setValue} call, `false` elsewise.
			 * @name State#modified
			 * @type {boolean}
			 */
			modified: {
				value: false
			}
		});

		Object.freeze(this);
	}

	/**
	 * Returns a new state, that prototypically inherits from this State, but with another {@link Binding#value value}.
	 * The new state will get an active {@link State#modified} flag.
	 * @param {any} valueDescriptor The new value.
	 * @return {State} A new State.
	 */
	setValue(valueDescriptor) {
		if(typeof valueDescriptor !== "object" || valueDescriptor == null)
			throw new TypeError("State valueDescriptor has to be an object.");
		valueDescriptor.enumerable = true;

		return Object.freeze(Object.create(this, {
			value: valueDescriptor,
			modified: {
				value: true
			}
		}));
	}

	static setBinding(val) {
		Binding = val;
	}
}

module.exports = State;
