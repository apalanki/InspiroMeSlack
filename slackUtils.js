'use strict';

const shuffleCallbackId = 'inspirobot_shuffle';

const getUserId = (body) => '<@' + (body.user_id || body.user.id) + '>: ';

const getAction = (buttonLabel, style, value) => ({
    name: buttonLabel.toLowerCase(),
    text: buttonLabel,
    type: 'button',
    value: value || buttonLabel.toLowerCase(),
    style
});

module.exports = {shuffleCallbackId, getAction, getUserId};
