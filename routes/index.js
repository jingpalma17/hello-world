module.exports = function (app, addon) {

    // Root route. This route will serve the `atlassian-connect.json` unless the
    // documentation url inside `atlassian-connect.json` is set
    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });
    
    // This is an example route that's used by the default "generalPage" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/hello-world', addon.authenticate(), function (req, res) {
            // Rendering a template is easy; the `render()` method takes two params: name of template
            // and a json object to pass the context in
            res.render('hello-world', {
                title: 'Atlassian Connect',
                fullname: "Jingle Palma"
                //issueId: req.query['issueId']
            });
        }
    );

    // This is an example route that's used by the default "webPanels" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/configuration', function(req,res){
        //this will render the template "configuration.hbs"
        res.render("configuration", {id : req.query.id, type : req.query.type });
    });

    // This is an example of a function that return promise
    function doRequest(url, httpClient) {        
        return new Promise(function (resolve, reject) {
            httpClient.get(url, function (error, res, body) {
                //check if the request is valid
                if (!error && res.statusCode == 200) {
                    resolve(res);
                } else {
                    console.log(error); // print error to console
                    // return error message and error status (404)
                    resolve({
                        error: error,
                        statusCode: res.statusCode
                    });        
                }
            });
        });

    }

    // This is an example route that's used by the default "jiraIssueTabPanels" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/audit-trail', addon.checkValidToken(), async function (req, res) {
        const httpClient = addon.httpClient(req);
        let viewParams;
        try {
            let data = await doRequest('/rest/api/2/issue/' +             
                req.query.issueKey +'/properties/tasks', httpClient);
            
            viewParams = {
                title: 'Audit Trail',
                issueKey: req.query.issueKey,
                issueId: req.query.issueId,
                tasks: []
            }

            // check if await request is valid
            if(data.statusCode === 200) {
                var task = JSON.parse(data.body).value;
                viewParams.tasks = task.content
            }
        } catch (err) {
            console.log(err); // print error to console

            return res.status(500).send({
                status: 500,
                errors: "Error"
            });
        }

        return res.render('audit-trail', viewParams);
    });

    // This is an example route that's used by the default "jiraProjectPages" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/project', addon.authenticate(), function (req, res) {
        //this will render the template "project-page'.hbs"
        res.render('project-page', {
            title: 'Project Page',
            projectKey: req.query.projectKey,
            projectId: req.query.projectId
        });
    });

    // This is an example route that's used by the default "dialogs" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/dialog', function (req, res) {
        //this will render the template "project-page'.hbs"
        res.render('dialog', {
            title: 'Dialoag'
        });
        
    });
    
    // load any additional files you have in routes and apply those to the app
    {
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync("routes");
        for(var index in files) {
            var file = files[index];
            if (file === "index.js") continue;
            // skip non-javascript files
            if (path.extname(file) != ".js") continue;

            var routes = require("./" + path.basename(file));

            if (typeof routes === "function") {
                routes(app, addon);
            }
        }
    }
};
//test