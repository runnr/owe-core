/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");
const Binding = require("../src/Binding");

describe("Binding", function() {

	describe(".isBound()", function() {
		it("should return true for objects that were bound", function() {
			const boundObject = Binding.bind(null, function() {}, function() {}),
				boundFunction = Binding.bind(function() {}, function() {}, function() {});

			expect(Binding.isBound(boundObject)).to.be(true);
			expect(Binding.isBound(boundFunction)).to.be(true);
		});

		it("should return false for everything that was not bound", function() {
			expect(Binding.isBound(null)).to.be(false);
			expect(Binding.isBound(undefined)).to.be(false);
			expect(Binding.isBound({})).to.be(false);
			expect(Binding.isBound(true)).to.be(false);
			expect(Binding.isBound(3)).to.be(false);
			expect(Binding.isBound("test")).to.be(false);
			expect(Binding.isBound(function() {})).to.be(false);
			expect(Binding.isBound(Symbol("test"))).to.be(false);
		});
	});

	describe(".getBinding()", function() {
		it("should return the Binding object for the given object", function() {
			const object = {};

			Binding.bind(object, function() {}, function() {});
			expect(Binding.getBinding(object)).to.be.a(Binding);
		});
	});

	describe(".bind()", function() {

		const bindingFunction = Binding.bind.bind(Binding);

		it("can be used to bind to an object by calling bind", function() {
			expect(Binding.isBound(Binding.bind({}, function() {}, function() {}))).to.be.ok();
		});

		it("only binds objects, functions and null", function() {
			expect(bindingFunction).withArgs(undefined, function() {}, function() {}).to.throwError();
			expect(bindingFunction).withArgs("test", function() {}, function() {}).to.throwError();
			expect(bindingFunction).withArgs(false, function() {}, function() {}).to.throwError();
			expect(bindingFunction).withArgs(Symbol("test"), function() {}, function() {}).to.throwError();

			expect(bindingFunction).withArgs(null, function() {}, function() {}).not.to.throwError();
			expect(bindingFunction).withArgs(function() {}, function() {}, function() {}).not.to.throwError();
			expect(bindingFunction).withArgs({}, function() {}, function() {}).not.to.throwError();
			expect(bindingFunction).withArgs([], function() {}, function() {}).not.to.throwError();
		});

		it("requires a router and a closer function", function() {
			expect(bindingFunction).withArgs({}).to.throwError();
			expect(bindingFunction).withArgs({}, function() {}).to.throwError();
			expect(bindingFunction).withArgs({}, undefined, function() {}).to.throwError();
			expect(bindingFunction).withArgs({}, [], []).to.throwError();
			expect(bindingFunction).withArgs({}, {}, {}).to.throwError();
			expect(bindingFunction).withArgs({}, "a", "b").to.throwError();
			expect(bindingFunction).withArgs({}, true, true).to.throwError();
			expect(bindingFunction).withArgs({}, 4, 11).to.throwError();
		});

		describe("type parameter", function() {
			it("should be optional and 'normal' by default", function() {
				expect(Binding.getBinding(Binding.bind({}, function() {}, function() {})).type).to.be(Binding.types.normal);
			});

			it("when 'normal': only accepts unbound objects", function() {
				const object = {};

				expect(bindingFunction).withArgs(object, function() {}, function() {}).not.to.throwError();
				expect(bindingFunction).withArgs(object, function() {}, function() {}).to.throwError();
			});

			it("when 'rebind': accepts all objects and rebinds them if neccessary", function() {
				const object = {};

				expect(bindingFunction).withArgs(object, function() {}, function() {}, Binding.types.rebind).not.to.throwError();
				expect(bindingFunction).withArgs(object, function() {}, function() {}, Binding.types.rebind).not.to.throwError();
			});

			it("when 'clone': binds to a new object that behaves as if it were the original object in Apis", function() {
				const object = {
					a: 1
				};

				expect(bindingFunction).withArgs(object, function() {}, function() {}).not.to.throwError();
				expect(Binding.isBound(object)).to.be(true);

				let clone;

				expect(() => clone = Binding.bind(object, function() {

					expect(this.value).to.be(object);

					return this.value;
				}, function() {}, Binding.types.clone)).not.to.throwError();
				expect(Binding.isBound(clone)).to.be(true);
				expect(Object.getPrototypeOf(clone)).to.be(null);
				expect(clone.object).to.be(object);

				const binding = Binding.getBinding(clone);

				return binding.route([], {}).then(result => expect(result).to.be(clone));
			});
		});
	});

	describe(".unbind()", function() {
		it("unbinds bound objects and returns them", function() {
			const o = {};

			const a = Binding.bind(o, function() {}, function() {});

			expect(a).to.be(o);
			expect(Binding.isBound(o)).to.be.ok();

			const b = Binding.unbind(o);

			expect(b).to.be(o);
			expect(Binding.isBound(o)).not.to.be.ok();

			const c = Binding.bind(o, function() {}, function() {});

			expect(c).to.be(o);
			expect(Binding.isBound(o)).to.be.ok();
		});

		it("just returns unbound objects and data", function() {

			const o = Object.freeze({}),
				f = function() {},
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
	const location = ["a", "b", "c"];
	const data = "ein test";
	const origin = {};
	const router = function(pData) {
		expect(this.value).to.be(object);
		expect(this.location).to.eql(location);
		expect(this.binding).to.be(binding);
		expect(this.origin).to.be(origin);
		expect(data).to.be(pData);

		return "result";
	};
	const closer = router;
	const binding = Binding.getBinding(Binding.bind(object, router, closer));

	describe("#router", function() {
		it("should contain the assigned router", function() {
			expect(binding.router).to.be(router);
		});
	});

	describe("#closer", function() {
		it("should contain the assigned closer", function() {
			expect(binding.closer).to.be(closer);
		});
	});

	describe("#type", function() {
		it("should contain the type used at Binding creation", function() {
			expect(Binding.getBinding(Binding.bind({}, function() {}, function() {}, Binding.types.normal)).type).to.be(Binding.types.normal);
			expect(Binding.getBinding(Binding.bind({}, function() {}, function() {}, Binding.types.clone)).type).to.be(Binding.types.clone);
			expect(Binding.getBinding(Binding.bind({}, function() {}, function() {}, Binding.types.rebind)).type).to.be(Binding.types.rebind);
		});
	});

	describe("#target", function() {
		it("should always contain the binding target object", function() {
			const o = {},
				oBound = Binding.bind(o, function() {}, function() {}, Binding.types.normal);

			expect(Binding.getBinding(oBound).target).to.be(o);
			expect(oBound).to.be(o);

			const p = o,
				pBound = Binding.bind(o, function() {}, function() {}, Binding.types.rebind);

			expect(Binding.getBinding(pBound).target).to.be(p);
			expect(pBound).to.be(p);

			const q = {},
				qBound = Binding.bind(q, function() {}, function() {}, Binding.types.clone);

			expect(Binding.getBinding(qBound).target).to.be(q);
			expect(qBound).not.to.be(q);
		});
	});

	describe("#route()", function() {
		it("should call .router() bound to a State with the given location and the given data as parameter", function() {
			expect(binding.route(location, origin, data)).to.be("result");
		});
	});

	describe("#close()", function() {
		it("should call .closer() bound to a State with the given location and the given data as parameter", function() {
			expect(binding.close(location, origin, data)).to.be("result");
		});
	});

});
