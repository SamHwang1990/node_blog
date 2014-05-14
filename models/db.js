/**
 * Created by Sam on 14-5-14.
 * Blog's DB Connect
 */

var settings = require('../settings'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

module.exports = new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT), {safe:true});
