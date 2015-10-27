"use strict";

const protocol = Symbol("protocol");
const route = Symbol("route");

class ClientApi {
	constructor(pProtocol, pRoute) {
		this[protocol] = pProtocol;
		this[route] = (pRoute || []).slice(0);
	}

	route(destination) {
		destination = arguments.length > 1 ? Array.from(arguments) : [destination];

		return new ClientApi(this[protocol], this[route].concat(destination));
	}

	close(data) {
		try {
			return Promise.resolve(this[protocol].closer(this[route], data));
		}
		catch(err) {
			return Promise.reject(err);
		}
	}

	then(success, fail) {
		return this.close().then(success, fail);
	}

	catch(fail) {
		return this.close().catch(fail);
	}

	get protocol() {
		return this[protocol];
	}
}

module.exports = ClientApi;
