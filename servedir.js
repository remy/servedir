var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    url = require('url'),
    root = '',
    port = 0,
    // massively simplified - can't be arsed to load in all the mime types properly
    defaultMime = 'text/plain',
    mimeTypes = {
      html: 'text/html',
      js: 'text/javascript',
      json: 'text/javascript',
      css: 'text/css',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      png: 'image/png'
    };

// defaults
root = process.argv[2];

if (!root || /^\d+$/.test(root)) {
  port = root;
  root = process.cwd();
}

port = process.argv[3];
if (!port) {
  port = 8000;
}

http.createServer(function (req, res) {
  var pathname = url.parse(req.url).pathname,
      file = path.join(root, pathname);
      
  console.log('request ' + req.url);
      
  path.exists(file, function (exists) {
    var stat;
        
    if (exists) {
      stat = fs.statSync(file);
      if (stat.isFile()) {
        // serve up
        console.log('serving ' + file);
        var mime = mimeTypes[file.substr(file.lastIndexOf('.')+1)] || defaultMime;
        
        fs.readFile(file, "binary", function(err, file) {
          if (err) {  
            response.sendHeader(500, {"Content-Type": "text/plain"});  
            response.write(err + "\n");  
          } else {
            res.writeHead(200, {'Content-type': mime });
            res.write(file, "binary");  
          }

          res.end();  
        });
      } else {
        if (pathname.substr(-1) !== '/') pathname += '/';
        
        console.log('serving directory: ' + file);
        res.writeHead(200, {'Content-type': 'text/html' });
        res.write('<ul>\n');
        fs.readdirSync(file).forEach(function (name) {
          res.write('<li><a href="' + pathname + name + '">' + name + '</a></li>\n');
        });
        res.write('</ul>\n');
        res.end();
      }
    } else {
      res.writeHead(404, {'Content-type': 'text/plain' });
      res.end('File not found');
    }
  });
}).listen(port);

console.log('Serving ' + root + ' on port ' + port);