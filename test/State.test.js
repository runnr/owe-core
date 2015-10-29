"use strict";

const expect = require("expect.js");

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
		},
		route = ["route", "of", "this", "state"],
		origin = {},
		binding = Binding.getBinding(Binding.bind(null, () => undefined, () => undefined)),
		state = new State(value, route, "great", origin, binding);

	it("should be frozen", () => {
		expect(Object.isFrozen(state)).to.be.ok();
	});

	it("should adapt values valueOf method", () => {
		expect(state - 2).to.be(40);
	});

	it("should adapt values toString method", () => {
		expect(`I say '${String(state)}'!`).to.be("I say 'hello world.'!");
	});

	describe("#value", () => {
		it("should contain the assigned value", () => {
			expect(state.value).to.be(value);
		});

		it("should be read-only", () => {
			expect(() => state.value = {
				something: "else"
			}).to.throwError();
		});
	});

	describe("#route", () => {
		it("should be an array", () => {
			expect(() => new State(value, "NOPE", "great", origin, binding))
				.to.throwError(new TypeError("State route has to be an array."));
			expect(state.route).to.be.an("array");
		});

		it("should contain the assigned route", () => {
			expect(state.route).to.eql(route);
		});

		it("should be read-only", () => {
			expect(() => state.route = ["something", "else"]).to.throwError();
		});
	});

	describe("#type", () => {
		it("should contain the assigned type", () => {
			expect(state.type).to.be("great");
		});

		it("should be read-only", () => {
			expect(() => state.type = "derp").to.throwError();
		});
	});

	describe("#origin", () => {
		it("should contain the assigned origin", () => {
			expect(state.origin).to.eql(origin);
		});
		it("should be read-only", () => {
			expect(() => state.origin = "derp").to.throwError();
		});
	});

	describe("#binding", () => {
		it("should be a Binding", () => {
			expect(() => new State(value, route, "great", origin, "NOPE"))
				.to.throwError(new TypeError("State binding has to be an instance of Binding."));
			expect(state.binding).to.be.a(Binding);
		});

		it("should contain the assigned binding", () => {
			expect(state.binding).to.be(binding);
		});

		it("should be read-only", () => {
			expect(() => state.binding = null).to.throwError();
		});
	});

	describe("#setValue()", () => {
		it("should require an object propery descriptor", () => {
			expect(() => state.setValue(null)).to.throwError();

			expect(() => state.setValue(undefined)).to.throwError();

			expect(() => state.setValue(true)).to.throwError();

			expect(() => state.setValue(3)).to.throwError();

			expect(() => state.setValue("test")).to.throwError();

			expect(() => state.setValue(() => undefined)).to.throwError();

			expect(() => state.setValue({})).not.to.throwError();

		});

		it("should not change the state itself", () => {
			state.setValue({
				value: "test"
			});
			expect(state.value).to.be(value);
		});

		it("should return a new State with the new value", () => {
			const modified = state.setValue({
				value: "test"
			});

			expect(modified).not.to.be(state);
			expect(modified).to.be.a(State);
			expect(modified.value).to.be("test");
		});

		it("should return a state with a .modified flag", () => {
			expect(state.modified).to.be(false);
			expect(state.setValue({}).modified).to.be(true);
		});

		it("can not make .value writable", () => {
			expect(() => {
				const modified = state.setValue({
					value: null,
					writable: true
				});

				modified.value = "test";
			}).to.throwError();
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
			expect(modified.value).to.be("test");
		});
	});
});
