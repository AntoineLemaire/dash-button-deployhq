# dash-button-deployhq

## Installation

Copy `parameters.json.dist` to `parameters.json` with your own parameters
Run `node index.js`

## Configuration

### Dash Button

Configure the Dash Button Wifi, but don't associate it with a Amazon product. Leave the configuration workflow before that.
Get the Dash Button MAC address 

Run `sudo node bin/findbutton` and push the button. MAC address will appear (be sure you're on the same network).

### Github

Get a Oauth token in [https://github.com/settings/tokens](https://github.com/settings/tokens). If needed access to a private repository, give full access to `repo`, else need only `public_repo`


### DeployHQ

Get the parent_identifier of the server in the URL 

![parent_identifier](https://i.imgur.com/CQKEXe2.png)

API Key can be found or create in [https://yourproject.deployhq.com/security](https://yourproject.deployhq.com/security)
