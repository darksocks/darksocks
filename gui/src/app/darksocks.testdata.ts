export class MockIpcRenderer {
    public fail: boolean = false;
    public notWeb: boolean = false;
    conf = {
        "servers": [
            {
                "enable": true,
                "name": "test1",
                "address": [
                    "wss://127.0.0.1:5200/ds?skip_verify=1"
                ],
                "username": "test",
                "password": "123"
            }
        ],
        "share_addr": "0.0.0.0:1089",
        "manager_addr": "0.0.0.0:1180",
        "mode": "auto",
        "log": 0
    }
    events: any = {}
    timer: any = null
    timerc: number = 0
    public on(key, cb: () => void) {
        this.events[key] = cb
    }
    public sendSync(c, args) {
        switch (c) {
            case "startDarkSocks":
                return this.startDarkSocks()
            case "stopDarkSocks":
                return this.stopDarkSocks()
            case "loadConf":
                let c: any = {};
                Object.assign(c, this.conf);
                return c;
            case "saveConf":
                if (this.fail) {
                    return "mock error"
                }
                Object.assign(this.conf, args)
                return "OK"
        }
    }
    public startDarkSocks() {
        if (this.timer) {
            return
        }
        this.timerc = 0
        this.timer = setInterval(() => {
            if (this.timerc == 0 && this.events["status"]) {
                this.events["status"](this, "Running")
            }
            this.timerc++;
            if (this.events["log"]) {
                this.events["log"](this, `log ${this.timerc}`)
            }
        }, 100)
        this.events["status"](this, "Pending")
    }
    public stopDarkSocks() {
        clearInterval(this.timer)
        this.timer = null
        this.events["status"](this, "Stopped")
    }
}

export let URL = {
    parse: (u) => {
        let vals: any = {}
        let parts = u.split("//")
        vals.protocol = parts[0]
        parts = parts[1].split("@")
        if (parts.length > 1) {
            vals.auth = parts[0]
            parts = parts[1].split(":")
        } else {
            parts = parts[0].split(":")
        }
        vals.hostname = parts[0]
        if (parts.length > 1) {
            vals.port = parts[1]
        }
        return vals
    }
}

export function sleep(delay: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), delay)
    })
}