#!/usr/local/bin/node

var express = require('express');
var app = express();

var bodyParser = require('body-parser'); 
app.use(bodyParser());

var fs = require('fs');

var UglifyJS = require("uglify-js");

// Database uses NEDB, which promises to be transparant with Mongo
// https://github.com/louischatriot/nedb
var Datastore = require('nedb');
var db = {};

var tosource = require('tosource.js');

db.users = new Datastore({ filename: './data/users.db' });
db.pages = new Datastore({ filename: './data/pages.db' });
db.archive = new Datastore({ filename: './data/archive.db' });

db.users.loadDatabase();
db.pages.loadDatabase();
db.archive.loadDatabase();

// load the config settings
var config = JSON.parse(fs.readFileSync("config.json" ));

// clear out cached minified files
var generatedFiles = ['./include/puca.min.js']
generatedFiles.forEach(function(file){
    fs.exists(file, function (exists) {
        if (exists) fs.unlink(file);
    });
});

app.get('/puca/api/site/:prop?', function(req, res) {
    var prop = req.params.prop || null;
    var code = "puca.site = " + config.site.toSource() + ";"; 
    res.set('Content-Type', 'application/json');
    res.send(code);
});

app.get('/puca/api/theme', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.sendfile('./themes/' + config.theme + '/theme.json');
});

app.put('/puca/api/pages/:title', function(req, res) {
    var page = {
        title: req.body.title,
        body: req.body.body,
        tags: req.body.tags,
        template: req.body.template,
        published: req.body.published,
        updated: (new Date()).getTime()
    };
    db.pages.insert(page);
    db.archive.insert(page);

    res.send(200);
});

app.post('/puca/api/pages/:title', function(req, res) {
    var title = req.params.title;
    var page = {
        title: req.body.title,
        body: req.body.body,
        tags: req.body.tags,
        template: req.body.template,
        published: req.body.published,
        updated: (new Date()).getTime()
    };
    db.pages.update({title: title}, page);
    db.archive.insert(page);

    res.send(200);
});

app.delete('/puca/api/pages/:title', function(req, res) {
    var title = req.params.title;
    db.pages.remove({title: title});

    res.send(200);
});

app.get('/puca/api/pages/all', function(req, res) {
    db.pages.find({}, function (err, docs) {
        var pages = [];
        for (var i = 0; i < docs.length; i++) {
            pages.push({
                title: docs[i].title,
                published: docs[i].published,
                updated: docs[i].updated
            });
        }
        
        if (req.xhr) {
            res.set('Content-Type', 'application/json');
            res.send(pages);
        } else {
            // jsonp
            var code = "puca.pages = " + pages.toSource() + ";"; 
            res.set('Content-Type', 'text/javascript');
            res.send(code);
        }
    });
});

app.get('/puca/api/pages/current', function(req, res) {
    var title = req.headers['referer'];
    if (!title) {
        res.send(412);
    } else {
        var server = req.protocol + '://' + req.get('host');
        title = title.substr(server.length + 1);
        title = decodeURIComponent(title);

        returnPageWithTitleForRequest(title, req, res);
    }
});

app.get('/puca/api/pages/:title', function(req, res) {
    var title = req.params.title;
    returnPageWithTitleForRequest(title, req, res);
});

function returnPageWithTitleForRequest(title, req, res) {
    db.pages.find({title: title}, function (err, docs) {
        if (err) {
            res.send(404);
        } else {
            var page = docs[0] || {}; 
            if (req.xhr) {
                res.set('Content-Type', 'application/json');
                res.send(page);
            } else {
                // jsonp
                var code = "puca.page = " + page.toSource() + ";"; 
                res.set('Content-Type', 'text/javascript');
                res.send(code);
            }
        }
    });
}

app.get('/puca/api/pages/:title/archive', function(req, res) {
    var title = req.params.title;
    db.archive.find({title: title}, function (err, docs) {
        if (err) {
            res.send(404);
        } else {
            var history = [];
            docs.forEach(function (doc) {
                history.push({
                    title: doc.title,
                    published: doc.published,
                    updated: doc.updated
                });
            });
            if (req.xhr) {
                res.set('Content-Type', 'application/json');
                res.send(history);
            } else {
                // jsonp
                var code = "puca.page = " + history.toSource() + ";"; 
                res.set('Content-Type', 'text/javascript');
                res.send(code);
            }
        }
    });
});

app.get('/puca/plugins/:plugin.js', function(req, res) {
    var plugin = req.params.plugin;
    fs.readFile('./plugins/' + plugin + '/plugin.json', function (err, json) {
        if (err) {
            res.send(404);
            return;
        }
        
        var data = JSON.parse(json);
        // on enabled plugins!
        if (data.enabled !== true) {
            res.set('Content-Type', 'text/javascript');
            res.send(404);
        } else {
            fs.readFile('./plugins/' + plugin + '/client.js', function (err, source) {
                if (err) {
                    res.send(404);
                } else {
                    // wrap the plugin in a method that ensure the plugin created is called `plugin`
                    var code = '(function (PucaPlugin) {;\n' + source + '\n;})(function () {\n\tvar plugin = new PucaPlugin("' + plugin + '");\n\tplugin.name = "' + data.name + '";\n\tplugin.description = "' + data.description + '";\n\treturn plugin;\n});';
                    res.set('Content-Type', 'text/javascript');
                    res.send(code);
                }
            });
        }
        
    });
});

app.get('/puca/include/puca.min.js', function(req, res) {
    res.set('Content-Type', 'text/javascript');
    res.sendfile('./include/puca.min.js', function (err) {
        // try and send the file, assume it doesn't exist if there is a problem
        if (err) {
            var includes = [
                './include/src/puca.js',
                './include/src/handlebars-v1.3.0.js',
                './include/src/CustomElements/MutationObserver.min.js',
                './include/src/CustomElements/CustomElements.min.js'
            ];

            var result = UglifyJS.minify(includes);
            res.send(result.code);

            // save to disk for next time
            fs.writeFile('./include/puca.min.js', result.code);
        }
    });
});

app.use('/puca/theme', express.static('./themes/' + config.theme + '/www/'));
app.use('/puca/assets', express.static('./uploads'));
app.use('/puca/admin', express.static('./admin'));

app.get('/:title', function(req, res) {
    var title = req.params.title;
    
    db.pages.find({title: title}, function (err, docs) {
        var page = docs[0] || {}; 
        if (page.published) {
            res.set('Content-Type', 'text/html');
            res.sendfile('./themes/' + config.theme + '/' + page.template);
        } else {
            res.set('Content-Type', 'text/html');
            res.send(404);
        }
    });
});

app.listen(config.port);

// load the config settings
var banner = fs.readFileSync("banner.txt");
console.info(banner.toString());
console.info("Púca is listening at http://127.0.0.1:" + config.port);
console.info("The admin interface is at http://127.0.0.1:" + config.port + '/puca/admin/');