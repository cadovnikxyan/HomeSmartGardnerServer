#!/bin/sh

sudo python ./python/temperature-and-humidity-to-csv-logger.py &
sudo forever start  -o ~/.web.log -e ~/.web_err.log ./bin/www
sudo openvpn --config ~/home.ovpn >> ~/.openvpn.log&
