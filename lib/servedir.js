// servedir HTTP Server
// http://github.com/rem/servedir

// Copyright 2011, Remy Sharp
// http://remysharp.com

// Convenience aliases.
var createServer = require('http').createServer, parse = require('url').parse, path = require('path'), fs = require('fs'), types,

// Matches control characters in URLs.
escapable = /[\x00-\x1f\x7f"'&?$\x20+,:;=@<>#%{}|\\\^~\[\]`]/g,

// Escape sequences and entities for control characters.
escapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;'
},

// The `servedir` function creates a new simple HTTP server.
servedir = module.exports = function(root, port, options) {
  if (typeof root != 'string') root = servedir.defaultRoot;
  if (typeof port != 'number') port = servedir.defaultPort;
  
  if (options === undefined) options = {};
  
  // Create a new HTTP server.
  var server = createServer(function(req, res) {
    // Resolve the path to the requested file or folder.
    
    var end = res.end,
        writeHead = res.writeHead,
        statusCode;

    // taken rather liberally from Connect's logger.
    if (!options.quiet) {
      // proxy for statusCode.
      res.writeHead = function(code, headers){
        res.writeHead = writeHead;
        res.writeHead(code, headers);
        res.__statusCode = statusCode = code;
        res.__headers = headers || {};
      };
    
      res.end = function(chunk, encoding) {
        res.end = end;
        res.end(chunk, encoding);

        console.log((req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress)))
           + ' [' + (new Date).toUTCString() + ']'
           + ' "' + req.method + ' ' + req.url
           + ' HTTP/' + req.httpVersionMajor + '.' + req.httpVersionMinor + '" '
           + (statusCode || res.statusCode)) + ' ' + (req.headers['user-agent'] || '-');
      };
    }
    
    var pathname = decodeURIComponent(parse(req.url).pathname), file = path.join(root, pathname);
    path.exists(file, function(exists) {
      if (!exists) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('The file ' + file + ' was not found.');
      } else {
        // Serve files and directories.
        fs.stat(file, function(err, stats) {
          if (err) {
            // Internal server error; avoid throwing an exception.
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('An internal server error occurred: ' + err);
          } else if (stats.isFile()) {
            // Read and serve files.
            fs.readFile(file, 'binary', function(err, contents) {
              if (err) {
                // Internal server error; avoid throwing an exception.
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.write('An internal server error occurred: ' + err);
              } else {
                // Set the correct MIME type using the extension.
                var ext = path.extname(file).slice(1),
                    header = {'Content-Type': types[ext] || servedir.defaultType};
                
                res.writeHead(200, header);
                res.write(contents, 'binary');
              }
              // Close the connection.
              res.end();
            });
          } else {
            // Automatically append a trailing slash for directories.
            if (pathname.charAt(pathname.length - 1) != '/') pathname += '/';
            fs.readdir(file, function(err, files) {
              if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.write('An internal server error occurred: ' + err);
              } else {
                // Create a basic directory listing.
                files = files.map(function(name) {
                  // URL-encode the path to each file or directory.
                  return '<a href="' + (pathname + name).replace(escapable, function(match) {
                    // Cache escape sequences not already in the escapes hash.
                    return escapes[match] || (escapes[match] = '%' + match.charCodeAt(0).toString(16));
                  }) + '">' + name + '</a>';
                });
                // Add a link to the root directory.
                if (pathname != '/') files.unshift('<a href="..">..</a>');
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write('<!DOCTYPE html><meta charset=utf-8><title>[dir] ' + file + '</title><ul><li>' + files.join('<li>') + '</ul>');
              }
              res.end();
            });
          }
        });
      }
    });
  });
  server.listen(port);
  return server;
};

// The current version of `servedir`. Keep in sync with `package.json`.
servedir.version = '0.1.10';

// The default MIME type, root directory, and port.
servedir.defaultType = 'application/octet-stream';
servedir.defaultRoot = '.';
servedir.defaultPort = 8000;

// Common MIME types.
servedir.types = types = {
  'aiff': 'audio/x-aiff',
  'appcache': 'text/cache-manifest',
  'atom': 'application/atom+xml',
  'bmp': 'image/bmp',
  'crx': 'application/x-chrome-extension',
  'css': 'text/css',
  'eot': 'application/vnd.ms-fontobject',
  'gif': 'image/gif',
  'htc': 'text/x-component',
  'html': 'text/html',
  'ico': 'image/vnd.microsoft.icon',
  'ics': 'text/calendar',
  'jpeg': 'image/jpeg',
  'js': 'text/javascript',
  'json': 'application/json',
  'mathml': 'application/mathml+xml',
  'midi': 'audio/midi',
  'mov': 'video/quicktime',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'mpeg': 'video/mpeg',
  'ogg': 'video/ogg',
  'otf': 'font/opentype',
  'pdf': 'application/pdf',
  'png': 'image/png',
  'rtf': 'application/rtf',
  'sh': 'application/x-sh',
  'svg': 'image/svg+xml',
  'swf': 'application/x-shockwave-flash',
  'tar': 'application/x-tar',
  'tiff': 'image/tiff',
  'ttf': 'font/truetype',
  'txt': 'text/plain',
  'wav': 'audio/x-wav',
  'webm': 'video/webm',
  'webp': 'image/webp',
  'woff': 'font/woff',
  'xhtml': 'application/xhtml+xml',
  'xml': 'text/xml',
  'xsl': 'application/xml',
  'xslt': 'application/xslt+xml',
  'zip': 'application/zip'
};

// MIME type aliases for different extensions.
types.aif = types.aiff;
types.htm = types.html;
types.jpe = types.jpg = types.jpeg;
types.jsonp = types.js;
types.manifest = types.appcache;
types.markdown = types.markdn = types.mdown = types.mdml = types.md = types.txt;
types.mid = types.midi;
types.mpg = types.mpeg;
types.ogv = types.ogg;
types.rb = types.txt;
types.svgz = types.svg;
types.tif = types.tiff;
types.xht = types.xhtml;
types.php = types.html;
