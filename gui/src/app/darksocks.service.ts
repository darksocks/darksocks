import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
declare var ipcRenderer: any;

@Injectable({
  providedIn: 'root'
})
export class DarksocksService {
  public handler = new Subject<any>()
  constructor() {
    ipcRenderer.on("log", (e, m) => {
      this.handler.next({ cmd: "log", m: m })
    })
    ipcRenderer.on("status", (e, m) => {
      this.handler.next({ cmd: "status", status: m })
    })
    ipcRenderer.on("change-server", (e, m) => {
      this.handler.next({ cmd: "change-server", status: "" })
    })
  }
  public startDarksocks() {
    return ipcRenderer.sendSync("startDarksocks", {})
  }
  public stopDarksocks() {
    return ipcRenderer.sendSync("stopDarksocks", {})
  }
  public loadConf() {
    return ipcRenderer.sendSync("loadConf", {})
  }
  public saveConf(conf: any) {
    return ipcRenderer.sendSync("saveConf", conf)
  }
  public loadStatus() {
    return ipcRenderer.sendSync("loadStatus")
  }
  public loadUserRules() {
    return ipcRenderer.sendSync("loadUserRules")
  }
  public saveUserRules(rules) {
    return ipcRenderer.sendSync("saveUserRules", rules)
  }
  public async updateGfwList() {
    ipcRenderer.send("updateGfwList")
    return new Promise<string>((resolve) => {
      ipcRenderer.on('updateGfwListDone', (e, m) => {
        resolve(m);
      })
    })
  }
}