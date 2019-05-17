import { Component, OnInit, Input, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { DarksocksService } from '../darksocks.service';

@Component({
  selector: 'app-conf',
  templateUrl: './conf.component.html',
  styleUrls: ['./conf.component.css']
})
export class ConfComponent implements OnInit {
  srv: DarksocksService;
  ref: ChangeDetectorRef
  conf: any = {}
  server: any = {}
  message: string = ""
  dimissDelay: number = 4000
  showError: boolean = false
  @ViewChild("ugfw") ugfw: ElementRef
  @Input() set activated(v: boolean) {
  }
  constructor(srv: DarksocksService, ref: ChangeDetectorRef) {
    this.srv = srv;
    this.ref = ref;
  }
  ngOnInit() {
    this.srv.handler.subscribe(n => {
      if (n.cmd == "change-server") {
        this.reload()
        this.ref.detectChanges()
      }
    })
    this.reload();
  }
  reload() {
    this.conf = this.srv.loadConf()
    console.log("load config ", this.conf);
  }
  remove(i: number) {
    this.conf.servers && this.conf.servers.splice(i, 1);
  }
  add() {
    if (!this.server.name || !this.server.addr || !this.server.username || !this.server.password) {
      this.showError = true
      return;
    }
    this.showError = false
    var s = {
      enable: true && this.server.enable,
      name: this.server.name,
      address: [this.server.addr],
      username: this.server.username,
      password: this.server.password,
    }
    console.log("add server ", s);
    if (!this.conf.servers) {
      this.conf.servers = []
    }
    this.conf.servers.push(s);
    if (s.enable) {
      for (var i = 0; i < this.conf.servers.length; i++) {
        if (this.conf.servers[i] == s) {
          continue;
        }
        this.conf.servers[i].enable = false;
      }
    }
    this.server = {};
  }
  enable(e, i, s) {
    s.enable = e.target.checked
    if (s.enable) {
      for (var j = 0; j < this.conf.servers.length; j++) {
        if (this.conf.servers[j] == s) {
          continue;
        }
        this.conf.servers[j].enable = false;
      }
    }
  }
  save() {
    let c = Object.assign({}, this.conf)
    if (c.log) {
      c.log = parseInt(c.log)
    }
    console.log("saving config ", c)
    let res = this.srv.saveConf(c)
    if (res == "OK") {
      this.showMessage("saved")
    } else {
      this.showMessage("save fail by " + res)
    }
  }
  async updateGfwList() {
    if (this.ugfw.nativeElement.innerHTML == "updating") {
      return;
    }
    this.ugfw.nativeElement.innerHTML = "updating"
    var m = await this.srv.updateGfwList()
    this.ugfw.nativeElement.innerHTML = "UpdateGfwList"
    if (m == "OK") {
      this.message = "Update GFW list success"
    } else {
      this.message = m
    }
  }
  showMessage(m: string) {
    this.message = m;
    setTimeout(() => this.message = "", this.dimissDelay);
  }
}
