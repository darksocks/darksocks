package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/darksocks/darksocks/ds"
)

var clientConf string
var clientConfDir string
var client *ds.Client
var proxyServer *ds.SocksProxy
var managerServer net.Listener

//ClientServerConf is pojo for dark socks server configure
type ClientServerConf struct {
	Enable   bool     `json:"enable"`
	Name     string   `json:"name"`
	Address  []string `json:"address"`
	Username string   `json:"username"`
	Password string   `json:"password"`
	LastUsed int      `json:"-"`
}

//ClientConf is pojo for dark socks client configure
type ClientConf struct {
	Servers     []*ClientServerConf `json:"servers"`
	ShareAddr   string              `json:"share_addr"`
	ManagerAddr string              `json:"manager_addr"`
	Mode        string              `json:"mode"`
	LogLevel    int                 `json:"log"`
}

//Dial connection by remote
func (c *ClientConf) Dial(remote string) (raw io.ReadWriteCloser, err error) {
	for _, conf := range c.Servers {
		if conf.Enable && len(conf.Address) > 0 {
			address := conf.Address[conf.LastUsed]
			conf.LastUsed = (conf.LastUsed + 1) % len(conf.Address)
			if len(conf.Username) > 0 && len(conf.Password) > 0 {
				if strings.Contains(address, "?") {
					address += fmt.Sprintf("&username=%v&password=%v", conf.Username, conf.Password)
				} else {
					address += fmt.Sprintf("?username=%v&password=%v", conf.Username, conf.Password)
				}
			}
			ds.InfoLog("Client start connect one channel to %v", conf.Name)
			raw, err = ds.WebsocketDialer("").Dial(address)
			if err == nil {
				ds.InfoLog("Client connect one channel to %v success", conf.Name)
				conn := ds.NewStringConn(raw)
				conn.Name = conf.Name
				raw = conn
			} else {
				ds.WarnLog("Client connect one channel fail with %v", err)
			}
		}
		break
	}
	if raw == nil {
		err = fmt.Errorf("server not found")
	}
	return
}

//PAC is http handler to get pac js
func (c *ClientConf) PAC(res http.ResponseWriter, req *http.Request) {
	res.Header().Set("Content-Type", "application/x-javascript")
	//
	abpRaw, err := ioutil.ReadFile(filepath.Join(execDir(), "abp.js"))
	if err != nil {
		ds.ErrorLog("PAC read apb.js fail with %v", err)
		res.WriteHeader(500)
		fmt.Fprintf(res, "%v", err)
		return
	}
	abpStr := string(abpRaw)
	//
	//rules
	gfwRules, err := readGfwlist()
	if err != nil {
		ds.ErrorLog("PAC read gfwlist.txt fail with %v", err)
		res.WriteHeader(500)
		fmt.Fprintf(res, "%v", err)
		return
	}
	gfwRulesJS, _ := json.Marshal(gfwRules)
	abpStr = strings.Replace(abpStr, "__RULES__", string(gfwRulesJS), 1)
	//
	//proxy address
	if proxyServer == nil || proxyServer.Listener == nil {
		ds.ErrorLog("PAC load fail with socks proxy server is not started")
		res.WriteHeader(500)
		fmt.Fprintf(res, "%v", "socks proxy server is not started")
		return
	}
	//
	// socksProxy.
	parts := strings.SplitN(proxyServer.Addr().String(), ":", -1)
	abpStr = strings.Replace(abpStr, "__SOCKS5ADDR__", "127.0.0.1", -1)
	abpStr = strings.Replace(abpStr, "__SOCKS5PORT__", parts[len(parts)-1], -1)
	res.Write([]byte(abpStr))
}

//ChangeProxyMode is http handler to change proxy mode
func (c *ClientConf) ChangeProxyMode(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	_, err := changeProxyMode(mode)
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%v", err)
		return
	}
	c.Mode = mode
	err = ds.WriteJSON(clientConf, c)
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%v", err)
		return
	}
	fmt.Fprintf(w, "%v", "ok")
}

//UpdateGfwlist is http handler to update gfwlist.txt
func (c *ClientConf) UpdateGfwlist(w http.ResponseWriter, r *http.Request) {
	err := updateGfwlist()
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%v", err)
		return
	}
	fmt.Fprintf(w, "%v", "ok")
}

//LoadConf is http handler to load configure
func (c *ClientConf) LoadConf(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	data, _ := json.Marshal(c)
	w.Write(data)
}

//UpdateConf is http handler to update configure
func (c *ClientConf) UpdateConf(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	data, _ := ioutil.ReadAll(r.Body)
	err := json.Unmarshal(data, c)
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%v", err)
		return
	}
	err = ds.WriteJSON(clientConf, data)
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%v", err)
		return
	}
	fmt.Fprintf(w, "%v", "ok")
}

func startClient(c string) (err error) {
	conf := &ClientConf{}
	err = ds.ReadJSON(c, &conf)
	if err != nil {
		ds.ErrorLog("Client read configure fail with %v", err)
		exitf(1)
		return
	}
	if len(conf.ShareAddr) < 1 {
		ds.ErrorLog("Client share_addr is required")
		exitf(1)
		return
	}
	clientConf = c
	clientConfDir = filepath.Dir(clientConf)
	ds.SetLogLevel(conf.LogLevel)
	client = ds.NewClient(ds.DefaultBufferSize, conf)
	proxyServer = ds.NewSocksProxy()
	proxyServer.Dialer = func(target string, raw io.ReadWriteCloser) (sid uint64, err error) {
		client.ProcConn(raw, target)
		return
	}
	if len(conf.ManagerAddr) > 0 {
		mux := http.NewServeMux()
		mux.HandleFunc("/pac.js", conf.PAC)
		mux.HandleFunc("/changeProxyMode", conf.ChangeProxyMode)
		mux.HandleFunc("/updateGfwlist", conf.UpdateGfwlist)
		mux.HandleFunc("/loadConf", conf.LoadConf)
		mux.HandleFunc("/updateConf", conf.UpdateConf)
		server := &http.Server{Addr: conf.ManagerAddr, Handler: mux}
		managerServer, err = net.Listen("tcp", conf.ManagerAddr)
		if err != nil {
			ds.ErrorLog("Client start web server fail with %v", err)
			exitf(1)
			return
		}
		ds.InfoLog("Client start web server on %v", managerServer.Addr())
		go server.Serve(&ds.TCPKeepAliveListener{TCPListener: managerServer.(*net.TCPListener)})
	}
	if len(conf.Mode) < 1 {
		conf.Mode = "auto"
	}
	err = proxyServer.Listen(conf.ShareAddr)
	if err != nil {
		ds.ErrorLog("Client start proxy server fail with %v", err)
		exitf(1)
		return
	}
	changeProxyMode(conf.Mode)
	proxyServer.Run()
	return
}

func changeProxyMode(mode string) (message string, err error) {
	if proxyServer == nil || proxyServer.Listener == nil || managerServer == nil {
		err = fmt.Errorf("proxy server is not started")
		return
	}
	proxyServerParts := strings.Split(proxyServer.Addr().String(), ":")
	managerServerParts := strings.Split(managerServer.Addr().String(), ":")
	switch mode {
	case "auto":
		pacURL := fmt.Sprintf("http://127.0.0.1:%v/pac.js", managerServerParts[len(managerServerParts)-1])
		message, err = changeProxyModeNative("auto", pacURL)
	case "global":
		message, err = changeProxyModeNative("global", "127.0.0.1", proxyServerParts[len(proxyServerParts)-1])
	default:
		message, err = changeProxyModeNative("manual")
	}
	if err != nil {
		ds.WarnLog("change proxy mode to %v fail with %v, the log is\n%v\n", mode, err, message)
	} else {
		ds.InfoLog("change proxy mode to %v is success", mode)
	}
	return
}

func workDir() (dir string) {
	home, _ := os.UserHomeDir()
	dir = filepath.Join(home, ".darksocks")
	if _, err := os.Stat(dir); err != nil {
		os.MkdirAll(dir, os.ModePerm)
	}
	return
}

func execDir() (dir string) {
	dir, _ = exec.LookPath(os.Args[0])
	dir = filepath.Dir(dir)
	return
}

func readGfwlist() (rules []string, err error) {
	gfwFile := filepath.Join(workDir(), "gfwlist.txt")
	gfwRaw, err := ioutil.ReadFile(gfwFile)
	if err != nil {
		gfwFile = filepath.Join(execDir(), "gfwlist.txt")
		gfwRaw, err = ioutil.ReadFile(gfwFile)
		if err != nil {
			err = fmt.Errorf("read gfwlist.txt fail with %v", err)
			return
		}
	}
	gfwData, err := base64.StdEncoding.DecodeString(string(gfwRaw))
	if err != nil {
		err = fmt.Errorf("decode gfwlist.txt fail with %v", err)
		return
	}
	gfwRulesAll := strings.Split(string(gfwData), "\n")
	for _, rule := range gfwRulesAll {
		if strings.HasPrefix(rule, "[") || strings.HasPrefix(rule, "!") || len(strings.TrimSpace(rule)) < 1 {
			continue
		}
		rules = append(rules, rule)
	}
	return
}

func updateGfwlist() (err error) {
	if client != nil {
		err = fmt.Errorf("proxy server is not started")
		return
	}
	gfwData, err := client.HTTPGet("https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt")
	if err != nil {
		return
	}
	gfwFile := filepath.Join(workDir(), "gfwlist.txt")
	err = ioutil.WriteFile(gfwFile, gfwData, os.ModePerm)
	return
}
