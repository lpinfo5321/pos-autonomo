; ============================================================
;  BRIDGE v17: Kiosco -> Cash Register Express
;
;  NUEVO ENFOQUE - Sin depender de detectar el dialogo:
;  1. Los digitos del escaner se INTERCEPTAN (no llegan a CRE)
;  2. Cuando llega el Enter, se replayan los digitos a CRE
;  3. Se espera max 400ms para ver si CRE muestra "Item Not Found"
;  4. Si aparece: es un numero de orden -> procesar con PLUs
;  5. Si no aparece: era un PLU valido -> CRE lo proceso normal
;
;  IMPORTANTE: Ejecutar como ADMINISTRADOR
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1

if !A_IsAdmin
{
  try
  {
    Run *RunAs "%A_AhkPath%" "%A_ScriptFullPath%"
    ExitApp
  }
  catch
  {
    MsgBox, 16, Bridge CRE, Clic derecho en el archivo -> "Ejecutar como administrador"
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

TrayTip, Bridge CRE v17 ACTIVO, Escanea el ticket del cliente., 6
return

; ═══════════════════════════════════════════════════════════════════════════
; CAPTURA DE DIGITOS (sin ~ = los digitos NO llegan a CRE todavia)
; Cuando busy=true el script esta tipeando PLUs, pasamos los digitos a CRE
; ═══════════════════════════════════════════════════════════════════════════

*0::
  if busy
  {
    SendInput 0
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "0"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 0
  return

*1::
  if busy
  {
    SendInput 1
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "1"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 1
  return

*2::
  if busy
  {
    SendInput 2
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "2"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 2
  return

*3::
  if busy
  {
    SendInput 3
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "3"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 3
  return

*4::
  if busy
  {
    SendInput 4
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "4"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 4
  return

*5::
  if busy
  {
    SendInput 5
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "5"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 5
  return

*6::
  if busy
  {
    SendInput 6
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "6"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 6
  return

*7::
  if busy
  {
    SendInput 7
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "7"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 7
  return

*8::
  if busy
  {
    SendInput 8
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "8"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 8
  return

*9::
  if busy
  {
    SendInput 9
    return
  }
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    if (A_TickCount - scanLastKeyTime > 500)
      scanBuffer := ""
    scanBuffer .= "9"
    scanLastKeyTime := A_TickCount
  }
  else
    SendInput 9
  return

; ═══════════════════════════════════════════════════════════════════════════
; ENTER: decidir si es orden del kiosco o PLU normal
; ═══════════════════════════════════════════════════════════════════════════
*Enter::
  if busy
  {
    SendInput {Enter}
    return
  }

  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    buf        := scanBuffer
    scanBuffer := ""

    ; Si el buffer esta vacio, pasar Enter normal a CRE
    if (buf = "")
    {
      SendInput {Enter}
      return
    }

    ; Si no es un numero, pasar todo a CRE como texto normal
    if buf is not integer
    {
      SendInput % buf
      SendInput {Enter}
      return
    }

    n := buf + 0
    if (n < 1 || n > 99999)
    {
      SendInput % buf
      SendInput {Enter}
      return
    }

    ; Podria ser un numero de orden del kiosco (1-99999)
    ; Enviar los digitos + Enter a CRE para que intente procesarlos
    SendInput % buf
    Sleep, 60
    SendInput {Enter}

    ; Esperar hasta 500ms para ver si CRE muestra "Item Not Found"
    SetTitleMatchMode, 2
    WinWait, Item Not Found, , 0.5
    if ErrorLevel
    {
      ; No aparecio dialogo -> era un PLU valido, CRE lo proceso normal
      return
    }

    ; DIALOGO ENCONTRADO - es un numero de orden del kiosco
    ; Anti-duplicado
    now := A_TickCount
    if (buf = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      ControlClick, Button1, Item Not Found
      TrayTip, Bridge CRE, Orden #%buf% ya procesada., 3
      return
    }

    ; Procesar la orden
    busy              := true
    lastProcessed     := buf
    lastProcessedTime := A_TickCount
    orderNum          := buf

    ; Cerrar dialogo
    WinActivate, Item Not Found
    Sleep, 100
    Send {Enter}
    Sleep, 80
    ControlClick, Button1, Item Not Found
    Sleep, 350

    GoSub, ProcesarOrden
  }
  else
  {
    ; No es CRE, pasar Enter normal
    SendInput {Enter}
  }
  return

; ═══════════════════════════════════════════════════════════════════════════
; REPROCESAR ULTIMA ORDEN: Ctrl+Shift+R
; ═══════════════════════════════════════════════════════════════════════════
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
  GoSub, ProcesarOrden
  return

; ═══════════════════════════════════════════════════════════════════════════
; TIPEAR UN PLU EN CRE (cierra silenciosamente "Item Not Found" si aparece)
; ═══════════════════════════════════════════════════════════════════════════
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return
  WinActivate, Cash Register Express
  Sleep, 120
  SendInput % g_plu
  Sleep, 60
  SendInput {Enter}
  ; Esperar max 800ms para ver si CRE reporta PLU no encontrado
  Loop, 8
  {
    Sleep, 100
    SetTitleMatchMode, 2
    IfWinExist, Item Not Found
    {
      WinActivate, Item Not Found
      Sleep, 50
      Send {Enter}
      ControlClick, Button1, Item Not Found
      Sleep, 120
      break
    }
  }
  return

; ═══════════════════════════════════════════════════════════════════════════
; CONSULTAR API Y ESCRIBIR PLUs
; ═══════════════════════════════════════════════════════════════════════════
ProcesarOrden:
  SetTitleMatchMode, 2
  TrayTip, Bridge CRE, Orden #%orderNum%..., 2

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

  ; Parsear JSON
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
  scanBuffer := ""
  busy       := false
  return
