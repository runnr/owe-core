"use strict";

const expect = require("expect.js");

const Binding = require("../src/Binding");

describe("Binding", () => {
	describe(".isBound()", () => {
		it("should return true for objects that were bound", () => {
			const boundObject = Binding.bind(null, () => undefined, () => undefined),
				boundFunction = Binding.bind(() => undefined, () => undefined, () => undefined);

			expect(Binding.isBound(boundObject)).to.be(true);
			expect(Binding.isBound(boundFunction)).to.be(true);
		});

		it("should return false for everything that was not bound", () => {
			expect(Binding.isBound(null)).to.be(false);
			expect(Binding.isBound(undefined)).to.be(false);
			expect(Binding.isBound({})).to.be(false);
			expect(Binding.isBound(true)).to.be(false);
			expect(Binding.isBound(3)).to.be(false);
			expect(Binding.isBound("test")).to.be(false);
			expect(Binding.isBound(() => undefined)).to.be(false);
			expect(Binding.isBound(Symbol("test"))).to.be(false);
		});
	});

	describe(".getBinding()", () => {
		it("should return the Binding object for the given object", () => {
			const object = {};

			Binding.bind(object, () => undefined, () => undefined);
			expect(Binding.getBinding(object)).to.be.a(Binding);

			expect(Binding.getBinding(null)).to.be(undefined);
			expect(Binding.getBinding(undefined)).to.be(undefined);
			expect(Binding.getBinding({})).to.be(undefined);
			expect(Binding.getBinding(true)).to.be(undefined);
			expect(Binding.getBinding(3)).to.be(undefined);
			expect(Binding.getBinding("test")).to.be(undefined);
			expect(Binding.getBinding(() => undefined)).to.be(undefined);
			expect(Binding.getBinding(Symbol("test"))).to.be(undefined);
		});
	});

	describe(".bind()", () => {
		const bindingFunction = Binding.bind.bind(Binding);

		it("can be used to bind to an object by calling bind", () => {
			expect(Binding.isBound(Binding.bind({}, () => undefined, () => undefined))).to.be.ok();
		});

		it("only binds objects, functions and null", () => {
			expect(bindingFunction).withArgs(undefined, () => undefined, () => undefined).to.throwError();
			expect(bindingFunction).withArgs("test", () => undefined, () => undefined).to.throwError();
			expect(bindingFunction).withArgs(false, () => undefined, () => undefined).to.throwError();
			expect(bindingFunction).withArgs(Symbol("test"), () => undefined, () => undefined).to.throwError();

			expect(bindingFunction).withArgs(null, () => undefined, () => undefined).not.to.throwError();
			expect(bindingFunction).withArgs(() => undefined, () => undefined, () => undefined).not.to.throwError();
			expect(bindingFunction).withArgs({}, () => undefined, () => undefined).not.to.throwError();
			expect(bindingFunction).withArgs([], () => undefined, () => undefined).not.to.throwError();
		});

		it("requires a router and a closer function", () => {
			expect(bindingFunction).withArgs({}).to.throwError();
			expect(bindingFunction).withArgs({}, () => undefined).to.throwError();
			expect(bindingFunction).withArgs({}, undefined, () => undefined).to.throwError();
			expect(bindingFunction).withArgs({}, [], []).to.throwError();
			expect(bindingFunction).withArgs({}, {}, {}).to.throwError();
			expect(bindingFunction).withArgs({}, "a", "b").to.throwError();
			expect(bindingFunction).withArgs({}, true, true).to.throwError();
			expect(bindingFunction).withArgs({}, 4, 11).to.throwError();
		});

		describe("type parameter", () => {
			it("should be optional and 'normal' by default", () => {
				expect(Binding.getBinding(Binding.bind({}, () => undefined, () => undefined)).type).to.be(Binding.types.normal);
			});

			it("when 'normal': only accepts unbound objects", () => {
				const object = {};

				expect(bindingFunction).withArgs(object, () => undefined, () => undefined).not.to.throwError();
				expect(bindingFunction).withArgs(object, () => undefined, () => undefined).to.throwError();
			});

			it("when 'rebind': accepts all objects and rebinds them if neccessary", () => {
				const object = {};

				expect(bindingFunction).withArgs(object, () => undefined, () => undefined, Binding.types.rebind).not.to.throwError();
				expect(bindingFunction).withArgs(object, () => undefined, () => undefined, Binding.types.rebind).not.to.throwError();
			});

			it("when 'clone': binds to a new object that behaves as if it were the original object in Apis", () => {
				const object = {
					a: 1
				};

				expect(bindingFunction).withArgs(object, () => undefined, () => undefined).not.to.throwError();
				expect(Binding.isBound(object)).to.be(true);

				let clone;
				const router = function() {
					expect(this.value).to.be(object);

					return this.value;
				};

				expect(() => clone = Binding.bind(object, router, () => undefined, Binding.types.clone)).not.to.throwError();
				expect(Binding.isBound(clone)).to.be(true);
				expect(Object.getPrototypeOf(clone)).to.be(null);
				expect(clone.object).to.be(object);

				const binding = Binding.getBinding(clone);

				let clone2;

				expect(() => clone2 = Binding.bind(object, binding.router, () => undefined, Binding.types.clone)).not.to.throwError();

				const binding2 = Binding.getBinding(clone2);

				return Promise.all([
					binding.route([], {}).then(result => expect(result).to.be(clone)),
					binding2.route([], {}).then(result => expect(result).to.be(clone2))
				]);
			});
		});
	});

	describe(".unbind()", () => {
		it("unbinds bound objects and returns them", () => {
			const o = {};

			const a = Binding.bind(o, () => undefined, () => undefined);

			expect(a).to.be(o);
			expect(Binding.isBound(o)).to.be.ok();

			const b = Binding.unbind(o);

			expect(b).to.be(o);
			expect(Binding.isBound(o)).not.to.be.ok();

			const c = Binding.bind(o, () => undefined, () => undefined);

			expect(c).to.be(o);
			expect(Binding.isBound(o)).to.be.ok();
		});

		it("just returns unbound objects and data", () => {
			const o = Object.freeze({}),
				f = () => undefined,
				s = Symbol();

			expect(Binding.unbind(o)).to.be(o);
			expect(Binding.unbind(true)).to.be(true);
			expect(Binding.unbind("test")).to.be("test");
			expect(Binding.unbind(5.5)).to.be(5.5);
			expect(Binding.unbind(s)).to.be(s);
			expect(Binding.unbind(f)).to.be(f);
		});

	});

	const object = {
		the: "object"
	};
	const route = ["a", "b", "c"];
	const data = "ein test";
	const origin = {};
	const router = function(pData) {
		expect(this.value).to.be(object);
		expect(this.route).to.eql(route);
		expect(this.type).to.be("route");
		expect(this.binding).to.be(binding);
		expect(this.origin).to.be(origin);
		expect(data).to.be(pData);

		return "result";
	};
	const closer = function(pData) {
		expect(this.value).to.be(object);
		expect(this.route).to.eql(route);
		expect(this.type).to.be("close");
		expect(this.binding).to.be(binding);
		expect(this.origin).to.be(origin);
		expect(data).to.be(pData);

		return "result";
	};
	const binding = Binding.getBinding(Binding.bind(object, router, closer));

	describe("#router", () => {
		it("should contain the assigned router", () => {
			expect(binding.router).to.be(router);
		});
	});

	describe("#closer", () => {
		it("should contain the assigned closer", () => {
			expect(binding.closer).to.be(closer);
		});
	});

	describe("#type", () => {
		it("should contain the type used at Binding creation", () => {
			expect(Binding.getBinding(Binding.bind({}, () => undefined, () => undefined, Binding.types.normal)).type).to.be(Binding.types.normal);
			expect(Binding.getBinding(Binding.bind({}, () => undefined, () => undefined, Binding.types.clone)).type).to.be(Binding.types.clone);
			expect(Binding.getBinding(Binding.bind({}, () => undefined, () => undefined, Binding.types.rebind)).type).to.be(Binding.types.rebind);
		});
	});

	describe("#target", () => {
		it("should always contain the binding target object", () => {
			const o = {},
				oBound = Binding.bind(o, () => undefined, () => undefined, Binding.types.normal);

			expect(Binding.getBinding(oBound).target).to.be(o);
			expect(oBound).to.be(o);

			const p = o,
				pBound = Binding.bind(o, () => undefined, () => undefined, Binding.types.rebind);

			expect(Binding.getBinding(pBound).target).to.be(p);
			expect(pBound).to.be(p);

			const q = {},
				qBound = Binding.bind(q, () => undefined, () => undefined, Binding.types.clone);

			expect(Binding.getBinding(qBound).target).to.be(q);
			expect(qBound).not.to.be(q);
		});
	});

	describe("#route()", () => {
		it("should call .router() bound to a State with the given route and the given data as parameter", () => {
			expect(binding.route(route, origin, data)).to.be("result");
		});
	});

	describe("#close()", () => {
		it("should call .closer() bound to a State with the given route and the given data as parameter", () => {
			expect(binding.close(route, origin, data)).to.be("result");
		});
	});

});
