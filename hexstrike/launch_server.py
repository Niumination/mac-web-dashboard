#!/usr/bin/env python3
"""HexStrike AI Server Launcher for macOS — stubs out heavy dependencies"""
import sys
import types
import os

class _Stub:
    def __getattr__(self, name):
        return _Stub()
    def __call__(self, *args, **kwargs):
        return _Stub()

stub = _Stub()

# selenium tree
sys.modules["selenium"] = stub
sys.modules["selenium.webdriver"] = stub
sys.modules["selenium.webdriver.chrome"] = stub
sys.modules["selenium.webdriver.chrome.options"] = stub
sys.modules["selenium.webdriver.common"] = stub
sys.modules["selenium.webdriver.common.by"] = stub
sys.modules["selenium.webdriver.support"] = stub
sys.modules["selenium.webdriver.support.ui"] = stub
sys.modules["selenium.webdriver.support.expected_conditions"] = stub
sys.modules["selenium.common"] = stub
sys.modules["selenium.common.exceptions"] = stub

# mitmproxy tree
sys.modules["mitmproxy"] = stub
sys.modules["mitmproxy.http"] = stub
sys.modules["mitmproxy.tools"] = stub
sys.modules["mitmproxy.tools.dump"] = stub
sys.modules["mitmproxy.options"] = stub

# pwn / pwntools
pwn_mod = types.ModuleType("pwn")
def pwn_stub(*args, **kwargs):
    return stub
pwn_stub.flat = b""
pwn_stub.p32 = lambda x, *a, **kw: b""
pwn_stub.p64 = lambda x, *a, **kw: b""
pwn_stub.u32 = lambda x, *a, **kw: 0
pwn_stub.u64 = lambda x, *a, **kw: 0
pwn_mod.context = type(sys)("context")
pwn_mod.context.log_level = "error"
sys.modules["pwn"] = pwn_mod

# angr
sys.modules["angr"] = stub

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "repo"))

from hexstrike_server import app

if __name__ == "__main__":
    port = int(os.environ.get("HEXSTRIKE_PORT", 8888))
    host = os.environ.get("HEXSTRIKE_HOST", "127.0.0.1")
    print(f"Starting HexStrike AI on {host}:{port}")
    app.run(host=host, port=port, threaded=True)
