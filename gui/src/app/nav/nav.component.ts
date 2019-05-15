import { Component, OnInit, EventEmitter, Output, Input, ChangeDetectorRef } from '@angular/core';
import { DarksocksService } from '../darksocks.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  @Output() switch = new EventEmitter<{ key: string }>();
  @Input() public activated: string = "conf"
  status: string = "Stopped"
  srv: DarksocksService;
  ref: ChangeDetectorRef
  constructor(srv: DarksocksService, ref: ChangeDetectorRef) {
    this.srv = srv;
    this.ref = ref;
  }
  ngOnInit() {
    this.srv.handler.subscribe(n => {
      if (n.cmd == "status") {
        this.status = n.status;
        this.ref.detectChanges()
        console.log("darksocks status is ", this.status);
      }
    })
    this.status = this.srv.loadStatus();
  }
  doItemClick(key: string) {
    this.activated = key
    this.switch.emit({ key: key })
  }
  doTaskAction() {
    if (this.status == "Running") {
      this.srv.stopDarksocks()
    } else {
      this.srv.startDarksocks()
      this.status = "Pending"
    }
  }
  taskStatusClass() {
    switch (this.status) {
      case "Running":
        return "nav-running"
      case "Pending":
        return "nav-pending"
      default:
        return "nav-stopped"
    }
  }
  taskActionText(): string {
    switch (this.status) {
      case "Running":
        return "Stop"
      case "Pending":
        return "Pending"
      default:
        return "Start"
    }
  }
}
