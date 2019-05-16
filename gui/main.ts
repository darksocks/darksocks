require('source-map-support').install();
import { BrowserWindow, app, Menu, Tray, MenuItemConstructorOptions, ipcMain, MenuItem, nativeImage } from "electron"
import * as path from "path"
import * as log4js from "log4js"
import * as os from "os"
import * as fs from "fs"
import * as http from "http"
import * as assert from "assert"
import { spawn } from "child_process";
const Log = log4js.getLogger("main")

const homedir = os.homedir();

function httpGet(url): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        http.get(url, (res) => {
            const { statusCode } = res;
            if (statusCode !== 200) {
                res.resume();
                reject(new Error(`Status Code: ${statusCode}`))
                return;
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => { resolve(rawData) });
        }).on('error', (e) => { reject(e) });
    })
}

class DarkSocks {
    public homeDir = homedir;
    public workingFile: string = os.homedir() + "/.darksocks/darksocks.json";
    public runtimeFile: string = os.homedir() + "/.darksocks/runtime.json";
    public handler: DarkSocksHandler
    public status: string = "Stopped";
    private runner: any;
    private restarting: boolean
    constructor() {
    }
    public start() {
        if (this.status == "Running") {
            return "Running";
        }
        Log.info("darksocks is starting")
        this.runner = spawn(__dirname + '/../darksocks/darksocks', ["-c", "-f", this.workingFile]);
        this.runner.stdout.on('data', (data) => {
            console.log(data.toString().trim())
            if (this.handler) {
                this.handler.onLog(data.toString());
            }
            if (this.status != "Running") {
                this.status = "Running";
                this.handler.onStatus(this.status);
            }
        });
        this.runner.stderr.on('data', (data) => {
            console.error(data.toString().trim())
            if (this.handler) {
                this.handler.onLog(data.toString())
            }
            if (this.status != "Running") {
                this.status = "Running";
                this.handler.onStatus(this.status);
            }
        });
        this.runner.on('exit', (code) => {
            if (this.handler) {
                this.handler.onLog(`child process exited with code ${code}` + "\n");
            }
            this.status = "Stopped";
            this.handler.onStatus(this.status);
            if (this.restarting) {
                setTimeout(() => this.start(), 1000)
            }
        });
        this.runner.on('error', (e) => {
            if (this.handler) {
                this.handler.onLog(`child process error with ${e}` + "\n");
            }
            this.status = "Error"
            this.handler.onStatus(this.status);
        });
        this.status = "Pending"
        this.handler.onStatus(this.status);
        return "OK"
    }
    public stop() {
        if (this.status == "Stopped") {
            return "Stopped"
        }
        Log.info("darksocks is stopping")
        this.runner.kill()
        return "OK"
    }
    public restart() {
        if (this.status == "Stopped") {
            return "Stopped"
        }
        Log.info("darksocks is restarting")
        this.restarting = true
        this.stop()
        return "OK"
    }
    public loadConf(): any {
        Log.info(`load configure from ${this.workingFile}`)
        try {
            var data = fs.readFileSync(this.workingFile)
            return JSON.parse(data.toString());
        } catch (e) {
            return {};
        }
    }
    public saveConf(conf: any) {
        try {
            Log.info(`saving configure by ${JSON.stringify(conf)}`)
            let dir = path.dirname(this.workingFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir)
            }
            fs.writeFileSync(this.workingFile, JSON.stringify(conf));
            if (this.status != "Stopped") {
                this.restart()
            }
            return "OK"
        } catch (e) {
            return "" + e;
        }
    }
    public enableServer(index: number) {
        var conf = this.loadConf();
        for (var i = 0; i < conf.servers.length; i++) {
            conf.servers[i].enable = i == index
        }
        this.saveConf(conf)
    }
    public readRuntimeVar(): any {
        try {
            var data = fs.readFileSync(this.runtimeFile)
            return JSON.parse(data.toString());
        } catch (e) {
            return {};
        }
    }
}

export interface DarkSocksHandler {
    onLog(m: string)
    onStatus(s: string)
}


let darksocks = new DarkSocks()
let logLevel = "info"

function initial() {
    if (process.argv.length > 2) {
        logLevel = process.argv[2]
    }
    log4js.configure({
        appenders: {
            ruleConsole: { type: 'console' },
        },
        categories: {
            default: { appenders: ['ruleConsole'], level: logLevel }
        },
    });
    let tray = new Tray(__dirname + '/view/assets/stopped@4x.png')
    tray.setToolTip('This is DarkSocks')
    function callOpen(f: string) {
    }
    function clickMenu(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event) {
        let menu = menuItem as any;
        callOpen(menu.id)
    }
    function reloadMenu() {
        Log.info("reloading menu")
        let menus: MenuItemConstructorOptions[] = []
        let action = darksocks.status == "Stopped" ? "Start DarkSocks" : "Stop DarkSocks"
        menus.push(
            { label: 'DarkSocks:' + darksocks.status, type: 'normal', enabled: false },
            {
                label: action,
                type: 'normal',
                click: () => {
                    if (darksocks.status == "Stopped") {
                        darksocks.start()
                    } else if (darksocks.status == "Running") {
                        darksocks.stop()
                    }
                }
            },
            {
                label: 'Restart DarkSocks',
                type: 'normal',
                click: () => {
                    darksocks.restart()
                }
            },
        )
        let conf = darksocks.loadConf();
        if (conf.servers && conf.servers.length) {
            menus.push({ type: 'separator' })
            for (var i = 0; i < conf.servers.length; i++) {
                menus.push({
                    id: `server-${i}`,
                    checked: true && conf.servers[i].enable,
                    label: conf.servers[i].name,
                    type: 'checkbox',
                    click: (m) => {
                        darksocks.enableServer(parseInt((m as any).id.replace("server-", "")))
                        if (mainWindow) {
                            mainWindow.webContents.send("change-server","")
                        }
                        darksocks.restart()
                        reloadMenu()
                    },
                })
            }
        }
        menus.push(
            { type: 'separator' },
            {
                label: 'Show',
                type: 'normal',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                    } else {
                        createWindow();
                    }
                }
            },
            {
                label: 'Quit', type: 'normal', click: () => {
                    app.quit()
                }
            }
        )
        tray.setContextMenu(Menu.buildFromTemplate(menus))
    }
    darksocks.handler = {
        onLog: (m) => {
            if (mainWindow) {
                mainWindow.webContents.send("log", m)
            }
            // console.log(m.trim())
        },
        onStatus: (s) => {
            if (mainWindow) {
                mainWindow.webContents.send("status", s)
            }
            reloadMenu()
            Log.info("darksocks status change to ", s)
            if (s == "Running") {
                tray.setImage(__dirname + '/view/assets/running@4x.png')
                app.dock.setIcon(nativeImage.createFromPath(__dirname + '/view/assets/dock_running.png'))
            } else {
                tray.setImage(__dirname + '/view/assets/stopped@4x.png')
                app.dock.setIcon(nativeImage.createFromPath(__dirname + '/view/assets/dock_stopped.png'))
            }
        }
    }
    ipcMain.on("hideConfigure", () => {
        if (mainWindow) {
            mainWindow.hide()
        }
    })
    ipcMain.on("startDarksocks", (e) => {
        e.returnValue = darksocks.start()
    })
    ipcMain.on("stopDarksocks", (e) => {
        e.returnValue = darksocks.stop()
    })
    ipcMain.on("loadConf", (e) => {
        e.returnValue = darksocks.loadConf()
    })
    ipcMain.on("saveConf", (e, args) => {
        e.returnValue = darksocks.saveConf(args)
        reloadMenu()
    })
    ipcMain.on("loadStatus", (e) => {
        e.returnValue = darksocks.status;
    });
    ipcMain.on("hideConfigure", (e) => {
        if (mainWindow) {
            mainWindow.close();
        }
        e.returnValue = "OK"
    });
    reloadMenu()
    const template: MenuItemConstructorOptions[] = [
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'pasteandmatchstyle' },
                { role: 'delete' },
                { role: 'selectall' }
            ]
        },
        {
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    app.dock.setIcon(nativeImage.createFromPath(__dirname + '/view/assets/dock_stopped.png'))
}

let mainWindow: BrowserWindow
function createWindow() {
    mainWindow = new BrowserWindow({
        width: logLevel == "debug" ? 1500 : 1024,
        height: logLevel == "debug" ? 518 : 520,
        frame: logLevel == "debug",
        title: "DarkSocks",
    })
    mainWindow.on("close", () => {
        Log.info("main window is closed")
        mainWindow = null;
    })
    if (logLevel == "debug") {
        mainWindow.webContents.openDevTools()
    }
    mainWindow.loadFile(`dist/view/index.html`)
    app.dock.show()
}

app.on('ready', () => {
    initial()
    createWindow()
})

app.on('window-all-closed', () => {
    Log.info("all window is closed")
    app.dock.hide()
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

app.on("before-quit", (e) => {
    try {
        darksocks.handler = {
            onLog: (m) => { },
            onStatus: (s) => { }
        };
        darksocks.stop()
    } catch (e) {
    }
});

