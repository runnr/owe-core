"use strict";

const expect = require("chai").expect;

const owe = require("../src");
const Api = require("../src/Api");
const exposed = require("../src/exposed");

describe("owe", () => {
	it("should have a reference to Binding", () => {
		expect(owe.Binding).to.equal(require("../src/Binding"));
	});

	it("should have a reference to Binding.isBound", () => {
		expect(owe.isBound).to.be.a("function");
	});

	it("should have a reference to State", () => {
		expect(owe.State).to.equal(require("../src/State"));
	});

	it("should have a reference to client", () => {
		expect(owe.client).to.equal(require("../src/client"));
	});

	it("should have a reference to resource", () => {
		expect(owe.resource).to.equal(require("../src/resource"));
	});

	it("should have a reference to proxify and unproxify", () => {
		expect(owe.proxify).to.equal(require("../src/proxify"));
		expect(owe.unproxify).to.equal(owe.proxify.revert);
	});

	it("should have a reference to exposed", () => {
		expect(owe.exposed).to.equal(exposed);
		expect(owe.expose).to.equal(exposed);
	});

	it("should have a reference to exposed.isExposed", () => {
		expect(owe.isExposed).to.equal(exposed.isExposed);
	});

	describe(".call()", () => {
		it("should return the given object", () => {
			const o = {};

			expect(owe(o, () => undefined, () => undefined)).to.equal(o);
		});

		it("should bind the given object", () => {
			const o = owe({}, () => undefined, () => undefined);

			expect(owe.isBound(o)).to.equal(true);
		});

		it("should return a new bound object if none was given", () => {
			const o = owe(null, () => undefined, () => undefined);

			expect(o).to.be.an("object");
			expect(owe.isBound(o)).to.equal(true);
		});

		it("should use the given routing and closing functions for binding", () => {
			const a = () => undefined;
			const b = () => undefined;

			const binding = owe.Binding.getBinding(owe({}, a, b));

			expect(binding.router).to.equal(a);
			expect(binding.closer).to.equal(b);
		});

		it("should accept router and closer wrapped in an object", () => {
			const a = () => undefined;
			const b = () => undefined;

			const binding = owe.Binding.getBinding(owe({}, {
				router: a,
				closer: b
			}));

			expect(binding.router).to.equal(a);
			expect(binding.closer).to.equal(b);
		});

		it("should throw if router and closer are wrapped in an object and a closer is given as third param", () => {
			expect(() => owe.Binding.getBinding(owe({}, {
				router: () => undefined,
				closer: () => undefined
			}, () => undefined))).to.throw();

			expect(() => owe.Binding.getBinding(owe({}, {
				router: () => undefined
			}, () => undefined))).to.throw();

			expect(() => owe.Binding.getBinding(owe({}, {
				closer: () => undefined
			}, () => undefined))).to.throw();
		});

		it("should accept a missing router and/or closer and use empty functions instead", () => {
			const binding1 = owe.Binding.getBinding(owe({}, {}));

			expect(binding1.router).to.be.a("function");
			expect(binding1.closer).to.be.a("function");

			const a = () => undefined;
			const binding2 = owe.Binding.getBinding(owe({}, {
				router: a,
				closer: null
			}));

			expect(binding2.router).to.equal(a);
			expect(binding2.closer).to.be.a("function");

			const binding3 = owe.Binding.getBinding(owe({}));

			expect(binding3.router).to.be.a("function");
			expect(binding3.router()).to.equal(undefined);
			expect(binding3.closer).to.be.a("function");
			expect(binding3.closer()).to.equal(undefined);

			const binding4 = owe.Binding.getBinding(owe({}, a));

			expect(binding4.router).to.equal(a);
			expect(binding4.closer).to.be.a("function");

			const binding5 = owe.Binding.getBinding(owe({}, undefined, a));

			expect(binding5.router).to.be.a("function");
			expect(binding5.closer).to.equal(a);
		});

		it("should use another Binding type identifier if given as last param", () => {
			const binding1 = owe.Binding.getBinding(owe({}, {}, "clone"));

			expect(binding1.type).to.equal(owe.Binding.types.clone);

			const binding2 = owe.Binding.getBinding(owe({}, {}, "rebind"));

			expect(binding2.type).to.equal(owe.Binding.types.rebind);

			const binding3 = owe.Binding.getBinding(owe({}, {
				router: () => undefined
			}, "normal"));

			expect(binding3.type).to.equal(owe.Binding.types.normal);

			const binding4 = owe.Binding.getBinding(owe({}, undefined, undefined, "clone"));

			expect(binding4.type).to.equal(owe.Binding.types.clone);

			const binding5 = owe.Binding.getBinding(owe({}, () => undefined, () => undefined, "clone"));

			expect(binding5.type).to.equal(owe.Binding.types.clone);
		});

		it("should use another Binding type symbol if given as last param", () => {
			const binding1 = owe.Binding.getBinding(owe({}, {}, owe.Binding.types.clone));

			expect(binding1.type).to.equal(owe.Binding.types.clone);

			const binding2 = owe.Binding.getBinding(owe({}, {}, owe.Binding.types.rebind));

			expect(binding2.type).to.equal(owe.Binding.types.rebind);

			const binding3 = owe.Binding.getBinding(owe({}, {
				router: () => undefined
			}, owe.Binding.types.normal));

			expect(binding3.type).to.equal(owe.Binding.types.normal);

			const binding4 = owe.Binding.getBinding(owe({}, undefined, undefined, owe.Binding.types.clone));

			expect(binding4.type).to.equal(owe.Binding.types.clone);

			const binding5 = owe.Binding.getBinding(owe({}, () => undefined, () => undefined, owe.Binding.types.clone));

			expect(binding5.type).to.equal(owe.Binding.types.clone);
		});

		it("should use Binding type clone if type param is true, normal if false", () => {
			const binding1 = owe.Binding.getBinding(owe({}, {}, true));

			expect(binding1.type).to.equal(owe.Binding.types.clone);

			const binding2 = owe.Binding.getBinding(owe({}, {}, false));

			expect(binding2.type).to.equal(owe.Binding.types.normal);
		});

		it("should throw if the given Binding type is invalid", () => {
			expect(() => owe({}, {}, null)).to.throw();
			expect(() => owe({}, undefined, undefined, null)).to.throw();
			expect(() => owe({}, {}, NaN)).to.throw();
			expect(() => owe({}, undefined, undefined, NaN)).to.throw();
			expect(() => owe({}, {}, 0)).to.throw();
			expect(() => owe({}, undefined, undefined, 0)).to.throw();
			expect(() => owe({}, {}, "")).to.throw();
			expect(() => owe({}, undefined, undefined, "")).to.throw();
			expect(() => owe({}, {}, "toString")).to.throw();
			expect(() => owe({}, undefined, undefined, "toString")).to.throw();
			expect(() => owe({}, {}, "__proto__")).to.throw();
			expect(() => owe({}, undefined, undefined, "__proto__")).to.throw();
			expect(() => owe({}, {}, {})).to.throw();
			expect(() => owe({}, undefined, undefined, {})).to.throw();
			expect(() => owe({}, {}, () => undefined)).to.throw();
			expect(() => owe({}, undefined, undefined, () => undefined)).to.throw();
			expect(() => owe({}, {}, Symbol("test"))).to.throw();
			expect(() => owe({}, undefined, undefined, Symbol("test"))).to.throw();
			expect(() => owe({}, {}, 1)).to.throw();
			expect(() => owe({}, undefined, undefined, 1)).to.throw();
		});

		it("should throw if type is given as a third param and there is a fourth one", () => {
			expect(() => owe({}, {}, true, true)).to.throw();
		});
	});

	describe(".isApi()", () => {
		it("should return 'false' for everything that is not an instance of Api", () => {
			expect(owe.isApi()).to.equal(false);
			expect(owe.isApi(undefined)).to.equal(false);
			expect(owe.isApi(null)).to.equal(false);
			expect(owe.isApi(123.456)).to.equal(false);
			expect(owe.isApi("test")).to.equal(false);
			expect(owe.isApi(NaN)).to.equal(false);
			expect(owe.isApi(Infinity)).to.equal(false);
			expect(owe.isApi({})).to.equal(false);
			expect(owe.isApi(() => undefined)).to.equal(false);
			expect(owe.isApi(owe({}))).to.equal(false);
			expect(owe.isApi(Api)).to.equal(false);
			expect(owe.isApi(Object.create(Api))).to.equal(false);
			expect(owe.isApi(Symbol("test"))).to.equal(false);
		});

		it("should return 'true' for everything that is an instance of Api", () => {
			expect(owe.isApi(new Api())).to.equal(true);
			expect(owe.isApi(Object.create(new Api()))).to.equal(true);
			expect(owe.isApi(Object.create(Api.prototype))).to.equal(true);
		});
	});

	describe(".api()", () => {
		it("should return an Api instance for a given bound object", () => {
			const o = owe({});
			const api = owe.api(o);

			expect(api).to.be.an.instanceof(Api);

			return api.object.then(object => expect(object).to.equal(o));
		});

		it("should bind an unbound object and return an Api instance for it", () => {
			const o1 = {};
			const o2 = {};
			const f = () => undefined;
			const api1 = owe.api(o1);
			const api2 = owe.api(o2, f, f);

			expect(api1).to.be.an.instanceof(Api);
			expect(api2).to.be.an.instanceof(Api);
			expect(owe.isBound(o1)).to.equal(true);
			expect(owe.isBound(o2)).to.equal(true);

			expect(owe.Binding.getBinding(o2).router).to.equal(f);
			expect(owe.Binding.getBinding(o2).closer).to.equal(f);

			return Promise.all([
				api1.object.then(object => expect(object).to.equal(o1)),
				api2.object.then(object => expect(object).to.equal(o2))
			]);
		});
	});
});
