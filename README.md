# Introduction

Super simple web server for offline development and testing. Run `servedir` from a directory and it will run a simple web server serving up all files from that location.

Useful for when you're developing scripts that need a "normal" web environment, i.e. can't run from the `file://` protocol. 

# Installing

Either through forking or:

  npm install servedir

And `servedir` will be installed in to your bin path.

# Usage

`servedir` can be run without any arguments and it will serve the current working directory on port 8000.  If you've not used npm to install `servedir`, simply run it with node:

  node servedir

## Arguments

* path - specify a location to serve from. Defaults to current working directory
* port - the port to run the server. Defaults to port 8000

Neither arguments are required, but if both are given must be path then port:

  servedir ~/Documents/example 8001

