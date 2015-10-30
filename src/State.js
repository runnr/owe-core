/**
 * @module State
 */
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
			value: {
				enumerable: true,
				value
			},
			route: {
				enumerable: true,
				value: route.slice(0)
			},
			type: {
				enumerable: true,
				value: type
			},
			origin: {
				enumerable: true,
				value: origin
			},
			binding: {
				enumerable: true,
				value: binding
			},
			modified: {
				value: false
			}
		});

		Object.freeze(this);
	}

	static setBinding(val) {
		Binding = val;
		this.setBinding = undefined;
	}

	/**
	 * Returns the result of {@link Binding#value values} toString method. If there is no such method, Object.prototype.toString will be used instead.
	 * @return {string} String representation of this State.
	 */
	toString() {
		return (typeof this.value === "object" || typeof this.value === "function") && typeof this.value.toString === "function"
			? this.value.toString()
			: Object.prototype.toString.call(this.value);
	}

	/**
	 * Returns the result of {@link Binding#value values} valueOf mehod. If there is no such method, {@link Binding#value} will be returned instead.
	 * @return {any} Value of this State.
	 */
	valueOf() {
		return (typeof this.value === "object" || typeof this.value === "function") && typeof this.value.valueOf === "function"
			? this.value.valueOf()
			: this.value;
	}

	/**
	 * Returns a new State, that prototypically inherits from this State, but with another {@link Binding#value value}.
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

}

module.exports = State;
