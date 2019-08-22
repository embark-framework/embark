import { __ } from 'embark-i18n';

class Storage {
  constructor(embark, options){
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.events = this.embark.events;
    this.storageConfig = embark.config.storageConfig;
    this.plugins = options.plugins;

    embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    this.storageNodes = {};
    this.events.setCommandHandler("storage:node:register", (clientName, startCb) => {
      this.storageNodes[clientName] = startCb;
    });

    this.events.setCommandHandler("storage:node:start", (storageConfig, cb) => {
      const clientName = storageConfig.upload.provider;
      const client = this.storageNodes[clientName];
      if (!client) return cb("storage " + clientName + " not found");

      client.apply(client, [
        () => {
          this.events.emit("storage:started", clientName);
          cb();
        }
      ]);
    });

    this.uploadNodes = {};
    this.events.setCommandHandler("storage:upload:register", (clientName, uploadCb) => {
      this.uploadNodes[clientName] = uploadCb;
    });

    this.events.setCommandHandler("storage:upload", (clientName, cb) => {
      const client = this.uploadNodes[clientName];
      if (!client) return cb("upload client for  " + clientName + " not found");
      client.apply(client, [cb]);
    });
  }

  addArtifactFile(_params, cb) {
    let config = {
      dappConnection: this.storageConfig.dappConnection
    };

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'config'],
      file: 'communication.json',
      format: 'json',
      content: config
    }, cb);
  }
}

module.exports = Storage;
