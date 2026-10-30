Option Explicit

Dim shell, scriptPath, command
Set shell = CreateObject("WScript.Shell")

scriptPath = Replace(WScript.ScriptFullName, "start-dev-hidden.vbs", "start-dev-hidden.ps1")
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptPath & """"

' Window style 0 keeps the supervisor and all of its launch chain invisible.
' The final False detaches it from this launcher so it survives terminal/Codex exits.
shell.Run command, 0, False
