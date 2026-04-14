; ============================================================
;  BRIDGE v4: Kiosco → Cash Register Express
;
;  ESTRATEGIA:
;  - Deja que el escaner mande el numero de orden a CRE
;  - CRE mostrara "Item Not Found"
;  - Este script detecta ese dialogo, lo cierra,
;    consulta el kiosco y escribe el PLU correcto
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE := "https://pos-app-taupe.vercel.app"

global lastScan := ""
global busy     := false

TrayTip, Bridge CRE v4, Activo - escanea el ticket del cliente., 3

SetTimer, WatchCREDialog, 200
return

; ── Capturar digitos (pasan a CRE Y se guardan aqui) ────────────
~$*0::
  if !busy
    lastScan .= "0"
  return

~$*1::
  if !busy
    lastScan .= "1"
  return

~$*2::
  if !busy
    lastScan .= "2"
  return

~$*3::
  if !busy
    lastScan .= "3"
  return

~$*4::
  if !busy
    lastScan .= "4"
  return

~$*5::
  if !busy
    lastScan .= "5"
  return

~$*6::
  if !busy
    lastScan .= "6"
  return

~$*7::
  if !busy
    lastScan .= "7"
  return

~$*8::
  if !busy
    lastScan .= "8"
  return

~$*9::
  if !busy
    lastScan .= "9"
  return

~$*Enter::
  return

; ── Timer: detectar el dialogo de CRE y procesar ────────────────
WatchCREDialog:
  global lastScan, busy, API_BASE

  if busy
    return

  IfWinExist, Item Not Found
  {
    busy := true
    orderNum := lastScan
    lastScan := ""

    ; Cerrar el dialogo
    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 400

    ; Validar numero de orden
    if (orderNum = "") {
      busy := false
      return
    }
    if orderNum is not integer
    {
      busy := false
      return
    }

    ; Llamar al kiosco
    url := API_BASE . "/api/orders/pos/" . orderNum
    whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    try {
      whr.Open("GET", url, false)
      whr.Send()
    } catch {
      MsgBox, 48, Bridge CRE, Sin conexion.`nVerifica internet.
      busy := false
      return
    }

    if (whr.Status = 404) {
      MsgBox, 48, Bridge CRE, Orden #%orderNum% no encontrada en el kiosco.
      busy := false
      return
    }

    json := whr.ResponseText

    if !RegExMatch(json, """plu"":""([^""]+)""") {
      MsgBox, 64, Bridge CRE, Orden #%orderNum% sin PLU configurado.`n`nAdmin del kiosco > Menu > edita el producto y pon el PLU.
      busy := false
      return
    }

    ; Teclear cada PLU en CRE
    count := 0
    pos   := 1
    while RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos) {
      plu := m1
      qty := m2 + 0
      pos += StrLen(m)

      Loop, %qty%
      {
        Sleep, 100
        ; Cerrar dialogo si sigue abierto
        IfWinExist, Item Not Found
        {
          WinActivate, Item Not Found
          Sleep, 100
          Send {Enter}
          Sleep, 300
        }
        ; Activar CRE y escribir PLU
        WinActivate, Cash Register Express
        Sleep, 250
        Send % plu
        Sleep, 100
        Send {Enter}
        Sleep, 600
      }
      count++
    }

    TrayTip, Listo, Orden #%orderNum% - %count% producto(s) agregado(s)., 3
    busy := false
  }
  return
