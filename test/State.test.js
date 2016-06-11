"use strict";

const expect = require("chai").expect;

const State = require("../src/State");
const Binding = require("../src/Binding");

describe("State", () => {
	const value = {
		test: "Hello World.",
		value: 42,
		toString() {
			return this.test.toLowerCase();
		},
		valueOf() {
			return this.value;
		}
	};

	const route = ["route", "of", "this", "state"];
	const origin = {};
	const binding = Binding.getBinding(Binding.bind(null, () => undefined, () => undefined));
	const state = new State(value, route, "great", origin, binding);

	it("should be frozen", () => {
		expect(Object.isFrozen(state)).to.equal(true);
	});

	describe("#value", () => {
		it("should contain the assigned value", () => {
			expect(state.value).to.equal(value);
		});

		it("should be read-only", () => {
			expect(() => state.value = {
				something: "else"
			}).to.throw();
		});
	});

	describe("#route", () => {
		it("should be an array", () => {
			expect(() => new State(value, "NOPE", "great", origin, binding))
				.to.throw(TypeError, "State route has to be an array.");
			expect(state.route).to.be.an("array");
		});

		it("should contain the assigned route", () => {
			expect(state.route).to.deep.equal(route);
		});

		it("should be read-only", () => {
			expect(() => state.route = ["something", "else"]).to.throw();
		});
	});

	describe("#type", () => {
		it("should contain the assigned type", () => {
			expect(state.type).to.equal("great");
		});

		it("should be read-only", () => {
			expect(() => state.type = "derp").to.throw();
		});
	});

	describe("#origin", () => {
		it("should contain the assigned origin", () => {
			expect(state.origin).to.deep.equal(origin);
		});
		it("should be read-only", () => {
			expect(() => state.origin = "derp").to.throw();
		});
	});

	describe("#binding", () => {
		it("should be a Binding", () => {
			expect(() => new State(value, route, "great", origin, "NOPE"))
				.to.throw(TypeError, "State binding has to be an instance of Binding.");
			expect(state.binding).to.be.an.instanceof(Binding);
		});

		it("should contain the assigned binding", () => {
			expect(state.binding).to.equal(binding);
		});

		it("should be read-only", () => {
			expect(() => state.binding = null).to.throw();
		});
	});

	describe("#setValue()", () => {
		it("should require an object propery descriptor", () => {
			expect(() => state.setValue(null)).to.throw();

			expect(() => state.setValue(undefined)).to.throw();

			expect(() => state.setValue(true)).to.throw();

			expect(() => state.setValue(3)).to.throw();

			expect(() => state.setValue("test")).to.throw();

			expect(() => state.setValue(() => undefined)).to.throw();

			expect(() => state.setValue({})).not.to.throw();

		});

		it("should not change the state itself", () => {
			state.setValue({
				value: "test"
			});
			expect(state.value).to.equal(value);
		});

		it("should return a new State with the new value", () => {
			const modified = state.setValue({
				value: "test"
			});

			expect(modified).not.to.equal(state);
			expect(modified).to.be.an.instanceof(State);
			expect(modified.value).to.equal("test");
		});

		it("should return a state with a .modified flag", () => {
			expect(state.modified).to.equal(false);
			expect(state.setValue({}).modified).to.equal(true);
		});

		it("can not make .value writable", () => {
			expect(() => {
				const modified = state.setValue({
					value: null,
					writable: true
				});

				modified.value = "test";
			}).to.throw();
		});

		it("can define getter & setter functions for .value", () => {
			let hiddenValue = null;

			const modified = state.setValue({
				get() {
					return hiddenValue;
				},
				set(val) {
					hiddenValue = val;
				}
			});

			modified.value = "test";
			expect(modified.value).to.equal("test");
		});
	});
});
