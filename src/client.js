"use strict";

const ClientApi = require("./ClientApi");
const EventEmitter = require("events");

function client(protocol) {
	if(!protocol || typeof protocol !== "object")
		throw new TypeError("owe ClientApi protocols have to be objects.");

	if(typeof protocol.closer !== "function")
		throw new TypeError("owe ClientApi proctols have to offer a closer function.");

	if(typeof protocol.init !== "function")
		throw new TypeError("owe ClientApi protocols have to offer an init function.");

	protocol = Object.assign(new EventEmitter(), protocol);

	protocol.init();

	return new ClientApi(protocol);
}

Object.assign(client, {
	isApi(api) {
		return api && typeof api === "object" && api instanceof ClientApi || false;
	}
});

module.exports = client;
