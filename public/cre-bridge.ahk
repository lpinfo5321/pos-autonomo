; ============================================================
;  BRIDGE v15: Kiosco -> Cash Register Express
;
;  CAMBIOS CLAVE:
;  - Usa WinWait con titulo EXACTO "Item Not Found!" (modo 1)
;  - El Enter hotkey espera el dialogo de forma sincrona
;  - Log automatico en C:\cre-bridge-log.txt para diagnostico
;  - Auto-elevacion a Administrador
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1

; ── AUTO-ELEVAR A ADMINISTRADOR ──────────────────────────────────────────────
if !A_IsAdmin
{
  try
  {
    Run *RunAs "%A_AhkPath%" "%A_ScriptFullPath%"
    ExitApp
  }
  catch
  {
    MsgBox, 16, Bridge CRE, Necesita permisos de Administrador.`nHaz clic derecho -> Ejecutar como administrador.
    ExitApp
  }
}

API_BASE := "https://pos-app-taupe.vercel.app"
LOG_FILE := "C:\cre-bridge-log.txt"

global busy              := false
global capturedOrderNum  := ""
global scanBuffer        := ""
global scanLastKeyTime   := 0
global lastProcessed     := ""
global lastProcessedTime := 0
global g_plu             := ""

; Limpiar log anterior
FileDelete, %LOG_FILE%
GoSub, WriteLog_Init

TrayTip, Bridge CRE v15 ✓ ADMIN, Listo. Log: C:\cre-bridge-log.txt, 6

; Timer de respaldo para cerrar dialogos
SetTimer, WatchDialog, 100
return

; ─────────────────────────────────────────────────────────────────────────────
WriteLog_Init:
  FileAppend, ================================================`n, %LOG_FILE%
  FileAppend, Bridge CRE v15 - %A_Now%`n, %LOG_FILE%
  FileAppend, Admin: %A_IsAdmin%`n, %LOG_FILE%
  FileAppend, ================================================`n`n, %LOG_FILE%
  return

; ─────────────────────────────────────────────────────────────────────────────
; CAPTURA DE DIGITOS
~*0::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "0"
    scanLastKeyTime := A_TickCount
  }
  return
~*1::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "1"
    scanLastKeyTime := A_TickCount
  }
  return
~*2::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "2"
    scanLastKeyTime := A_TickCount
  }
  return
~*3::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "3"
    scanLastKeyTime := A_TickCount
  }
  return
~*4::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "4"
    scanLastKeyTime := A_TickCount
  }
  return
~*5::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "5"
    scanLastKeyTime := A_TickCount
  }
  return
~*6::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "6"
    scanLastKeyTime := A_TickCount
  }
  return
~*7::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "7"
    scanLastKeyTime := A_TickCount
  }
  return
~*8::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "8"
    scanLastKeyTime := A_TickCount
  }
  return
~*9::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "9"
    scanLastKeyTime := A_TickCount
  }
  return

; ─────────────────────────────────────────────────────────────────────────────
; ENTER: Esperar dialogo de forma SINCRONA con titulo EXACTO
~*Enter::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    buf        := scanBuffer
    scanBuffer := ""

    if (buf = "")
      return
    if buf is not integer
      return
    n := buf + 0
    if (n < 1 || n > 99999)
      return

    ; Loguear captura
    FileAppend, [ENTER] Buffer capturado: "%buf%"`n, %LOG_FILE%

    capturedOrderNum := buf
    busy             := true

    ; ESPERAR hasta 3 segundos al dialogo con titulo EXACTO
    SetTitleMatchMode, 1
    WinWait, Item Not Found!, , 3
    foundDlg := !ErrorLevel

    FileAppend, [ENTER] WinWait resultado: %foundDlg%`n, %LOG_FILE%

    if !foundDlg
    {
      ; Intentar con modo substring por si el titulo difiere
      SetTitleMatchMode, 2
      IfWinExist, Item Not Found
      {
        WinGetTitle, dlgTitle, Item Not Found
        FileAppend, [ENTER] Encontrado con modo 2: "%dlgTitle%"`n, %LOG_FILE%
        foundDlg := true
      }
    }

    if !foundDlg
    {
      ; Ultimo intento: cualquier dialogo (#32770)
      SetTitleMatchMode, 2
      IfWinExist, ahk_class #32770
      {
        WinGetTitle, dlgTitle, ahk_class #32770
        FileAppend, [ENTER] Dialogo #32770 encontrado: "%dlgTitle%"`n, %LOG_FILE%
        foundDlg := true
      }
    }

    if !foundDlg
    {
      FileAppend, [ENTER] No se encontro ningun dialogo. Abortando.`n`n, %LOG_FILE%
      busy := false
      return
    }

    ; Verificar anti-duplicado
    now := A_TickCount
    if (buf = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      FileAppend, [ENTER] Anti-duplicado: orden %buf% ya procesada.`n`n, %LOG_FILE%
      GoSub, CerrarDialogo
      busy := false
      TrayTip, Bridge CRE, Orden #%buf% ya procesada., 3
      return
    }

    lastProcessed     := buf
    lastProcessedTime := A_TickCount
    orderNum          := buf

    GoSub, CerrarDialogo
    Sleep, 400

    FileAppend, [ENTER] Iniciando ProcesarOrden para #%orderNum%`n, %LOG_FILE%
    GoSub, ProcesarOrden
  }
  return

; ─────────────────────────────────────────────────────────────────────────────
; TIMER DE RESPALDO - detecta dialogo si el Enter no lo capturo
WatchDialog:
  if busy
    return

  found := false
  SetTitleMatchMode, 1
  IfWinExist, Item Not Found!
    found := true
  if !found
  {
    SetTitleMatchMode, 2
    IfWinExist, Item Not Found
      found := true
  }

  if !found
    return

  ; Hay dialogo pero busy=false (Enter no lo capturo)
  orderNum        := capturedOrderNum
  capturedOrderNum := ""

  if orderNum is not integer
  {
    FileAppend, [TIMER] Dialogo sin numero valido. Cerrando.`n, %LOG_FILE%
    GoSub, CerrarDialogo
    return
  }

  now := A_TickCount
  if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
  {
    GoSub, CerrarDialogo
    TrayTip, Bridge CRE, Orden #%orderNum% ya procesada., 3
    return
  }

  busy              := true
  lastProcessed     := orderNum
  lastProcessedTime := A_TickCount

  FileAppend, [TIMER] Procesando orden #%orderNum%`n, %LOG_FILE%

  GoSub, CerrarDialogo
  Sleep, 400
  GoSub, ProcesarOrden
  return

; ─────────────────────────────────────────────────────────────────────────────
; CERRAR DIALOGO - multiple metodos
CerrarDialogo:
  SetTitleMatchMode, 1
  IfWinExist, Item Not Found!
  {
    WinActivate, Item Not Found!
    Sleep, 100
    Send {Enter}
    Sleep, 80
    ControlClick, Button1, Item Not Found!
    FileAppend, [CLOSE] Dialogo cerrado (titulo exacto).`n, %LOG_FILE%
    return
  }
  SetTitleMatchMode, 2
  IfWinExist, Item Not Found
  {
    WinActivate, Item Not Found
    Sleep, 100
    Send {Enter}
    Sleep, 80
    ControlClick, Button1, Item Not Found
    FileAppend, [CLOSE] Dialogo cerrado (substring).`n, %LOG_FILE%
    return
  }
  IfWinExist, ahk_class #32770
  {
    WinActivate, ahk_class #32770
    Sleep, 100
    Send {Enter}
    Sleep, 80
    ControlClick, Button1, ahk_class #32770
    FileAppend, [CLOSE] Dialogo cerrado (clase #32770).`n, %LOG_FILE%
  }
  return

; ─────────────────────────────────────────────────────────────────────────────
; TIPEAR UN PLU
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return
  WinActivate, Cash Register Express
  Sleep, 120
  SendInput % g_plu
  Sleep, 60
  SendInput {Enter}
  Loop, 7
  {
    Sleep, 100
    SetTitleMatchMode, 1
    IfWinExist, Item Not Found!
    {
      WinActivate, Item Not Found!
      Sleep, 50
      Send {Enter}
      ControlClick, Button1, Item Not Found!
      Sleep, 120
      break
    }
  }
  return

; ─────────────────────────────────────────────────────────────────────────────
; PROCESAR ORDEN: API + tipear PLUs
ProcesarOrden:
  SetTitleMatchMode, 2
  TrayTip, Bridge CRE, Buscando orden #%orderNum%..., 2

  url := API_BASE . "/api/orders/pos/" . orderNum
  whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")

  try
  {
    whr.Open("GET", url, false)
    whr.Send()
  }
  catch e
  {
    FileAppend, [API] Sin conexion.`n`n, %LOG_FILE%
    TrayTip, Bridge CRE, Sin conexion., 4
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

  FileAppend, [API] Status: %httpStatus%`n, %LOG_FILE%

  if (httpStatus = 404)
  {
    TrayTip, Bridge CRE, Orden #%orderNum% no encontrada., 5
    busy := false
    return
  }
  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error %httpStatus%, 4
    busy := false
    return
  }

  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, CRE no esta abierto., 4
    busy := false
    return
  }

  json       := httpBody
  pos        := 1
  itemsAdded := 0

  Loop
  {
    startBrace := InStr(json, "{", false, pos)
    if (startBrace = 0)
      break

    depth    := 0
    endBrace := 0
    i        := startBrace
    Loop, % StrLen(json) - startBrace + 1
    {
      ch := SubStr(json, i, 1)
      if (ch = "{")
        depth++
      else if (ch = "}")
      {
        depth--
        if (depth = 0)
        {
          endBrace := i
          break
        }
      }
      i++
    }
    if (endBrace = 0)
      break

    itemJson := SubStr(json, startBrace, endBrace - startBrace + 1)
    pos      := endBrace + 1

    RegExMatch(itemJson, """qty""\s*:\s*(\d+)", qtyM)
    itemQty := (qtyM1 + 0)
    if (itemQty < 1)
      itemQty := 1

    RegExMatch(itemJson, """plus""\s*:\s*\[([^\]]*)\]", plusM)
    plusRaw := plusM1

    plusList := []
    pluPos   := 1
    Loop
    {
      RegExMatch(plusRaw, """([^""]+)""", pM, pluPos)
      if (pM = "")
        break
      plusList.Push(pM1)
      pluPos += StrLen(pM)
    }

    FileAppend, [ITEM] qty=%itemQty% plus=%plusRaw%`n, %LOG_FILE%

    if (plusList.Length() = 0)
      continue

    Loop, % itemQty
    {
      for k, plu in plusList
      {
        g_plu := plu
        GoSub, TypePLU
      }
      Sleep, 150
    }

    itemsAdded++
  }

  FileAppend, [DONE] Orden #%orderNum% - %itemsAdded% items.`n`n, %LOG_FILE%
  TrayTip, Listo, Orden #%orderNum% - %itemsAdded% producto(s)., 4

  Sleep, 1500
  capturedOrderNum := ""
  scanBuffer       := ""
  busy             := false
  return

; ─────────────────────────────────────────────────────────────────────────────
; DIAGNOSTICO: Ctrl+Shift+D = mostrar todas las ventanas abiertas
^+d::
  output := "Ventanas abiertas:`n`n"
  WinGet, wList, List
  Loop, %wList%
  {
    WinGetTitle,  wT, % "ahk_id " wList%A_Index%
    WinGetClass,  wC, % "ahk_id " wList%A_Index%
    if (wT != "")
      output .= wT . "`n   Clase: " . wC . "`n`n"
  }
  FileAppend, `n=== DIAGNOSTICO ===`n%output%`n, %LOG_FILE%
  MsgBox, 0, Ventanas abiertas, %output%
  return

; REPROCESAR ultima orden
^+r::
  if busy
  {
    TrayTip, Bridge CRE, Ocupado procesando..., 2
    return
  }
  if (lastProcessed = "")
  {
    TrayTip, Bridge CRE, No hay orden para reprocesar., 3
    return
  }
  orderNum          := lastProcessed
  lastProcessedTime := 0
  busy              := true
  GoSub, ProcesarOrden
  return
