; ============================================================
;  BRIDGE v18 - DIAGNOSTICO DEFINITIVO
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1

; AUTO-ADMIN
if !A_IsAdmin
{
  try
  {
    Run *RunAs "%A_AhkPath%" "%A_ScriptFullPath%"
    ExitApp
  }
  catch
  {
    MsgBox, 16, Bridge CRE, NECESITA ADMINISTRADOR.`n`nHaz clic derecho en el archivo .ahk y selecciona`n"Ejecutar como administrador"
    ExitApp
  }
}

API_BASE := "https://pos-app-taupe.vercel.app"

global busy              := false
global scanBuffer        := ""
global scanLastKeyTime   := 0
global lastProcessed     := ""
global lastProcessedTime := 0
global g_plu             := ""

; ── CONFIRMACION VISIBLE AL INICIAR ──────────────────────────────────────────
MsgBox, 64, Bridge CRE v18 - ACTIVO, El script esta corriendo como ADMINISTRADOR: %A_IsAdmin%`n`nPrueba de funcionamiento:`n1. Cierra este mensaje`n2. Escanea un ticket en CRE`n3. El script debe cerrar el dialogo rojo automaticamente`n`nSi ves el icono "H" verde en el tray el script esta activo., 5

SetTimer, WatchDialog, 50
return

; ── TIMER: detectar y cerrar dialogo con TODOS los metodos posibles ───────────
WatchDialog:
  SetTitleMatchMode, 2
  if busy
    return

  IfWinExist, Item Not Found
  {
    busy := true
    TrayTip, BRIDGE - DETECTADO, Dialogo encontrado. Cerrando..., 3

    ; METODO 1: Activar y Enter
    WinActivate, Item Not Found
    Sleep, 150
    Send {Enter}
    Sleep, 100

    ; METODO 2: Click en boton OK
    ControlClick, Button1, Item Not Found
    Sleep, 100

    ; METODO 3: PostMessage BM_CLICK (no requiere foco)
    PostMessage, 0x00F5, 0, 0, Button1, Item Not Found
    Sleep, 150

    ; Verificar si se cerro
    IfWinExist, Item Not Found
    {
      ; METODO 4: Click directo en coordenadas del boton OK
      WinGetPos, dlgX, dlgY, dlgW, dlgH, Item Not Found
      btnX := dlgX + dlgW // 2
      btnY := dlgY + dlgH - 40
      Click, %btnX%, %btnY%
      Sleep, 200
    }

    ; Verificar estado final
    IfWinExist, Item Not Found
    {
      TrayTip, BRIDGE - FALLO, No pudo cerrar el dialogo. Sin permisos., 8
      busy := false
      return
    }

    TrayTip, BRIDGE - CERRADO, Dialogo cerrado OK., 3

    ; Capturar numero de orden del buffer
    orderNum := scanBuffer
    if (orderNum = "")
      orderNum := lastProcessed

    if orderNum is not integer
    {
      busy := false
      return
    }

    n := orderNum + 0
    if (n < 1 || n > 99999)
    {
      busy := false
      return
    }

    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      TrayTip, Bridge CRE, Orden #%orderNum% ya procesada., 3
      busy := false
      return
    }

    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount
    scanBuffer        := ""
    Sleep, 300
    GoSub, ProcesarOrden
  }
  return

; ── CAPTURA DE DIGITOS (con passthrough ~) ────────────────────────────────────
~*0::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
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
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "9"
    scanLastKeyTime := A_TickCount
  }
  return

; ── REPROCESAR: Ctrl+Shift+R ──────────────────────────────────────────────────
^+r::
  if busy
    return
  if (lastProcessed = "")
  {
    TrayTip, Bridge CRE, No hay orden reciente., 3
    return
  }
  orderNum          := lastProcessed
  lastProcessedTime := 0
  busy              := true
  GoSub, ProcesarOrden
  return

; ── TIPEAR UN PLU ─────────────────────────────────────────────────────────────
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
      PostMessage, 0x00F5, 0, 0, Button1, Item Not Found
      Sleep, 120
      break
    }
  }
  return

; ── PROCESAR ORDEN ────────────────────────────────────────────────────────────
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
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

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

  TrayTip, LISTO, Orden #%orderNum% - %itemsAdded% producto(s) en CRE., 5
  Sleep, 1500
  scanBuffer := ""
  busy       := false
  return
