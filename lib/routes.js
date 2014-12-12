'use strict';
var fs = require('fs');
var path = require('path');
var router = require('router-stupid')();
var configPath = path.resolve(process.cwd() + '/routes.json');

/*

var example = {
  "GET /foo/:id": {
    "id": "{{id}}",
    "title": "Awesome stuff"
  }
};
*/

function loadRoutes(staticRouter) {
  var config = require(configPath);
  var urls = [];

  Object.keys(config).forEach(function (route) {
    var method = route.split(' ')[0].toLowerCase();
    var url = route.split(' ')[1];

    urls.push(route);

    var result = '';

    try {
      result = JSON.stringify(config[route]);
    } catch (e) { // this should never happen, since the require would fail
      result = 'Malformed JSON on ' + route;
    }

    var handler = function (req, res) {
      res.writeHead(200, { 'content-type': 'application/json' });
      var withParam = result;
      Object.keys(req.params).forEach(function (key) {
        withParam = withParam.replace(new RegExp('{{' + key + '}}', 'g'), req.params[key]);
      });
      res.end(withParam);
    };

    if (method === '*' || method === 'all') {
      router.all(url, handler);
    } else {
      try { // fuck it
        router[method](url, handler);
      } catch (e) {
        console.error(method.toUpperCase() + ' not supported');
      }
    }
  });

  console.log('Routes loaded:\n- ' + urls.join('\n- '));

  // lastly
  router.all('*', staticRouter);

  return router;
}

if (fs.existsSync(configPath)) {
  module.exports = loadRoutes;
} else {
  module.exports = function (staticRouter) {
    return staticRouter;
  };
}