cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);
window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
console.log('Starting Receiver Manager');

// handler for the 'ready' event
castReceiverManager.onReady = function(event) {
  console.log('Received Ready event: ' + JSON.stringify(event.data));
  window.castReceiverManager.setApplicationState("Application status is ready...");
};

// handler for 'senderconnected' event
castReceiverManager.onSenderConnected = function(event) {
  console.log('Receiver Sender Connected event: ' + event.data);
  console.log(window.castReceiverManager.getSender(event.data).userAgent);
};

// handler for 'senderdisconnected' event
castReceiverManager.onSenderDisconnected = function(event) {
  console.log('Received Sender Disconnected event: ' + event.data);
  if (window.castReceiverManager.getSenders().length == 0) {
    window.close();
  }
};


// handler for 'systemvolumechanged' event
castReceiverManager.onSystemVolumeChanged = function(event) {
  console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' + event.data['muted']);
};

// create a CastMessageBus to handle messages for a custom namespace
window.messageBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.colten.fibgame');

// handler for the CastMessageBus message event
window.messageBus.onMessage = function(event) {
  console.log('Message [' + event.senderId + '] ' + event.data);
  // display the message from the sender
  displayText(event.data);
  // inform all sender on the CastMessageBus of the incoming message event
  // sender message listener wil be invoked
  window.messageBus.send(event.senderId, event.data);
  if (event.data == "test"){ 
    fsm.startGame();
  }
}

// initialize the CastReceiverManager with an application status message
window.castReceiverManager.start({statusText: "Application is starting"});
console.log('Receiver Manager started');

function displayText(text) {
  console.log(text);
  //vm.debugMsg = text;
  window.castReceiverManager.setApplicationState(text);
}
