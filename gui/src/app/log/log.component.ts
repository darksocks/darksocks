import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { DarksocksService } from '../darksocks.service';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css']
})
export class LogComponent implements OnInit {
  @Input() set activated(v: boolean) {
  }
  @ViewChild("log") log: ElementRef
  srv: DarksocksService;
  max: number = 128 * 1024
  constructor(srv: DarksocksService) {
    this.srv = srv;
  }
  ngOnInit() {
    this.srv.handler.subscribe(n => {
      if (n.cmd == "log") {
        var m = this.log.nativeElement.innerText;
        if (m.length + n.m.length > this.max) {
          m = m.substring(m.length + n.m.length - this.max);
        }
        this.log.nativeElement.innerText = m + n.m;
        var logview = document.querySelector(".logview");
        logview.scrollTop = logview.scrollHeight;
      }
    })
  }
}
