var dashButton = require('node-dash-button');
var GitHub     = require('github-api');
var https      = require('https');
var params     = require('./parameters.json');

var PushBullet = require('pushbullet');

if (params.hasOwnProperty('pushbullet')){
    var pusher = new PushBullet(params.pushbullet.api_key);
}

var dash = dashButton(params.dash.mac_address, null, null, 'all');

dash.on('detected', function () {
    console.log(new Date() + ': Pressure on the Dash Button has been detected.');

    // basic auth
    var gh = new GitHub({
        username: params.github.username,
        token: params.github.oauth_token
    });

    // Call Github to get the last commit sha
    gh.getRepo(params.github.deploy_repository_username, params.github.deploy_repository_name).getRef('heads/'+params.github.branch).then(function(result) {
        end_revision = result.data.object.sha;

        processDeployHQ(end_revision)
    });

});

console.log('Awaiting action from the Dash Button');

function processDeployHQ(end_revision)
{
    // First, get the last deployment commit sha

    var get_options = {
        host: params.deploy_hq.url,
        port: 443,
        path: "/projects/" + params.deploy_hq.project_id + "/deployments",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        'auth': params.deploy_hq.user + ':' + params.deploy_hq.api_key
    };

    var str = '';

    var callbackDeployLastRevision = function (response) {
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            var deployments = JSON.parse(str);

            var start_revision = extractLastDeployCommitFromRecords(deployments.records);

            deploy(start_revision, end_revision);
        });
    };

    // Set up the request
    var get_req = https.request(get_options, callbackDeployLastRevision);

    // post the data
    get_req.end();
}

function deploy(start_revision, end_revision)
{
    var post_params = JSON.stringify({
        "deployment": {
            "parent_identifier": params.deploy_hq.parent_identifier,
            "start_revision": start_revision,
            "end_revision": end_revision,
            "branch": params.deploy_hq.branch,
            "mode": 'queue',
            "copy_config_files": 1,
            "email_notify": 0
        }
    });

    var post_options = {
        host: params.deploy_hq.url,
        port: 443,
        path: "/projects/" + params.deploy_hq.project_id + "/deployments",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_params),
            'Accept': 'application/json'
        },
        'auth': params.deploy_hq.user + ':' + params.deploy_hq.api_key
    };

    // Set up the request
    var post_req = https.request(post_options, function(response) {
        if (typeof pusher !== 'undefined') {
            pusher.note({}, 'Dash button deploy', 'Deployment has successfully been launched', function (error, response) {
                // response is the JSON response from the API
            });
        }

        console.log(new Date() + ' : Deployment has successfully been launched !');
    });

    // post the data
    post_req.write(post_params);
    post_req.end();
}

function extractLastDeployCommitFromRecords(records)
{
    for (var i = 0, len = records.length; i < len; i++) {
        if (records[i].status === 'completed') {
            return records[i].end_revision.ref;
        }
    }

    return null;
}
