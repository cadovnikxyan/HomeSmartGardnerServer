#!/bin/sh

sudo python ~/server/raspServer/python/temperature-and-humidity-to-csv-logger.py >> ~/.sensor.log &
sudo forever start  -o ~/.web.log -e ~/.web_err.log ~/server/raspServer/bin/www
sudo openvpn --config ~/home.ovpn >> ~/.openvpn.log&
