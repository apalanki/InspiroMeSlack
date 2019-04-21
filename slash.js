const {getNewInspiration, postSlackResponse} = require('./integrations');
const {getAction, getUserId, shuffleCallbackId} = require('slackUtils');

async function handleInitialRequest(req) {
    const inspireImage = await getNewInspiration();
    const image = inspireImage || 'http://inspirobot.me/website/images/inspirobot-dark-green.png';

    const body = req.body || req;
    const botPayload = {
        channel: body.channel_id,
        text: getUserId(body) + 'Select a inspirational quote to *Send*',
        mrkdwn: true,
        attachments: [
            {
                text: image,
                image_url: image,
                attachment_type: 'default',
                callback_id: shuffleCallbackId,
                actions: [getAction('Send', 'primary', image), getAction('Reshuffle'), getAction('Cancel', 'danger')]
            }
        ]
    };

    return postSlackResponse(botPayload, body.response_url);
}

function handleSendRequest(payload) {
    const image = payload.actions[0].value;
    const botPayload = {
        response_type: 'in_channel',
        channel: payload.channel_id,
        replace_original: false,
        delete_original: true,
        text: getUserId(payload) + 'via /inspire',
        attachments: [
            {
                text: image,
                image_url: image
            }
        ]
    };
    return postSlackResponse(botPayload, payload.response_url);
}

function handleCancelRequest(payload) {
    return postSlackResponse({delete_original: true}, payload.response_url);
}

async function handleShuffleActionRequest(payload) {
    const action = payload.actions[0];
    if (action.name === 'send') {
        await handleSendRequest(payload);
    } else if (action.name === 'reshuffle') {
        await handleInitialRequest(payload);
    } else if (action.name === 'cancel') {
        await handleCancelRequest(payload);
    }
}

module.exports = async function(req, res) {
    try {
        if (req && req.body && req.body.payload) {
            const payload = JSON.parse(req.body.payload);
            await handleShuffleActionRequest(payload);
        } else {
            await handleInitialRequest(req);
        }
    } catch (err) {
        console.error(err.stack);
        await postSlackResponse(
            {
                response_type: 'ephemeral',
                text: 'Sorry, that didnt work. Please try again.',
                channel: req.body.channel_id
            },
            req.body.response_url
        );
    }
    return res.status(200).end();
};
