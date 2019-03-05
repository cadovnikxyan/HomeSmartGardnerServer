import os, sys, Adafruit_DHT, time
from datetime import datetime, date
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import psycopg2
from configparser import ConfigParser
import argparse

sensor                       = Adafruit_DHT.AM2302 #DHT11/DHT22/AM2302
sensor_pin                   = 4
sensor_name                  = "refrigerator-1"

def config(filename='../database.ini', section='postgresql'):
    parser = ConfigParser()
    parser.read(filename)
    db = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            db[param[0]] = param[1]
    else:
        raise Exception('Section {0} not found in the {1} file'.format(section, filename))
    return db

def connectToDB():
    conn = None
    try:
        params = config()
        logging.info('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(**params)
        cur = conn.cursor()
        logging.info('PostgreSQL database version:')
        cur.execute('SELECT version()')
        db_version = cur.fetchone()
        logging.info(db_version)
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        logging.info(error)
    finally:
        if conn is not None:
            conn.close()
            logging.inforint('Database connection closed.')


def __main__():
    logging.basicConfig(filename='~/.sensor_adapter.log', level=logging.INFO)
    parser = argparse.ArgumentParser(description = "Support python module for Home Smart Gardner")
    parser.add_argument("--sensor_name", default = "refrigerator-1", dest= "sensor_name", help="name of handling sensor")
    parser.add_argument("--sensor_pin",default="4", dest="sensor_pin", help="Raspberry Pi GPIO pin with connected sensor")
    opts = parser.parse_args()
    sensor_name = opts.sensor_name
    sensor_pin = opts.sensor_pin
    connectToDB()
    return 0
