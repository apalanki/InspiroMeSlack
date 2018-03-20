var request = require('request');

var shuffleCallbackId = 'inspirobot_shuffle';

function getUserId(body) {
    return '<@' + (body.user_id || body.user.id) + '>: ';
}

function requestInspiration() {
    return new Promise(function (resolve) {
        request('http://inspirobot.me/api?generate=true', function (error, response, body) {
            resolve(error ? null : body);
        });
    });
}

function handleSendCallback(req, res, next) {
    return function (error, status, body) {
        if (error) {
            return next(error);
        } else if (status !== 200) {
            // inform user that our Incoming WebHook failed
            return next(new Error('Incoming WebHook: ' + status + ' ' + body));
        } else {
            return res.status(200).end();
        }
    }
}

function send(payload, responseUrl, callback) {
    request({
        uri: responseUrl,
        method: 'POST',
        body: JSON.stringify(payload)
    }, function (error, response, body) {
        if (error) {
            return callback(error);
        }

        callback(null, response.statusCode, body);
    });
}

function handleInitialRequest(req, res, next) {
    requestInspiration()
        .then(function (response) {
            var image = 'http://inspirobot.me/website/images/inspirobot-dark-green.png';
            if (response !== null && response.status === 200) {
                image = response.data;
            }

            var body = req.body || req;
            var botPayload = {
                channel: body.channel_id,
                text: getUserId(body) + 'Select a inspirational quote to *Send*',
                mrkdwn: true,
                attachments: [
                    {
                        text: image,
                        image_url: image,
                        callback_id: shuffleCallbackId,
                        attachment_type: 'default',
                        actions: [
                            {
                                name: 'send',
                                text: 'Send',
                                type: 'button',
                                value: image,
                                style: 'primary'
                            },
                            {
                                name: 'reshuffle',
                                text: 'Reshuffle',
                                type: 'button',
                                value: 'reshuffle'
                            },
                            {
                                name: 'cancel',
                                text: 'Cancel',
                                type: 'button',
                                value: 'cancel',
                                style: 'danger'
                            }
                        ]
                    }
                ]
            };

            send(botPayload, body.response_url, handleSendCallback(req, res, next))
        })
}

function handleSendRequest(payload, res, next) {
    const image = payload.actions[0].value;
    var botPayload = {
        response_type: 'in_channel',
        channel: payload.channel_id,
        replace_original: false,
        delete_original: true,
        text: getUserId(payload) + 'via /inspire',
        attachments: [{
            text: image,
            image_url: image
        }]
    };

    send(botPayload, payload.response_url, handleSendCallback(payload, res, next))
}

function handleCancelRequest(payload, res, next) {
    var botPayload = {
        delete_original: true
    };

    send(botPayload, payload.response_url, handleSendCallback(payload, res, next))
}

function handleShuffleActionRequest(payload, res, next) {
    var action = payload.actions[0];

    if (action.name === 'send') {
        handleSendRequest(payload, res, next)
    }
    else if (action.name === 'reshuffle') {
        handleInitialRequest(payload, res, next)
    }
    else if (action.name === 'cancel') {
        handleCancelRequest(payload, res, next)
    }
}

module.exports = function (req, res, next) {
    if (req && req.body && req.body.payload) {
        const payload = JSON.parse(req.body.payload);
        handleShuffleActionRequest(payload, res, next)
    } else {
        handleInitialRequest(req, res, next)
    }
};
