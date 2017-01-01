"use strict";

const expect = require("chai").expect;

const Binding = require("../src/Binding");

describe("Binding", () => {
	describe(".isBound()", () => {
		it("should return true for objects that were bound", () => {
			const boundObject = Binding.bind(null, () => {}, () => {});
			const boundFunction = Binding.bind(() => {}, () => {}, () => {});

			expect(Binding.isBound(boundObject)).to.equal(true);
			expect(Binding.isBound(boundFunction)).to.equal(true);
		});

		it("should return false for everything that was not bound", () => {
			expect(Binding.isBound(null)).to.equal(false);
			expect(Binding.isBound(undefined)).to.equal(false);
			expect(Binding.isBound({})).to.equal(false);
			expect(Binding.isBound(true)).to.equal(false);
			expect(Binding.isBound(3)).to.equal(false);
			expect(Binding.isBound("test")).to.equal(false);
			expect(Binding.isBound(() => {})).to.equal(false);
			expect(Binding.isBound(Symbol("test"))).to.equal(false);
		});
	});

	describe(".getBinding()", () => {
		it("should return the Binding object for the given object", () => {
			const object = {};

			Binding.bind(object, () => {}, () => {});
			expect(Binding.getBinding(object)).to.be.an.instanceof(Binding);

			expect(Binding.getBinding(null)).to.equal(undefined);
			expect(Binding.getBinding(undefined)).to.equal(undefined);
			expect(Binding.getBinding({})).to.equal(undefined);
			expect(Binding.getBinding(true)).to.equal(undefined);
			expect(Binding.getBinding(3)).to.equal(undefined);
			expect(Binding.getBinding("test")).to.equal(undefined);
			expect(Binding.getBinding(() => {})).to.equal(undefined);
			expect(Binding.getBinding(Symbol("test"))).to.equal(undefined);
		});
	});

	describe(".bind()", () => {
		const bindingFunction = Binding.bind.bind(Binding);

		it("can be used to bind to an object by calling bind", () => {
			expect(Binding.isBound(Binding.bind({}, () => {}, () => {}))).to.equal(true);
		});

		it("only binds objects, functions and null", () => {
			expect(() => bindingFunction(undefined, () => {}, () => {})).to.throw();
			expect(() => bindingFunction("test", () => {}, () => {})).to.throw();
			expect(() => bindingFunction(false, () => {}, () => {})).to.throw();
			expect(() => bindingFunction(Symbol("test"), () => {}, () => {})).to.throw();

			expect(() => bindingFunction(null, () => {}, () => {})).not.to.throw();
			expect(() => bindingFunction(() => {}, () => {}, () => {})).not.to.throw();
			expect(() => bindingFunction({}, () => {}, () => {})).not.to.throw();
			expect(() => bindingFunction([], () => {}, () => {})).not.to.throw();
		});

		it("requires a router and a closer function", () => {
			expect(() => bindingFunction({})).to.throw();
			expect(() => bindingFunction({}, () => {})).to.throw();
			expect(() => bindingFunction({}, undefined, () => {})).to.throw();
			expect(() => bindingFunction({}, [], [])).to.throw();
			expect(() => bindingFunction({}, {}, {})).to.throw();
			expect(() => bindingFunction({}, "a", "b")).to.throw();
			expect(() => bindingFunction({}, true, true)).to.throw();
			expect(() => bindingFunction({}, 4, 11)).to.throw();
		});

		describe("type parameter", () => {
			it("should be optional and 'normal' by default", () => {
				expect(Binding.getBinding(Binding.bind({}, () => {}, () => {})).type).to.equal(Binding.types.normal);
			});

			it("when 'normal': only accepts unbound objects", () => {
				const object = {};

				expect(() => bindingFunction(object, () => {}, () => {})).not.to.throw();
				expect(() => bindingFunction(object, () => {}, () => {})).to.throw();
			});

			it("when 'rebind': accepts all objects and rebinds them if neccessary", () => {
				const object = {};

				expect(() => bindingFunction(object, () => {}, () => {}, Binding.types.rebind)).not.to.throw();
				expect(() => bindingFunction(object, () => {}, () => {}, Binding.types.rebind)).not.to.throw();
			});

			it("when 'clone': binds to a new object that behaves as if it were the original object in Apis", () => {
				const object = {
					a: 1
				};

				expect(() => bindingFunction(object, () => {}, () => {})).not.to.throw();
				expect(Binding.isBound(object)).to.equal(true);

				let clone;

				function router() {
					expect(this.value).to.equal(object);

					return this.value;
				}

				expect(() => clone = Binding.bind(object, router, () => {}, Binding.types.clone)).not.to.throw();
				expect(Binding.isBound(clone)).to.equal(true);
				expect(Object.getPrototypeOf(clone)).to.equal(null);
				expect(clone.object).to.equal(object);

				const binding = Binding.getBinding(clone);

				let clone2;

				expect(() => clone2 = Binding.bind(object, binding.router, () => {}, Binding.types.clone)).not.to.throw();

				const binding2 = Binding.getBinding(clone2);

				return Promise.all([
					binding.route([], {}).then(result => expect(result).to.equal(clone)),
					binding2.route([], {}).then(result => expect(result).to.equal(clone2))
				]);
			});
		});
	});

	describe(".unbind()", () => {
		it("unbinds bound objects and returns them", () => {
			const o = {};

			const a = Binding.bind(o, () => {}, () => {});

			expect(a).to.equal(o);
			expect(Binding.isBound(o)).to.equal(true);

			const b = Binding.unbind(o);

			expect(b).to.equal(o);
			expect(Binding.isBound(o)).not.to.equal(true);

			const c = Binding.bind(o, () => {}, () => {});

			expect(c).to.equal(o);
			expect(Binding.isBound(o)).to.equal(true);
		});

		it("just returns unbound objects and data", () => {
			const o = Object.freeze({});
			const f = () => {};
			const s = Symbol();

			expect(Binding.unbind(o)).to.equal(o);
			expect(Binding.unbind(true)).to.equal(true);
			expect(Binding.unbind("test")).to.equal("test");
			expect(Binding.unbind(5.5)).to.equal(5.5);
			expect(Binding.unbind(s)).to.equal(s);
			expect(Binding.unbind(f)).to.equal(f);
		});
	});

	const object = {
		the: "object"
	};
	const route = ["a", "b", "c"];
	const data = "ein test";
	const origin = {};

	function router(pData, state) {
		expect(state.value).to.equal(object);
		expect(state.route).to.deep.equal(route);
		expect(state.type).to.equal("route");
		expect(state.binding).to.equal(binding);
		expect(state.origin).to.equal(origin);
		expect(data).to.equal(pData);
		expect(this).to.equal(state);

		return "result";
	}

	function closer(pData, state) {
		expect(state.value).to.equal(object);
		expect(state.route).to.deep.equal(route);
		expect(state.type).to.equal("close");
		expect(state.binding).to.equal(binding);
		expect(state.origin).to.equal(origin);
		expect(data).to.equal(pData);
		expect(this).to.equal(state);

		return "result";
	}

	const binding = Binding.getBinding(Binding.bind(object, router, closer));

	describe("#router", () => {
		it("should contain the assigned router", () => {
			expect(binding.router).to.equal(router);
		});
	});

	describe("#closer", () => {
		it("should contain the assigned closer", () => {
			expect(binding.closer).to.equal(closer);
		});
	});

	describe("#type", () => {
		it("should contain the type used at Binding creation", () => {
			expect(Binding.getBinding(Binding.bind({}, () => {}, () => {}, Binding.types.normal)).type).to.equal(Binding.types.normal);
			expect(Binding.getBinding(Binding.bind({}, () => {}, () => {}, Binding.types.clone)).type).to.equal(Binding.types.clone);
			expect(Binding.getBinding(Binding.bind({}, () => {}, () => {}, Binding.types.rebind)).type).to.equal(Binding.types.rebind);
		});
	});

	describe("#target", () => {
		it("should always contain the binding target object", () => {
			const o = {},
				oBound = Binding.bind(o, () => {}, () => {}, Binding.types.normal);

			expect(Binding.getBinding(oBound).target).to.equal(o);
			expect(oBound).to.equal(o);

			const p = o,
				pBound = Binding.bind(o, () => {}, () => {}, Binding.types.rebind);

			expect(Binding.getBinding(pBound).target).to.equal(p);
			expect(pBound).to.equal(p);

			const q = {},
				qBound = Binding.bind(q, () => {}, () => {}, Binding.types.clone);

			expect(Binding.getBinding(qBound).target).to.equal(q);
			expect(qBound).not.to.equal(q);
		});
	});

	describe("#route()", () => {
		it("should call .router() bound to a State with the given route and the given data as parameter", () => {
			expect(binding.route(route, origin, data)).to.equal("result");
		});
	});

	describe("#close()", () => {
		it("should call .closer() bound to a State with the given route and the given data as parameter", () => {
			expect(binding.close(route, origin, data)).to.equal("result");
		});
	});
});
