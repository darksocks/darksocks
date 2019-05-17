import { Component, OnInit, Input } from '@angular/core';
import { DarksocksService } from 'app/darksocks.service';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.css']
})
export class RulesComponent implements OnInit {
  srv: DarksocksService;
  rules: string = ""
  message: string = ""
  @Input() set activated(v: boolean) {
  }
  constructor(srv: DarksocksService) {
    this.srv = srv
  }

  ngOnInit() {
    this.reload()
  }

  reload() {
    this.rules = this.srv.loadUserRules()
    if (this.rules == "") {
      this.rules = ""
      this.rules += "! Put user rules line by line in this file.\n"
      this.rules += "! See https://adblockplus.org/en/filter-cheatsheet\n"
      this.rules += "! example: ||github.com\n"
    }
  }
  save() {
    var m = this.srv.saveUserRules(this.rules);
    if (m != "OK") {
      this.message = m;
    }
    this.reload()
  }
}
