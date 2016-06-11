"use strict";

const expect = require("expect.js");

const Binding = require("../src/Binding");
const State = require("../src/State");
const Api = require("../src/Api");
const exposed = require("../src/exposed");
const proxify = require("../src/proxify");

describe("Api", () => {
	const symb = Symbol("test");
	const original = {
		a: 1,
		b: 2,
		c: 3,
		x: Binding.bind({
			[symb]: {}
		}, function(r) {
			return this.value[r];
		}, function() {
			return this.value;
		})
	};
	const object = Binding.bind(original, function(a, state) {
		expect(state).to.be.a(State);
		expect(this).to.be(state);
		expect(state.value).to.be(original);

		if(a === "error")
			throw new Error("error");

		if(a instanceof Error)
			throw a;

		if(a === "x")
			return state.value.x;

		return a && state.value;
	}, function(key, state) {
		expect(state).to.be.a(State);
		expect(this).to.be(state);
		expect(state.value).to.be(original);

		if(key instanceof Error)
			throw key;

		if(!(key in state.value))
			throw new Error(`${key} not found.`);

		return state.value[key];
	}, Binding.types.clone);
	const api = new Api(object);

	describe("#route()", () => {
		it("should return an Api", () => {
			expect(api.route()).to.be.an(Api);
		});

		it("should return a navigatable Api when appropriate",
			() => api.route(true).close("a").then(data => expect(data).to.be(1)));

		it("should return a dead Api when used inappropriately", () => Promise.all([
			api.route().close("a").then(() => {
				expect().fail("This routing was invalid.");
			}, err => {
				expect(err.type).to.be("route");
				expect(err.route).to.eql([undefined]);
			}),
			api.route("x").route(symb).then(() => {
				expect().fail("This routing was invalid.");
			}, err => {
				expect(err.message).to.be("Object at position 'x/Symbol(test)' is not exposed.");
				expect(exposed.isExposed(err)).to.be.ok();
				expect(err.type).to.be("route");
				expect(err.route).to.eql(["x", symb]);
			}),
			api.route("error").then(() => {
				expect().fail("This routing was invalid.");
			}, err => {
				return api.route(err);
			}).then(() => {
				expect().fail("This routing was invalid.");
			}, err => {
				expect(err.message).to.be("error");
				expect(err.type).to.be("route");
				expect(err.route).to.eql(["error"]);
			})
		]));

		it("should accept multiple routes to route in sequence",
			() => api.route(1, 2, 3).route(4).route(5, 6).then(() => {
				expect().fail("This request should have thrown.");
			}, err => {
				expect(err.message).to.be("undefined not found.");
				expect(err.route).to.eql([1, 2, 3, 4, 5, 6]);
			}));
	});

	describe("#close()", () => {
		it("should return a Promise", () => {
			expect(api.close()).to.be.a(Promise);
		});

		it("should resolve with the requested data", () => Promise.all([
			api.close("a"),
			api.close("b"),
			api.close("c")
		]).then(result => {
			expect(result).to.eql([1, 2, 3]);
		}));

		it("should reject incorrect requests", () => {
			let error;

			return Promise.all([
				api.close("d").then(() => {
					expect().fail("This request should have thrown.");
				}, err => {
					expect(err.type).to.be("close");
					expect(err.route).to.eql([]);
					expect(err.data).to.be("d");
					expect(err.message).to.be("d not found.");
				}),
				api.close("d").then(() => {
					expect().fail("This request should have thrown.");
				}, err => {
					return api.close(err);
				}).then(() => {
					expect().fail("This request should have thrown.");
				}, err => {
					expect(err.type).to.be("close");
					expect(err.route).to.eql([]);
					expect(err.data).to.be("d");
					expect(err.message).to.be("d not found.");
				}),
				api.then(() => {
					expect().fail("This request should have thrown.");
				}, err => {
					expect(err.type).to.be("close");
					expect(err.route).to.eql([]);
					expect(err.data).to.be(undefined);
					expect(err.message).to.be("undefined not found.");
				}),
				api.catch(err => {
					throw err;
				}).then(() => {
					expect().fail("This request should have thrown.");
				}, err => {
					expect(err.type).to.be("close");
					expect(err.route).to.eql([]);
					expect(err.data).to.be(undefined);
					expect(err.message).to.be("undefined not found.");
				}),
				new Api(Binding.bind({}, () => {}, () => {
					error = new Error("A frozen error.");
					error.type = "foo";
					Object.defineProperty(error, "route", {
						get: () => {
							return undefined;
						},
						set: () => {
							throw new Error("Another error.");
						}
					});
					throw Object.freeze(error);
				})).then(() => {
					expect().fail("This request should have thrown.");
				}, err => {
					expect(err).to.be(error);
				})
			]);
		});
	});

	describe("#origin()", () => {
		const foo = {},
			test = Object.create(null);

		const api = new Api(Binding.bind(original, function(a, state) {
			expect(state).to.be.a(State);
			expect(this).to.be(state);
			expect(state.value).to.be(original);
			expect([test, foo]).to.contain(state.origin);

			return a && this.value;
		}, function(key, state) {
			expect(state).to.be.a(State);
			expect(this).to.be(state);
			expect(state.value).to.be(original);
			expect(state.origin).to.be(test);

			if(!(key in state.value))
				throw new Error(`${key} not found.`);

			return state.value[key];
		}, Binding.types.clone)).origin(test);

		it("should return an Api", () => {
			expect(api.origin(test)).to.be.an(Api);
		});

		it("should require objects", () => {
			expect(() => api.origin("test")).to.throwError();
		});

		it("should hand given origin to all close() and route() calls from that point on", () => {
			return Promise.all([
				api.close("a"),
				api.route(true).close("b"),
				api.origin(foo).route(true).route(true).origin(test).close("c")
			]);
		});
	});

	describe("#object", () => {
		it("should contain a promise to the object this api exposes",
			() => api.object.then(apiObject => expect(apiObject).to.be(original)));
	});

	describe("#proxified", () => {
		it("should be a proxified version of this Api", () => {
			expect(proxify.revert(api.proxified)).to.be(api);
		});
	});
});
