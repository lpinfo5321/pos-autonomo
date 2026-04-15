; ============================================================
;  BRIDGE v14: Kiosco -> Cash Register Express
;
;  CAMBIOS CRITICOS:
;  1. AUTO-ELEVACION: si no se abre como Administrador, el
;     script se reinicia solo con permisos de admin.
;     Sin admin, el script NO puede enviar teclas a CRE.
;
;  2. DETECCION MULTIPLE del dialogo "Item Not Found":
;     - Por titulo: "Item Not Found!" (con y sin !)
;     - Por clase de ventana: ahk_class #32770 (todos los dialogos)
;
;  3. CIERRE DEL DIALOGO por multiple metodos:
;     - WinActivate + Send {Enter}
;     - ControlClick en boton OK
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
    ; Reiniciar el script con permisos de Administrador
    Run *RunAs "%A_AhkPath%" "%A_ScriptFullPath%"
    ExitApp
  }
  catch
  {
    MsgBox, 16, Bridge CRE - ERROR, Necesita permisos de Administrador.`n`nHaz clic derecho en el script y selecciona "Ejecutar como administrador".
    ExitApp
  }
}
; ── FIN AUTO-ELEVACION ───────────────────────────────────────────────────────

API_BASE := "https://pos-app-taupe.vercel.app"

global busy              := false
global capturedOrderNum  := ""
global scanBuffer        := ""
global scanLastKeyTime   := 0
global lastProcessed     := ""
global lastProcessedTime := 0
global g_plu             := ""

; Confirmar que se esta ejecutando con admin
TrayTip, Bridge CRE v14 ✓ ADMIN, Activo. Escanea el ticket del cliente., 5

SetTimer, WatchDialog, 80
return

; ── CAPTURA DE DIGITOS DEL ESCANER ──────────────────────────────────────────
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

; ── ENTER: finalizar captura del buffer ─────────────────────────────────────
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
      {
        capturedOrderNum := buf
        ; TrayTip de diagnostico — descomenta si necesitas ver que numero se capturo:
        ; TrayTip, Capturado, Numero: %buf%, 2
      }
    }
  }
  return

; ── HOTKEY MANUAL: Ctrl+Shift+R = reprocesar ultima orden ───────────────────
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

; ── DETECCION DEL DIALOGO ────────────────────────────────────────────────────
; Intenta varios metodos para encontrar el dialogo de CRE
FindCREDialog:
  global g_dialogFound
  g_dialogFound := ""

  SetTitleMatchMode, 2
  ; Metodo 1: titulo con o sin !
  IfWinExist, Item Not Found!
  {
    g_dialogFound := "Item Not Found!"
    return
  }
  IfWinExist, Item Not Found
  {
    g_dialogFound := "Item Not Found"
    return
  }
  ; Metodo 2: cualquier dialogo (#32770) que tenga "Not Found" en el titulo
  SetTitleMatchMode, 2
  IfWinExist, ahk_class #32770
  {
    WinGetTitle, tmpT, ahk_class #32770
    if (InStr(tmpT, "Not Found") || InStr(tmpT, "Item") || InStr(tmpT, "not entered"))
    {
      g_dialogFound := "ahk_class #32770"
      return
    }
  }
  return

; ── CERRAR DIALOGO ACTIVO ────────────────────────────────────────────────────
CloseDialog:
  if (g_dialogFound = "")
    return
  WinActivate, %g_dialogFound%
  Sleep, 100
  ; Metodo 1: Send Enter
  Send {Enter}
  Sleep, 80
  ; Metodo 2: click en boton OK (por si Enter no funciono)
  IfWinExist, %g_dialogFound%
  {
    ControlClick, Button1, %g_dialogFound%
    Sleep, 80
  }
  return

; ── TIMER: VIGILAR DIALOGO ───────────────────────────────────────────────────
WatchDialog:
  if busy
    return

  GoSub, FindCREDialog
  if (g_dialogFound = "")
    return

  ; Hay un dialogo — capturar numero de orden
  orderNum        := capturedOrderNum
  capturedOrderNum := ""
  scanBuffer      := ""

  ; Si no hay numero valido, solo cerrar el dialogo
  if orderNum is not integer
  {
    GoSub, CloseDialog
    return
  }

  ; Anti-duplicado: no reprocesar la misma orden por 30 segundos
  now := A_TickCount
  if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
  {
    GoSub, CloseDialog
    TrayTip, Bridge CRE, Orden #%orderNum% ya procesada., 3
    return
  }

  ; Bloquear re-entrada
  busy              := true
  lastProcessed     := orderNum
  lastProcessedTime := A_TickCount

  ; Cerrar el dialogo
  GoSub, CloseDialog
  Sleep, 400

  GoSub, ProcesarOrden
  return

; ── TIPEAR UN PLU ─────────────────────────────────────────────────────────────
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return
  WinActivate, Cash Register Express
  Sleep, 120
  SendInput % g_plu
  Sleep, 60
  SendInput {Enter}
  ; Esperar a que CRE responda (hasta 700ms)
  Loop, 7
  {
    Sleep, 100
    GoSub, FindCREDialog
    if (g_dialogFound != "")
    {
      ; PLU no reconocido: descartar silenciosamente
      GoSub, CloseDialog
      Sleep, 150
      break
    }
  }
  return

; ── CONSULTAR API Y ESCRIBIR PLUs EN CRE ────────────────────────────────────
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

  ; ── Parsear JSON ──────────────────────────────────────────────────────────
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

  TrayTip, Listo, Orden #%orderNum% - %itemsAdded% producto(s) en CRE., 4

  Sleep, 1500
  capturedOrderNum := ""
  scanBuffer       := ""
  busy             := false
  return
