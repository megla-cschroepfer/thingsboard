///
/// Copyright © 2016-2022 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import config from 'config';
import { _logger } from './config/logger';
import { HttpServer } from './api/httpServer';
import { IQueue } from './queue/queue.models';
import { KafkaTemplate } from './queue/kafkaTemplate';
import { PubSubTemplate } from './queue/pubSubTemplate';
import { AwsSqsTemplate } from './queue/awsSqsTemplate';
import { RabbitMqTemplate } from './queue/rabbitmqTemplate';
import { ServiceBusTemplate } from './queue/serviceBusTemplate';

const logger = _logger('main');

logger.info('===CONFIG BEGIN===');
logger.info(JSON.stringify(config, null, 4));
logger.info('===CONFIG END===');

const serviceType = config.get('queue_type');
const httpPort = Number(config.get('http_port'));
let queues: IQueue;
let httpServer: HttpServer;

(async () => {
    switch (serviceType) {
        case 'kafka':
            logger.info('Starting kafka template.');
            queues = await KafkaTemplate.build();
            logger.info('kafka template started.');
            break;
        case 'pubsub':
            logger.info('Starting Pub/Sub template.')
            queues = await PubSubTemplate.build();
            logger.info('Pub/Sub template started.')
            break;
        case 'aws-sqs':
            logger.info('Starting Aws Sqs template.')
            queues = await AwsSqsTemplate.build();
            logger.info('Aws Sqs template started.')
            break;
        case 'rabbitmq':
            logger.info('Starting RabbitMq template.')
            queues = await RabbitMqTemplate.build();
            logger.info('RabbitMq template started.')
            break;
        case 'service-bus':
            logger.info('Starting Azure Service Bus template.')
            queues = await ServiceBusTemplate.build();
            logger.info('Azure Service Bus template started.')
            break;
        default:
            logger.error('Unknown service type: ', serviceType);
            process.exit(-1);
    }

    httpServer = new HttpServer(httpPort);
})();

process.on('SIGTERM', () => {
    process.exit();
});

process.on('exit', async () => {
    if (httpServer) {
        httpServer.stop();
    }
    if (queues) {
        queues.exit(0);
    }
});

