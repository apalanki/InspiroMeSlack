const agent = require('superagent');

const shuffleCallbackId = 'inspirobot_shuffle';
const inspirobotUrl = 'http://inspirobot.me/api?generate=true';

function getUserId(body) {
    return '<@' + (body.user_id || body.user.id) + '>: ';
}

function requestInspiration() {
    return agent.get(inspirobotUrl)
        .then(res => res.text);
}

function postResponse(payload, responseUrl) {
    return agent.post(responseUrl)
        .send(JSON.stringify(payload));
}

const getAction = (buttonLabel, style, value) => ({
    name: buttonLabel.toLowerCase(), text: buttonLabel, type: 'button', value: value || buttonLabel.toLowerCase(), style
});

async function handleInitialRequest(req) {
    const inspireImage = await requestInspiration();
    const image = inspireImage || 'http://inspirobot.me/website/images/inspirobot-dark-green.png';

    const body = req.body || req;
    const botPayload = {
        channel: body.channel_id,
        text: getUserId(body) + 'Select a inspirational quote to *Send*',
        mrkdwn: true,
        attachments: [
            {
                text: image, image_url: image, attachment_type: 'default',
                callback_id: shuffleCallbackId,
                actions: [
                    getAction('Send', 'primary', image),
                    getAction('Reshuffle'), getAction('Cancel', 'danger')
                ]
            }
        ]
    };

    await postResponse(botPayload, body.response_url);
}

async function handleSendRequest(payload) {
    const image = payload.actions[0].value;
    const botPayload = {
        response_type: 'in_channel', channel: payload.channel_id,
        replace_original: false, delete_original: true,
        text: getUserId(payload) + 'via /inspire',
        attachments: [{
            text: image, image_url: image
        }]
    };
    await postResponse(botPayload, payload.response_url);
}

async function handleCancelRequest(payload) {
    const botPayload = {delete_original: true};
    await postResponse(botPayload, payload.response_url);
}

async function handleShuffleActionRequest(payload) {
    const action = payload.actions[0];
    if (action.name === 'send') {
        await handleSendRequest(payload);
    } else if (action.name === 'reshuffle') {
        await handleInitialRequest(payload);
    } else if (action.name === 'cancel') {
        await handleCancelRequest(payload)
    }
}

module.exports = async function (req, res) {
    try {
        if (req && req.body && req.body.payload) {
            const payload = JSON.parse(req.body.payload);
            await handleShuffleActionRequest(payload);
        } else {
            await handleInitialRequest(req);
        }
    } catch (err) {
        console.error(err.stack);
        postResponse({
            response_type: 'ephemeral', text: 'Sorry, that didnt work. Please try again.', channel: req.body.channel_id
        }, req.body.response_url);
    }
    return res.status(200).end();
};
