import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('asccDesktop', {
  version: '0.1.0-alpha.0',
  runtime: 'electron-preload',
});
