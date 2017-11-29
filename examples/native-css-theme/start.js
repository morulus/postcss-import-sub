const server = require('pushstate-server');
const cowsay = require("cowsay");

const PORT = 9000;
const URL = `http://127.0.0.1:${PORT}`;

server.start({
  port: PORT,
  directory: './public'
});

console.log(cowsay.say({
	text : `Opening ${URL}`,
	e : "oO",
	T : "U "
}));
require("openurl").open(URL);
