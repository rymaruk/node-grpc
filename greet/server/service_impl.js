const pb = require('../proto/greet_pb');

exports.greet = (call, callback) => {
    console.log('Greet was invoked!');

    const res = new pb.GreetResponse()
        .setResult(`Hello ${call.request.getFirstName()}`)

    callback(null, res);
}