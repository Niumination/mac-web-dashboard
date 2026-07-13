#!/usr/bin/env bash
# HexStrike AI Server Manager
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$DIR/venv/bin/python"
LAUNCHER="$DIR/launch_server.py"
PIDFILE="$DIR/hexstrike.pid"
PORT="${HEXSTRIKE_PORT:-8888}"

case "${1:-status}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "HexStrike already running (PID $(cat "$PIDFILE"))"
      exit 0
    fi
    nohup "$VENV" "$LAUNCHER" > "$DIR/hexstrike.log" 2>&1 &
    echo $! > "$PIDFILE"
    echo "HexStrike started (PID $!) on port $PORT"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      PID=$(cat "$PIDFILE")
      kill "$PID" 2>/dev/null || true
      rm -f "$PIDFILE"
      echo "HexStrike stopped"
    else
      echo "No PID file found"
    fi
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "running (PID $(cat "$PIDFILE"))"
    else
      echo "stopped"
    fi
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
