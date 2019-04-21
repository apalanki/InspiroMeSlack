'use strict';

const agent = require('superagent');

const inspirobotUrl = 'http://inspirobot.me/api?generate=true';

/**
 * Returns new inspiration image from inspirobot.me
 */
function getNewInspiration() {
    return agent.get(inspirobotUrl).then((res) => res.text);
}

/**
 * Sends provided payload to Slack
 * @param payload - JSON response.
 * @param responseUrl - respond to the channel that made the request.
 */
function postSlackResponse(payload, responseUrl) {
    return agent.post(responseUrl).send(JSON.stringify(payload));
}

module.exports = {getNewInspiration, postSlackResponse};
