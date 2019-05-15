require('source-map-support').install();
import { BrowserWindow, app, Menu, Tray, MenuItemConstructorOptions, ipcMain, MenuItem, nativeImage } from "electron"
import * as path from "path"
import * as log4js from "log4js"
import * as os from "os"
import * as fs from "fs"
import * as url from "url"
import { spawn } from "child_process";
const Log = log4js.getLogger("main")

const homedir = os.homedir();

class DarkSocks {
    public homeDir = homedir;
    public workingFile: string = os.homedir() + "/.darksocks/darksocks.json";
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
            if (this.handler) {
                this.handler.onLog(data.toString());
            }
            if (this.status != "Running") {
                this.status = "Running";
                this.handler.onStatus(this.status);
            }
        });
        this.runner.stderr.on('data', (data) => {
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
        try {
            var data = fs.readFileSync(this.workingFile)
            return JSON.parse(data.toString());
        } catch (e) {
            return {};
        }
    }
    public saveConf(conf: any) {
        try {
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
}

export interface DarkSocksHandler {
    onLog(m: string)
    onStatus(s: string)
}


let darksocks = new DarkSocks()

let mainWindow: BrowserWindow
function createWindow() {
    let level = "info"
    if (process.argv.length > 2) {
        level = process.argv[2]
    }
    log4js.configure({
        appenders: {
            ruleConsole: { type: 'console' },
        },
        categories: {
            default: { appenders: ['ruleConsole'], level: level }
        },
    });
    let tray = new Tray(__dirname + '/view/assets/stopped@4x.png')
    tray.setToolTip('This is DarkSocks')
    mainWindow = new BrowserWindow({
        width: level == "debug" ? 1500 : 1024,
        height: level == "debug" ? 518 : 520,
        frame: level == "debug",
        title: "DarkSocks",
    })
    mainWindow.on("close", () => {
        mainWindow = null;
    })
    if (level == "debug") {
        mainWindow.webContents.openDevTools()
    }
    mainWindow.loadFile(`dist/view/index.html`)
    function callOpen(f: string) {
    }
    function clickMenu(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event) {
        let menu = menuItem as any;
        callOpen(menu.id)
    }
    function reloadMenu() {
        let menus: MenuItemConstructorOptions[] = []
        menus.push(
            { label: 'DarkSocks ' + darksocks.status, type: 'normal', enabled: false },
            {
                label: 'DarkSocks Start/Stop', type: 'normal', click: () => {
                    if (darksocks.status == "Stopped") {
                        darksocks.start()
                    } else if (darksocks.status == "Running") {
                        darksocks.stop()
                    }
                }
            },
            {
                label: 'DarkSocks Restart', type: 'normal', click: () => {
                    darksocks.restart()
                }
            },
        )
        let conf = darksocks.loadConf();
        if (conf.servers && conf.servers.length) {
            menus.push({ type: 'separator' })
            for (var i = 0; i < conf.servers.length; i++) {
                menus.push({
                    icon: conf.servers[i].enable ? nativeImage.createFromPath(__dirname + '/view/assets/server_using.png') : "",
                    label: conf.servers[i].name,
                    type: 'normal',
                    click: () => {

                    }
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
            //Log.info(m);
        },
        onStatus: (s) => {
            if (mainWindow) {
                mainWindow.webContents.send("status", s)
            }
            reloadMenu()
            Log.info("change to ", s)
            if (s == "Running") {
                tray.setImage(__dirname + '/view/assets/running@4x.png')
            } else {
                tray.setImage(__dirname + '/view/assets/stopped@4x.png')
            }
        }
    }
    ipcMain.on("hideConfigure", () => {
        mainWindow.hide()
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
        console.log("saving config ", args);
        e.returnValue = darksocks.saveConf(args)
    })
    ipcMain.on("loadStatus", (e) => {
        e.returnValue = darksocks.status;
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
}

app.on('ready', () => {
    createWindow()
})

app.on('window-all-closed', () => {
    mainWindow == null;
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

