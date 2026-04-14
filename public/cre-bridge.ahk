; ============================================================
;  BRIDGE v6: Kiosco → Cash Register Express
;
;  USO:
;  1. Ejecutar como Administrador (clic derecho → Run as admin)
;  2. Escanear ticket del cliente en CRE → CRE muestra error
;  3. Presionar Ctrl+Shift+O en el teclado
;  4. Escribir el numero de orden → Enter
;  5. El script agrega los productos automaticamente
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE := "https://pos-app-taupe.vercel.app"

TrayTip, Bridge CRE v6, Listo. Usa Ctrl+Shift+O para cargar una orden., 5

; ── Monitorear dialogo de CRE (cierra automaticamente si aparece) 
global busy     := false
global lastScan := ""
SetTimer, WatchDialog, 250
return

; ── Capturar scan del escaner ────────────────────────────────────
~$0:: if !busy, lastScan .= "0"
~$1:: if !busy, lastScan .= "1"
~$2:: if !busy, lastScan .= "2"
~$3:: if !busy, lastScan .= "3"
~$4:: if !busy, lastScan .= "4"
~$5:: if !busy, lastScan .= "5"
~$6:: if !busy, lastScan .= "6"
~$7:: if !busy, lastScan .= "7"
~$8:: if !busy, lastScan .= "8"
~$9:: if !busy, lastScan .= "9"
~Enter:: lastScan := lastScan  ; solo mantener valor

; ── ATAJO PRINCIPAL: Ctrl+Shift+O ────────────────────────────────
^+o::
  if busy {
    MsgBox, 64, Bridge, Espera, ya se esta procesando una orden.
    return
  }
  busy := true

  ; Usar numero capturado del scan, o pedir manualmente
  orderNum := lastScan
  lastScan := ""

  if (orderNum = "") {
    InputBox, orderNum, Cargar Orden en CRE, Numero de orden:,, 260, 120
    if ErrorLevel {
      busy := false
      return
    }
    orderNum := Trim(orderNum)
  }

  if orderNum is not integer
  {
    MsgBox, 48, Bridge, "%orderNum%" no es un numero de orden valido.
    busy := false
    return
  }

  GoSub, ProcesarOrden
  return

; ── Detectar dialogo de error de CRE y cerrarlo ──────────────────
WatchDialog:
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

    if (orderNum = "") {
      InputBox, orderNum, Cargar Orden en CRE, Numero de orden (no se capturo del scan):,, 300, 120
      if ErrorLevel {
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

  try {
    whr.Open("GET", url, false)
    whr.Send()
  } catch e {
    MsgBox, 48, Bridge CRE, Error de conexion:`n%e%`n`nVerifica que esta PC tenga internet.
    busy := false
    return
  }

  if (whr.Status = 404) {
    MsgBox, 48, Bridge CRE, Orden #%orderNum% no encontrada.`nVerifica el numero de orden.
    busy := false
    return
  }

  if (whr.Status != 200) {
    MsgBox, 48, Bridge CRE, Error del servidor: HTTP %whr.Status%
    busy := false
    return
  }

  json := whr.ResponseText

  if !RegExMatch(json, """plu"":""([^""]+)""") {
    MsgBox, 64, Bridge CRE, La orden #%orderNum% no tiene PLU configurado.`n`nVe a Admin del kiosco > Menu, edita el producto y pon su codigo PLU de CRE.
    busy := false
    return
  }

  ; Cerrar cualquier dialogo pendiente
  IfWinExist, Item Not Found
  {
    WinActivate, Item Not Found
    Sleep, 150
    Send {Enter}
    Sleep, 300
  }

  ; Activar CRE
  if !WinExist("Cash Register Express") {
    MsgBox, 48, Bridge CRE, No se encontro la ventana de Cash Register Express.`nAsegurate de que CRE este abierto.
    busy := false
    return
  }

  WinActivate, Cash Register Express
  Sleep, 400

  ; Escribir cada PLU
  count := 0
  pos   := 1
  while RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos) {
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
