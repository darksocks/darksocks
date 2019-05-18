export class MockIpcRenderer {
    public fail: boolean = false;
    public notWeb: boolean = false;
    conf = {
        "socks_addr": "0.0.0.0:1089",
        "http_addr": "0.0.0.0:1087",
        "manager_addr": "0.0.0.0:1180",
        "mode": "auto",
        "log": 0
    }
    events: any = {}
    timer: any = null
    timerc: number = 0
    status: string = "Stopped"
    rules: string = ""
    public on(key, cb: () => void) {
        this.events[key] = cb
    }
    public emit(key, args) {
        this.events[key](this, args)
    }
    public send(c, args) {
        console.log("MockIpcRenderer send by ", c, args)
        switch (c) {
            case "updateGfwList":
                setTimeout(() => {
                    if (this.fail) {
                        this.events["updateGfwListDone"](this, "mock error")
                    } else {
                        this.events["updateGfwListDone"](this, "OK")
                    }
                }, 300)
                return "OK"
        }
    }
    public sendSync(c, args) {
        console.log("MockIpcRenderer sendSync by ", c, args)
        switch (c) {
            case "loadStatus":
                return this.status
            case "startDarksocks":
                return this.startDarkSocks()
            case "stopDarksocks":
                return this.stopDarkSocks()
            case "loadConf":
                let c: any = {};
                Object.assign(c, this.conf)
                return c;
            case "saveConf":
                if (this.fail) {
                    return "mock error"
                }
                Object.assign(this.conf, args)
                return "OK"
            case "loadUserRules":
                return this.rules
            case "saveUserRules":
                if (this.fail) {
                    return "mock error"
                }
                this.rules = args
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
                this.status = "Running"
            }
            this.timerc++;
            if (this.events["log"]) {
                this.events["log"](this, `log ${this.timerc}`)
            }
        }, 100)
        this.events["status"](this, "Pending")
        this.status = "Pending"
        console.log("MockIpcRenderer darksocks is starting")
    }
    public stopDarkSocks() {
        clearInterval(this.timer)
        this.timer = null
        this.events["status"](this, "Stopped")
        this.status = "Stopped"
        console.log("MockIpcRenderer darksocks is stopped")
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