/*!
 * servedir HTTP Server
 * http://github.com/rem/servedir
 *
 * Copyright 2011, Remy Sharp
 * http://remysharp.com
*/

// Convenience aliases.
var createServer = require('http').createServer,
parse = require('url').parse,
path = require('path'),
fs = require('fs'),

// Common MIME types.
mime = {
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
},

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

// Configure the root directory, port, and default MIME type.
root = process.argv[2],
port = process.argv[3],
defaultMime = 'application/octet-stream';

// MIME type aliases for different extensions.
mime.aif = mime.aiff;
mime.htm = mime.html;
mime.jpe = mime.jpg = mime.jpeg;
mime.jsonp = mime.js;
mime.manifest = mime.appcache;
mime.mid = mime.midi;
mime.mpg = mime.mpeg;
mime.ogv = mime.ogg;
mime.rb = mime.txt;
mime.svgz = mime.svg;
mime.tif = mime.tiff;
mime.xht = mime.xhtml;

if (!port) {
  // Port specified as the first argument; root directory omitted.
  if ((port = Math.ceil(root)) > -1) {
    root = null;
  } else {
    // Use port 8000 if the port was omitted.
    port = 8000;
  }
}

// Use the current directory if the root directory was omitted.
if (!root) root = process.cwd();

// Create a new simple HTTP server.
createServer(function(req, res) {
  // Resolve the path to the requested file or folder.
  var pathname = parse(decodeURIComponent(req.url)).pathname, file = path.join(root, pathname);
  path.exists(file, function(exists) {
    if (!exists) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('The file ' + file + ' was not found.');
    } else {
      // Serve files and directories.
      fs.stat(file, function(err, stats) {
        if (err) {
          // Internal server error; avoid throwing an exception.
          res.writeHeader(500, {'Content-Type': 'text/plain'});
          res.end('An internal server error occurred: ' + err);
        } else if (stats.isFile()) {
          // Read and serve files.
          fs.readFile(file, 'binary', function(err, contents) {
            if (err) {
              // Internal server error; avoid throwing an exception.
              res.writeHeader(500, {'Content-Type': 'text/plain'});
              res.write('An internal server error occurred: ' + err);
            } else {
              // Set the correct MIME type using the extension.
              res.writeHead(200, {'Content-Type': mime[path.extname(file).slice(1)] || defaultMime});
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
              res.writeHeader(500, {'Content-Type': 'text/plain'});
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
}).listen(port);

console.log('Serving %s on port %d...', root, port);