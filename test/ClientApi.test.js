"use strict";

const expect = require("chai").expect;

const ClientApi = require("../src/ClientApi");
const proxify = require("../src/proxify");

describe("ClientApi", () => {
	const protocol = {
		a: 1,
		b: 2,
		c: 3,
		connected: false,

		closer(route, data) {
			if(route.length > 1)
				return route;

			if(route.length === 0 || route[0]) {
				if(data in this)
					return this[data];
				else
					throw `closeErr:${data}`;
			}

			throw "routeErr";
		}
	};
	const api = new ClientApi(protocol);

	describe("#route()", () => {
		it("should return an Api", () => {
			expect(api.route()).to.be.an.instanceof(ClientApi);
		});

		it("should return a navigatable Api when appropriate",
			() => api.route(true).close("a").then(data => expect(data).to.equal(1)));

		it("should return a dead Api when used inappropriately",
			() => api.route().close("a").then(() => {
				expect().fail("This routing was invalid.");
			}, err => {
				expect(err).to.equal("routeErr");
			}));

		it("should accept multiple routes to route in sequence",
			() => api.route(1, 2, 3).route(4).route(5, 6).then(data => {
				expect(data).to.deep.equal([1, 2, 3, 4, 5, 6]);
			}));
	});

	describe("#close()", () => {
		it("should return a Promise", () => {
			expect(api.close()).to.be.a("promise");
		});

		it("should resolve with the requested data", () => Promise.all([
			api.close("a"),
			api.close("b"),
			api.close("c")
		]).then(result => {
			expect(result).to.deep.equal([1, 2, 3]);
		}));

		it("should reject incorrect requests", () => Promise.all([
			api.close("d").then(() => {
				expect().fail("This request should have thrown.");
			}, err => {
				expect(err).to.equal("closeErr:d");
			}),
			api.then(() => {
				expect().fail("This request should have thrown.");
			}, err => {
				expect(err).to.equal("closeErr:undefined");
			}),
			api.catch(err => {
				throw err;
			}).then(() => {
				expect().fail("This request should have thrown.");
			}, err => {
				expect(err).to.equal("closeErr:undefined");
			})
		]));
	});

	describe("#connected", () => {
		it("should mirror the value of protocol.connected", () => {
			expect(api.connected).to.equal(false);
			protocol.connected = true;
			expect(api.connected).to.equal(true);
			expect(api.route().connected).to.equal(true);
			protocol.connected = false;
			expect(api.route().connected).to.equal(false);
		});

		it("should be read-only", () => {
			expect(() => api.connected = true).to.throw();
		});
	});

	describe("#proxified", () => {
		it("should be a proxified version of this Api", () => {
			expect(proxify.revert(api.proxified)).to.equal(api);
		});
	});
});
