import os, pty, sys, time, select, fcntl, termios, struct, json, re
out, cols, rows, maxsec = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
cmd = sys.argv[5:]
pid, fd = pty.fork()
if pid == 0:
    os.environ["TERM"] = "xterm-256color"
    os.execvp(cmd[0], cmd)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
start = time.time(); last = start; chunks = []; buf = b""; answered = set()
while time.time() - start < maxsec:
    r, _, _ = select.select([fd], [], [], 1.0)
    if fd in r:
        try: data = os.read(fd, 65536)
        except OSError: break
        if not data: break
        chunks.append([round(time.time() - start, 3), data.decode("utf-8", "replace")])
        buf = (buf + data)[-20000:]
        low = buf.lower()
        plain = re.sub(rb"\x1b\[[0-9;?>]*[A-Za-z]", b" ", buf).lower()
        if b"\x1b[c" in data: os.write(fd, b"\x1b[?62;22c")
        if b"trust" in plain and b"folder" in plain and "trust" not in answered:
            answered.add("trust"); time.sleep(0.8); os.write(fd, b"\x1b[B"); time.sleep(0.4); os.write(fd, b"\r")
        if b"file imports?" in plain and "imports" not in answered:
            answered.add("imports"); time.sleep(0.8); os.write(fd, b"\r")
        if b"your default permission mode?" in plain and "auto" not in answered:
            answered.add("auto"); time.sleep(1.5); os.write(fd, b"2"); time.sleep(1.0); os.write(fd, b"\r")
        last = time.time()
    elif chunks and time.time() - start > 90 and time.time() - last > 60:
        break
    try:
        done, status = os.waitpid(pid, os.WNOHANG)
        if done:
            print("child exited", status, file=sys.stderr); break
    except ChildProcessError: break
json.dump({"cols": cols, "rows": rows, "chunks": chunks}, open(out, "w"))
try: os.kill(pid, 9)
except ProcessLookupError: print("child already exited", file=sys.stderr)
