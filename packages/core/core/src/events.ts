import { __ } from 'embark-i18n';
const EventEmitter = require('events');
const cloneDeep = require('lodash.clonedeep');

function warnIfLegacy(eventName: string) {
  const legacyEvents: string[] = [];
  if (legacyEvents.indexOf(eventName) >= 0) {
    console.info(__("this event is deprecated and will be removed in future versions %s", eventName));
  }
}

export class EmbarkEmitter extends EventEmitter {

  constructor(options) {
    super();
    if (options) {
      this.debugLog = options.debugLog;
    } else {
      this.debugLog = {
        log: () => {},
        getStackTrace: () => { return ""; },
        isEnabled: () => { return false; }
      };
    }
  }

  emit(requestName, ...args) {
    warnIfLegacy(arguments[0]);
    return super.emit(requestName, ...args);
  }
}

EmbarkEmitter.prototype._maxListeners = 350;
const _on         = EmbarkEmitter.prototype.on;
const _once       = EmbarkEmitter.prototype.once;
const _setHandler = EmbarkEmitter.prototype.setHandler;
const _removeAllListeners = EmbarkEmitter.prototype.removeAllListeners;
const _emit       = EmbarkEmitter.prototype.emit;

const toFire = [];

EmbarkEmitter.prototype._emit = EmbarkEmitter.prototype.emit;

EmbarkEmitter.prototype.removeAllListeners = function(requestName) {
  delete toFire[requestName];
  return _removeAllListeners.call(this, requestName);
};

EmbarkEmitter.prototype.on = function(requestName, cb) {
  warnIfLegacy(requestName);
  return _on.call(this, requestName, cb);
};

EmbarkEmitter.prototype.once = function(requestName, cb) {
  warnIfLegacy(requestName);
  return _once.call(this, requestName, cb);
};

EmbarkEmitter.prototype.setHandler = function(requestName, cb) {
  warnIfLegacy(requestName);
  return _setHandler.call(this, requestName, cb);
};

EmbarkEmitter.prototype.request2 = function() {
  const requestName = arguments[0];
  const other_args: any[] = [].slice.call(arguments, 1);

  let requestId = this.debugLog.log({parent_id: this.logId, type: "request", name: requestName, inputs: other_args});

  warnIfLegacy(requestName);
  if (this._events && !this._events['request:' + requestName]) {

    if (this.debugLog.isEnabled()) {
      this.debugLog.log({ id: requestId, error: "no request listener for " + requestName});
      // KEPT for now until api refactor separating requests from commands
      console.log("made request without listener: " + requestName);
      console.trace();
    }
  }

  const promise = new Promise((resolve, reject) => {
    other_args.push(
      (err, ...res) => {
        if (err) {
          this.debugLog.log({id: requestId, msg: err, error: true});
          return reject(err);
        }

        if (res.length && res.length > 1) {
          this.debugLog.log({id: requestId, outputs: res});
          return resolve(res);
        }
        this.debugLog.log({id: requestId, outputs: res[0]});
        return resolve(res[0]);
      }
    );

    this._emit('request:' + requestName, ...other_args);
  });

  const ogStack = this.debugLog.getStackTrace();

  promise.catch((e) => {
    if (this.debugLog.isEnabled()) {
      console.dir(requestName);
      console.dir(ogStack);
    }

    this.debugLog.log({id: requestId, error: "promise exception", outputs: ogStack, stack: ogStack});
    return e;
  });

  return promise;
};

EmbarkEmitter.prototype.request = function() {
  const requestName = arguments[0];
  const other_args = [].slice.call(arguments, 1);

  let requestId = this.debugLog.log({parent_id: this.logId, type: "old_request", name: requestName, inputs: other_args});

  warnIfLegacy(requestName);
  if (this._events && !this._events['request:' + requestName]) {
    if (this.debugLog.isEnabled()) {
      this.debugLog.log({id: requestId, error: "no request listener for " + requestName});
      console.log("made request without listener: " + requestName);
      console.trace();
    }
  }
  const listenerName = 'request:' + requestName;

  // TODO: remove this, it will lead to illusion of things working when this situation shouldn't happen in the first place

  // if we don't have a command handler set for this event yet,
  // store it and fire it once a command handler is set
  if (!this.listeners(listenerName).length) {
    if (!toFire[listenerName]) {
      toFire[listenerName] = [];
    }
    toFire[listenerName].push(other_args);
    return;
  }

  // return this.emit(listenerName, ...other_args);
  return this._emit(listenerName, ...other_args);
};

// TODO: ensure that it's only possible to create 1 command handler
EmbarkEmitter.prototype.setCommandHandler = function(requestName, cb) {
  // log("SET COMMAND HANDLER", requestName);

  let requestId = this.debugLog.log({parent_id: this.logId, type: "setCommandHandler", name: requestName});
  let origin = this.debugLog.getStackTrace();

  const listener = function(_cb) {
    this.debugLog.log({id: requestId, output: origin, stack: origin});
    // log("== REQUEST RESPONSE", requestName, origin);
    cb.call(this, ...arguments);
  };
  const listenerName = 'request:' + requestName;

  // unlike events, commands can only have 1 handler
  _removeAllListeners.call(this, listenerName);

  // TODO: remove this, it will lead to illusion of things working when this situatio shouldnt' hapepn in the first place
  // if this event was requested prior to the command handler
  // being set up,
  // 1. delete the premature request(s) from the toFire array so they are not fired again
  // 2. Add an event listener for future requests
  // 3. call the premature request(s) bound
  const prematureListenerArgs = cloneDeep(toFire[listenerName]);
  if (prematureListenerArgs) {
    delete toFire[listenerName];
    // Assign listener here so that any requests bound inside the
    // initial listener callback will be bound (see unit tests for an example)
    this.on(listenerName, listener);
    prematureListenerArgs.forEach((prematureArgs) => {
      cb.call(this, ...prematureArgs);
    });
    return;
  }
  return this.on(listenerName, listener);
};

// TODO: deprecated/remove this
EmbarkEmitter.prototype.setCommandHandlerOnce = function(requestName, cb) {
  const listenerName = 'request:' + requestName;

  // if this event was requested prior to the command handler
  // being set up,
  // 1. delete the premature request(s) from the toFire array so they are not fired again
  // 2. call the premature request(s) bound
  // Do not bind an event listener for future requests as this is meant to be fired
  // only once.
  const prematureListenerArgs = cloneDeep(toFire[listenerName]);
  if (prematureListenerArgs) {
    delete toFire[listenerName];
    prematureListenerArgs.forEach((prematureArgs) => {
      cb.call(this, ...prematureArgs);
    });
    return;
  }

  return this.once(listenerName, function(_cb) {
    cb.call(this, ...arguments);
  });
};