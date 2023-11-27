##

windows 中处理端口号的指令

netstat -aon|findstr "port" 查看端口号被那个PID占用

tasklist|findstr "PID" 查看PID被那个进程、程序占用

taskkill /PID 16016