; ============================================================
;  BRIDGE v13: Kiosco -> Cash Register Express
;
;  PROBLEMA RESUELTO:
;  - ControlGetText("Edit1") devuelve vacio porque el campo
;    "Scan Barcode Now..." de CRE NO se llama Edit1.
;
;  SOLUCION:
;  Interceptamos cada tecla de digito (0-9) cuando CRE esta
;  activo y las acumulamos en un buffer propio.
;  Cuando llega el Enter, tenemos el numero completo del ticket.
;  El buffer se resetea si hay mas de 300ms entre teclas
;  (eso diferencia escaneo rapido de escritura manual).
;
;  FLUJO:
;  1. Escaner envia "4" + Enter → capturamos "4" en nuestro buffer
;  2. CRE muestra "Item Not Found!" → script lo cierra en < 80ms
;  3. API del kiosco devuelve los PLUs del pedido
;  4. Script tipea cada PLU en CRE
;  5. PLUs desconocidos se descartan silenciosamente
;
;  REQUISITOS: Ejecutar como ADMINISTRADOR
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE := "https://pos-app-taupe.vercel.app"

global busy              := false
global capturedOrderNum  := ""
global scanBuffer        := ""
global scanLastKeyTime   := 0
global lastProcessed     := ""
global lastProcessedTime := 0
global g_plu             := ""

TrayTip, Bridge CRE v13, Activo - Escanea el ticket., 5
SetTimer, WatchDialog, 80
return

; ── Captura de digitos del escaner ──────────────────────────────────────────
; Cada digito se acumula en scanBuffer mientras CRE este activo y no este ocupado.
; Si pasan mas de 300ms desde el ultimo digito, se resetea (fin de escaneo anterior).

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

; ── Enter: procesar el buffer acumulado ─────────────────────────────────────
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
    if buf is integer
    {
      n := buf + 0
      if (n >= 1 && n <= 99999)
        capturedOrderNum := buf
    }
  }
  return

; ── Hotkey manual: Ctrl+Shift+R = reprocesar ultima orden ───────────────────
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

; ── Detectar dialogo "Item Not Found!" y procesar ───────────────────────────
WatchDialog:
  SetTitleMatchMode, 2
  if busy
    return

  IfWinExist, Item Not Found
  {
    orderNum        := capturedOrderNum
    capturedOrderNum := ""
    scanBuffer      := ""

    ; Si no hay numero, solo cerrar el dialogo
    if orderNum is not integer
    {
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      return
    }

    ; Anti-duplicado: ignorar si la misma orden se proceso en los ultimos 30s
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      TrayTip, Bridge CRE, Orden #%orderNum% ya fue procesada., 3
      return
    }

    busy              := true
    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount

    ; Cerrar dialogo
    WinActivate, Item Not Found
    Sleep, 80
    Send {Enter}
    Sleep, 350

    GoSub, ProcesarOrden
  }
  return

; ── Tipear un PLU — descarta silenciosamente si CRE no lo reconoce ──────────
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return
  WinActivate, Cash Register Express
  Sleep, 100
  SendInput % g_plu
  Sleep, 60
  SendInput {Enter}
  ; Esperar hasta 700ms a que CRE responda
  Loop, 7
  {
    Sleep, 100
    IfWinExist, Item Not Found
    {
      WinActivate, Item Not Found
      Sleep, 50
      Send {Enter}
      Sleep, 150
      break
    }
  }
  return

; ── Consultar API y tipear los PLUs del pedido ──────────────────────────────
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
    TrayTip, Bridge CRE, Sin conexion a internet., 4
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
    TrayTip, Bridge CRE, Error del servidor: %httpStatus%, 4
    busy := false
    return
  }

  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, CRE no esta abierto., 4
    busy := false
    return
  }

  ; ── Parsear JSON y tipear PLUs ────────────────────────────────────────────
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
      Sleep, 150
    }

    itemsAdded++
  }

  TrayTip, Listo, Orden #%orderNum% - %itemsAdded% producto(s) cargados., 4

  Sleep, 1500
  capturedOrderNum := ""
  scanBuffer       := ""
  busy             := false
  return
