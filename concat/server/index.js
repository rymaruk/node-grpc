const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');
const path = require('path');

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

function cleanup(server) {
    console.log('Cleanup!')
    if(server) {
        server.forceShutdown()
    }
}

function concat(call, callback) {
    console.log('Concat was invoked!');

    const firstPhrase = call.request.first_phrase;
    const secondPhrase = call.request.second_phrase;

    callback(null, {
        result: `
            ${firstPhrase} >>> ${secondPhrase}
        `
    });
}

function concatManyTimes(call, _) {
    console.log('ConcatManyTimes was invoked!');

    const firstPhrase = call.request.first_phrase;
    const secondPhrase = call.request.second_phrase;
    const res = concatPackageDefinition.ConcatResponse;
    let i = 0;
    do {
        res.result = `
            ${firstPhrase} >>> ${secondPhrase} >>> ${i}
        `;

        call.write(res);
        i++;
    } while (i < 10);

    call.end();

}

function concatLong(call, callback) {
    console.log('ConcatLong was invoked!');

    let chunk = '';

    call.on('data', (req) => {
        const firstPhrase = req.first_phrase;
        const secondPhrase = req.second_phrase;
        chunk += `${firstPhrase} >>> ${secondPhrase}\n`
        console.log(req)
    });

    call.on('end', () => {
        callback(null, {
            result: chunk
        });
    });
}

function main() {
    const server = new grpc.Server();

    process.on('SIGINT', () => {
        console.log(`Caught interrupt signal`);
        cleanup(server);
    });
    server.addService(concatPackageDefinition.ConcatService.service, {
        concat: concat,
        concatManyTimes: concatManyTimes,
        concatLong: concatLong
    });
    server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err, _) => {
        if( err ) {
            return cleanup(server);
        }

        server.start();
    });

    console.log(`Listening on: ${addr}`)
}

main();