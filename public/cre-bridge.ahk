; ============================================================
;  BRIDGE v6: Kiosco -> Cash Register Express
;
;  USO:
;  1. Ejecutar como Administrador (clic derecho -> Run as admin)
;  2. Escanear ticket del cliente en CRE -> CRE muestra error
;  3. Presionar Ctrl+Shift+O en el teclado
;  4. Escribir el numero de orden -> Enter
;  5. El script agrega los productos automaticamente
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE := "https://pos-app-taupe.vercel.app"

global busy     := false
global lastScan := ""

TrayTip, Bridge CRE v6, Listo. Usa Ctrl+Shift+O para cargar una orden., 5

SetTimer, WatchDialog, 250
return

; ── Capturar digitos del escaner (pasan a CRE Y se guardan) ──────
~$0::
  if !busy
    lastScan .= "0"
  return
~$1::
  if !busy
    lastScan .= "1"
  return
~$2::
  if !busy
    lastScan .= "2"
  return
~$3::
  if !busy
    lastScan .= "3"
  return
~$4::
  if !busy
    lastScan .= "4"
  return
~$5::
  if !busy
    lastScan .= "5"
  return
~$6::
  if !busy
    lastScan .= "6"
  return
~$7::
  if !busy
    lastScan .= "7"
  return
~$8::
  if !busy
    lastScan .= "8"
  return
~$9::
  if !busy
    lastScan .= "9"
  return
~Enter::
  return

; ── ATAJO PRINCIPAL: Ctrl+Shift+O ────────────────────────────────
^+o::
  global busy, lastScan
  if busy
  {
    MsgBox, 64, Bridge, Espera, ya se esta procesando una orden.
    return
  }
  busy := true
  orderNum := lastScan
  lastScan := ""

  if (orderNum = "")
  {
    InputBox, orderNum, Cargar Orden en CRE, Numero de orden:,, 260, 120
    if ErrorLevel
    {
      busy := false
      return
    }
    orderNum := Trim(orderNum)
  }

  if orderNum is not integer
  {
    MsgBox, 48, Bridge, Numero de orden invalido.
    busy := false
    return
  }

  GoSub, ProcesarOrden
  return

; ── Timer: detectar dialogo de CRE ───────────────────────────────
WatchDialog:
  global busy, lastScan
  if busy
    return
  IfWinExist, Item Not Found
  {
    busy := true
    orderNum := lastScan
    lastScan := ""

    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 400

    if (orderNum = "")
    {
      InputBox, orderNum, Cargar Orden en CRE, Numero de orden (no se capturo del scan):,, 300, 120
      if ErrorLevel
      {
        busy := false
        return
      }
      orderNum := Trim(orderNum)
    }

    if orderNum is not integer
    {
      busy := false
      return
    }

    GoSub, ProcesarOrden
  }
  return

; ── Consultar API y escribir PLU en CRE ──────────────────────────
ProcesarOrden:
  url := API_BASE . "/api/orders/pos/" . orderNum
  whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")

  try
  {
    whr.Open("GET", url, false)
    whr.Send()
  }
  catch e
  {
    MsgBox, 48, Bridge CRE, Error de conexion. Verifica internet en esta PC.
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

  if (httpStatus = 404)
  {
    MsgBox, 48, Bridge CRE, Orden #%orderNum% no encontrada. Verifica el numero.
    busy := false
    return
  }

  if (httpStatus != 200)
  {
    MsgBox, 48, Bridge CRE, Error del servidor: HTTP %httpStatus%
    busy := false
    return
  }

  json := httpBody

  if !RegExMatch(json, """plu"":""([^""]+)""")
  {
    MsgBox, 64, Bridge CRE, Orden #%orderNum% sin PLU.`nVe a Admin del kiosco > Menu y asigna el PLU del producto.
    busy := false
    return
  }

  ; Cerrar dialogo pendiente si existe
  IfWinExist, Item Not Found
  {
    WinActivate, Item Not Found
    Sleep, 150
    Send {Enter}
    Sleep, 300
  }

  ; Verificar que CRE este abierto
  IfWinNotExist, Cash Register Express
  {
    MsgBox, 48, Bridge CRE, No se encontro Cash Register Express. Asegurate de que este abierto.
    busy := false
    return
  }

  WinActivate, Cash Register Express
  Sleep, 400

  ; Escribir cada PLU
  count := 0
  pos   := 1
  while RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos)
  {
    plu := m1
    qty := m2 + 0
    pos += StrLen(m)

    Loop, %qty%
    {
      Sleep, 150
      IfWinExist, Item Not Found
      {
        WinActivate, Item Not Found
        Sleep, 100
        Send {Enter}
        Sleep, 300
      }
      WinActivate, Cash Register Express
      Sleep, 250
      SendInput % plu
      Sleep, 80
      SendInput {Enter}
      Sleep, 800
    }
    count++
  }

  TrayTip, OK, Orden #%orderNum% - %count% producto(s) en CRE., 4
  busy := false
  return
