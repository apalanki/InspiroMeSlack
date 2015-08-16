var request = require('request');

module.exports = function (req, res, next) {
  var errimage = 'http://inspirobot.me/website/images/inspirobot-dark-green.png';
  request('http://inspirobot.me/api?generate=true', function (error, response, body) {
    var botPayload = {
      channel : req.body.channel_id
    };
    if (!error && response.statusCode == 200) {
      botPayload.text = body;
      // send Payload
      send(botPayload, function (error, status, body) {
        if (error) {
          return next(error);
        } else {
          botPayload.text = errimage;
          return res.status(200).json(botPayload);
        }
      });
    }
    else {
      botPayload.text = errimage;
      return res.status(200).json(botPayload);
    }
  });
}

function send (payload, callback) {
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services' + path;

  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload)
  }, function (error, response, body) {
    if (error) {
      return callback(error);
    }

    callback(null, response.statusCode, body);
  });
}