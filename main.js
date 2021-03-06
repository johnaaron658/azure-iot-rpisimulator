const IO = require('./lib/io');
const onStart = require('./lib/deviceMethod').onStart;
const onStop = require('./lib/deviceMethod').onStop;
const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;
const ProvisioningTransport = require('azure-iot-provisioning-device-mqtt').Mqtt;
const ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;
const SymmetricKeySecurityClient = require('azure-iot-security-symmetric-key').SymmetricKeySecurityClient;

exports.run = async({provisioningHost, idScope, registrationId, symmetricKey}) => {
  const provisioningSecurityClient = new SymmetricKeySecurityClient(registrationId, symmetricKey);
  const provisioningClient = ProvisioningDeviceClient.create(provisioningHost, idScope, new ProvisioningTransport(), provisioningSecurityClient);
  provisioningClient.setProvisioningPayload({
    modelId: 'dtmi:azurertos:devkit:gsgmxchip;2'
  });

  try {
    const result = await provisioningClient.register();
    console.log('registration succeeded');
    console.log('assigned hub=' + result.assignedHub);
    console.log('deviceId=' + result.deviceId);
    console.log('payload=' + JSON.stringify(result.payload));
    const connectionString = 'HostName=' + result.assignedHub + ';DeviceId=' + result.deviceId + ';SharedAccessKey=' + symmetricKey;

    // create a client
    const client = Client.fromConnectionString(connectionString, Protocol);

    client.open((err) => {
        if (err) {
            console.error('[IoT hub Client] Connect error: ' + err.message);
            return;
        } 

        // set cloud-to-device and device method callback
        client.onDeviceMethod('start', onStart);
        client.onDeviceMethod('stop', (req, res) => {
          client.close();
          onStop(req, res);
        });

        client.on('message', (msg) => {
          IO.blinkLED();
          var message = msg.getData().toString('utf-8');
          client.complete(msg, function () {
            console.log('Receive message: ' + message);
          });
        });

        // send telemetry data every 2 seconds
        setInterval(async() => {
          let data = await IO.readSensorData();
          data.deviceId = result.deviceId;
          let message = new Message(JSON.stringify(data));

          client.sendEvent(message, function (err) {
            if (err) {
              console.error('Failed to send message to Azure IoT Hub');
            } else {
              IO.blinkLED();
              console.log('Message sent to Azure IoT Hub');
            }
          });
        }, 10000);
    });
  } catch (err) {
    console.log("error registering device: " + err);
  }
};