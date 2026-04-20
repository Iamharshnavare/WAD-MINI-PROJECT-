const { handleRequest } = require("../backend/server");

module.exports = function handler(req, res) {
  return handleRequest(req, res);
};
