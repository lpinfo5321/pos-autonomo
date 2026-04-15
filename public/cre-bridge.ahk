; ============================================================
;  BRIDGE v16: Kiosco -> Cash Register Express
;
;  Regresa a la arquitectura de v10 que SI funcionaba:
;  - ReadScanField timer (lee el campo de CRE)
;  - WatchDialog timer (detecta "Item Not Found")
;  + Hotkeys numericos como respaldo
;  + PLUs individuales por producto (en vez de KIOSKO)
;
;  DEBE EJECUTARSE COMO ADMINISTRADOR
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

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
    MsgBox, 16, Bridge CRE, Necesita Administrador.`nCierra el script del tray y ejecuta como admin.
    ExitApp
  }
}

API_BASE := "https://pos-app-taupe.vercel.app"

global busy              := false
global lastScanField     := ""
global capturedOrderNum  := ""
global lastProcessed     := ""
global lastProcessedTime := 0
global scanBuffer        := ""
global scanLastKeyTime   := 0
global g_plu             := ""

TrayTip, Bridge CRE v16 [ADMIN], Activo. Escanea el ticket del cliente., 5

; Timers identicos a v10 (los que funcionaban)
SetTimer, ReadScanField, 20
SetTimer, WatchDialog,   150
return

; ── LEER CAMPO DE ESCANEO DE CRE (igual a v10) ───────────────────────────────
ReadScanField:
  global busy, lastScanField, capturedOrderNum
  if busy
    return
  SetTitleMatchMode, 2
  IfWinExist, Cash Register Express
  {
    ControlGetText, fv, Edit1, Cash Register Express
    fv := Trim(fv)
    if (fv != "" && fv != lastScanField)
    {
      lastScanField := fv
      if fv is integer
      {
        if (StrLen(fv) >= 1 && StrLen(fv) <= 6)
          capturedOrderNum := fv
      }
    }
  }
  return

; ── DETECTAR DIALOGO (igual a v10, con SetTitleMatchMode al inicio) ───────────
WatchDialog:
  global busy, capturedOrderNum, lastScanField
  global lastProcessed, lastProcessedTime
  SetTitleMatchMode, 2   ; CRITICO: los timers resetean esto a default
  if busy
    return

  IfWinExist, Item Not Found
  {
    busy := true
    SetTimer, ReadScanField, Off

    orderNum         := capturedOrderNum
    capturedOrderNum := ""
    lastScanField    := ""

    ; Si no hay numero valido, cerrar dialogo y seguir
    if orderNum is not integer
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      Sleep, 200
      ControlClick, Button1, Item Not Found
      SetTimer, ReadScanField, 20
      busy := false
      return
    }

    ; Anti-duplicado: 30 segundos
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      ControlClick, Button1, Item Not Found
      SetTimer, ReadScanField, 20
      busy := false
      TrayTip, Bridge CRE, Orden #%orderNum% ya procesada., 3
      return
    }

    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount

    ; Cerrar dialogo
    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 100
    ControlClick, Button1, Item Not Found
    Sleep, 400

    GoSub, ProcesarOrden
  }
  return

; ── CAPTURA DE RESPALDO: digitos del teclado/escaner ─────────────────────────
; Por si ReadScanField no captura el numero a tiempo
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
    if (scanBuffer != "" && scanBuffer != lastScanField)
    {
      if scanBuffer is integer
        capturedOrderNum := scanBuffer
    }
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
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
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return

; Numpad (muchos scanners envian numpad)
~*Numpad0:: GoSub, NP0
~*Numpad1:: GoSub, NP1
~*Numpad2:: GoSub, NP2
~*Numpad3:: GoSub, NP3
~*Numpad4:: GoSub, NP4
~*Numpad5:: GoSub, NP5
~*Numpad6:: GoSub, NP6
~*Numpad7:: GoSub, NP7
~*Numpad8:: GoSub, NP8
~*Numpad9:: GoSub, NP9
NP0: GoSub, NPAdd0 & return
NP1: GoSub, NPAdd1 & return
NP2: GoSub, NPAdd2 & return
NP3: GoSub, NPAdd3 & return
NP4: GoSub, NPAdd4 & return
NP5: GoSub, NPAdd5 & return
NP6: GoSub, NPAdd6 & return
NP7: GoSub, NPAdd7 & return
NP8: GoSub, NPAdd8 & return
NP9: GoSub, NPAdd9 & return
NPAdd0:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "0"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd1:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "1"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd2:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "2"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd3:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "3"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd4:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "4"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd5:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "5"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd6:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "6"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd7:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "7"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd8:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "8"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return
NPAdd9:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 300)
      scanBuffer := ""
    scanBuffer .= "9"
    scanLastKeyTime := A_TickCount
    if scanBuffer is integer
      capturedOrderNum := scanBuffer
  }
  return

; ── HOTKEY MANUAL: Ctrl+Shift+R = reprocesar ─────────────────────────────────
^+r::
  if busy
  {
    TrayTip, Bridge CRE, Ocupado..., 2
    return
  }
  if (lastProcessed = "")
  {
    TrayTip, Bridge CRE, No hay orden reciente., 3
    return
  }
  orderNum          := lastProcessed
  lastProcessedTime := 0
  busy              := true
  SetTimer, ReadScanField, Off
  GoSub, ProcesarOrden
  return

; ── TIPEAR UN PLU (con manejo silencioso de "Item Not Found") ─────────────────
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return
  WinActivate, Cash Register Express
  Sleep, 150
  SendInput % g_plu
  Sleep, 80
  SendInput {Enter}
  Loop, 8
  {
    Sleep, 100
    SetTitleMatchMode, 2
    IfWinExist, Item Not Found
    {
      WinActivate, Item Not Found
      Sleep, 60
      Send {Enter}
      ControlClick, Button1, Item Not Found
      Sleep, 150
      break
    }
  }
  return

; ── CONSULTAR API Y ESCRIBIR PLUs ────────────────────────────────────────────
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
    TrayTip, Bridge CRE, Sin conexion., 4
    SetTimer, ReadScanField, 20
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

  if (httpStatus = 404)
  {
    TrayTip, Bridge CRE, Orden #%orderNum% no encontrada., 5
    SetTimer, ReadScanField, 20
    busy := false
    return
  }
  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error %httpStatus%, 4
    SetTimer, ReadScanField, 20
    busy := false
    return
  }

  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, CRE no esta abierto., 4
    SetTimer, ReadScanField, 20
    busy := false
    return
  }

  ; Parsear JSON: { "items": [ { "qty":N, "plus":["PLU1",...] } ] }
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

    if (plusList.Length() = 0)
      continue

    Loop, % itemQty
    {
      for k, plu in plusList
      {
        g_plu := plu
        GoSub, TypePLU
      }
      Sleep, 200
    }

    itemsAdded++
  }

  TrayTip, Listo, Orden #%orderNum% - %itemsAdded% producto(s) en CRE., 4

  Sleep, 1500
  lastScanField    := ""
  capturedOrderNum := ""
  scanBuffer       := ""
  SetTimer, ReadScanField, 20
  busy := false
  return
