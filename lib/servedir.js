// servedir HTTP Server
// http://github.com/remy/servedir

// Copyright 2011, Remy Sharp
// http://remysharp.com

// Convenience aliases.
var createServer = require('http').createServer;
var parse = require('url').parse;
var path = require('path');
var fs = require('fs');
var routes = require('./routes');
var types;

// Matches control characters in URLs.
var escapable = /[\x00-\x1f\x7f"'&?$\x20+,:;=@<>#%{}|\\\^~\[\]`]/g;

// Escape sequences and entities for control characters.
var escapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;'
};

fs.exists || (fs.exists = path.exists);

function getPathname(p) {
  // Encoded dots are dots
  p = p.replace(/%2e/gi, '.');

  // encoded slashes are /
  p = p.replace(/%2f|%5c/gi, '/');

  // back slashes are slashes
  p = p.replace(/[\/\\]/g, '/');

  // Make sure it starts with a slash
  p = p.replace(/^\//, '/');
  if (/[\/\\]\.\.([\/\\]|$)/.test(p)) {
    // traversal urls not ever even slightly allowed. clearly shenanigans
    // send a 403 on that noise, do not pass go, do not collect $200
    return 403;
  }

  var u = path.normalize(p).replace(/\\/g, '/');

  try {
    u = decodeURIComponent(u);
  } catch (e) {
    // if decodeURIComponent failed, we weren't given a valid URL to begin with.
    return false;
  }

  // /a/b/c mounted on /path/to/z/d/x
  // /a/b/c/d --> /path/to/z/d/x/d
  if (u.charAt(0) !== '/') u = '/' + u;

  return u;
}

// The `servedir` function creates a new simple HTTP server.
var servedir = module.exports = function(root, port, options) {
  if (typeof root != 'string') root = servedir.defaultRoot;
  if (typeof port != 'number') port = servedir.defaultPort;

  if (options === undefined) options = {};

  // Create a new HTTP server.
  var server = createServer(routes(function(req, res) {
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

      var pathname = getPathname(parse(req.url).pathname),
        file = path.join(root, pathname);

      if (pathname === 403) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Denied');
        return;
      }

      if (pathname === false) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad request');
        return;
      }

    fs.exists(file, function(exists) {
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
            res.statusCode = 200;
            // Set the correct MIME type using the extension.
            var ext = path.extname(file).slice(1);
            res.setHeader('Content-Type', types[ext] || servedir.defaultType);
            fs.createReadStream(file).on('error', function(err) {
              // Internal server error; avoid throwing an exception.
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain');
              res.end('An internal server error occurred: ' + err);
            }).pipe(res);
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
  }));
  server.listen(port, options.allowExternalAccess ? null : 'localhost');
  return server;
};

servedir.version = require('../package.json').version;

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
