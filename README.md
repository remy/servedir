# servedir

`servedir` is a simple [Node](http://nodejs.org) web server for offline development and testing: running `servedir` from a directory will create a quick local web server. `servedir` is useful for developing scripts that require a standard web environment and can't use the `file://` protocol.

The annotated source code is included in the `docs/` folder.

## Installation

Check out a working copy of the source code with [Git](http://git-scm.com), or install `servedir` via [npm](http://npmjs.org). The latter will also install `servedir` into the system's `bin` path.

    $ git clone git://github.com/remy/servedir.git
    $ npm install servedir -g

## Usage

`servedir [path] [port]`

* `path` - The location to serve files and directories from. Defaults to the current working directory.
* `port` - The port number. Default to 8000.

If no port is given, it'll try to find the next free port from 8000 upwards.

## Mocked router

To create a mock router, create a `routes.json` file in the current working directory, and `servedir` will respond with your data.

For example:

```json
{
  "GET /foo/:id": {
    "id": "{{id}}",
    "title": "Awesome stuff"
  },
  "POST /ok": {
    "success": true
  },
  "POST /fail": {
    "success": true
  }
}
```

Now requests to those URLs will respond with JSON for the mocked endpoints.

## Example

    $ servedir
    $ servedir 8001
    $ servedir ~/Documents/example
    $ servedir ~/Documents/example 8001

## Contributors

* [Remy Sharp](http://remysharp.com/) (author)
* [Graham Ballantyne](http://grahamballantyne.com/)
* [Kit Cambridge](http://kitcambridge.github.com/)
* [Mathias Bynens](http://mathiasbynens.be/)