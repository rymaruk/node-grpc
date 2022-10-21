const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');
const path = require('path');
const _ = require('lodash');

const addr = 'localhost:50051';

const concatProtoPath = path.join(__dirname, '..', 'proto', 'concat.proto');
const concatProtoDefinition = protoLoader.loadSync(concatProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    default: true,
    oneofs: true
});

const concatPackageDefinition = grpc.loadPackageDefinition(concatProtoDefinition).concat;
const client = new concatPackageDefinition.ConcatService(addr, grpc.credentials.createInsecure())

function doConcat() {
    console.log('doConcat was invoked');

    const req = {
        first_phrase: 'Hello',
        second_phrase: 'World'
    }

    client.concat(req, (err, res) => {
        if(err) {
            return console.log(err)
        }

        console.log(`Result > ${res.result}`)
    })
}

function doConcatManyTimes() {
    console.log('doConcatManyTimes was invoked');

    const req = {
        first_phrase: 'Hello',
        second_phrase: 'World'
    }

    const call = client.concatManyTimes(req);

    call.on('data', (res) => {
        console.log(`
            ConcatManyTimes: ${res.result}
        `);
    })
}

function doConcatLong() {
    const phrases = ['Hello', 'world!', 'You', '', 'look', 'good', '!'];

    const call = client.concatLong((err, res) => {
        if (err) return console.log(err);
        console.log('doConcatLong', res);
    });

    phrases.forEach((item, i) => {
        if((i % 2) === 0) {
            const req = Object.assign({}, concatPackageDefinition.ConcatRequest);
            req.first_phrase = phrases[i];
            req.second_phrase = phrases[i+1];
            call.write(req)
        }
    });
    call.end();
}

function main() {
    // doConcat();
    // doConcatManyTimes();
    doConcatLong()
}

main();