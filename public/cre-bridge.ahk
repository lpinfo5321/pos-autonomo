; ============================================================
;  BRIDGE v3: Kiosco  →  Cash Register Express
; ============================================================
#NoEnv
#SingleInstance Force
SetBatchLines -1

API_BASE := "https://pos-app-taupe.vercel.app"
SPEED_MS := 50   ; ms maximo entre teclas del escaner

global buf   := ""
global lastT := 0

TrayTip, Bridge CRE v3, Script activo - listo para escanear., 3

; ── Todos los digitos (sin ~ = NO pasan a CRE automaticamente) ──
$0:: Digit("0")
$1:: Digit("1")
$2:: Digit("2")
$3:: Digit("3")
$4:: Digit("4")
$5:: Digit("5")
$6:: Digit("6")
$7:: Digit("7")
$8:: Digit("8")
$9:: Digit("9")

Digit(d) {
  global buf, lastT, SPEED_MS
  now := A_TickCount
  gap := now - lastT
  lastT := now

  if (gap < SPEED_MS || buf != "") {
    ; Velocidad de escaner → acumular sin pasar a CRE
    buf .= d
  } else {
    ; Primer digito lento (humano) → pasar a CRE y empezar buffer
    buf := d
    SendInput % d
  }
}

; ── Enter ────────────────────────────────────────────────────────
$Enter::
  global buf, lastT, SPEED_MS, API_BASE
  now := A_TickCount
  gap := now - lastT

  ; Si el Enter llego rapido y hay buffer = fin de escaneo
  if (buf != "" && gap < 500) {
    orderNum := buf
    buf      := ""

    if orderNum is integer
    {
      GoSub, DoOrder
      return
    }
  }

  ; Enter normal
  buf := ""
  SendInput {Enter}
  return

; ── Procesar la orden ────────────────────────────────────────────
DoOrder:
  ; Esperar y cerrar cualquier dialogo "Item Not Found" que CRE abra
  ; (puede aparecer si el primer digito llego a CRE antes de ser bloqueado)
  Sleep, 400
  Loop, 5 {
    IfWinExist, Item Not Found
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      Sleep, 250
      break
    }
    Sleep, 100
  }

  ; Consultar API
  url := API_BASE . "/api/orders/pos/" . orderNum
  whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
  try {
    whr.Open("GET", url, false)
    whr.Send()
  } catch {
    MsgBox, 48, Bridge CRE, Sin conexion al servidor.
    return
  }

  if (whr.Status = 404) {
    MsgBox, 48, Bridge CRE, Orden #%orderNum% no encontrada.
    return
  }
  if (whr.Status != 200) {
    MsgBox, 48, Bridge CRE, Error del servidor (%whr.Status%).
    return
  }

  json := whr.ResponseText

  ; Verificar PLU
  if !RegExMatch(json, """plu"":""([^""]+)""") {
    MsgBox, 64, Bridge CRE, Orden #%orderNum% sin PLU.`n`nAsigna los codigos PLU en Admin del kiosco.
    return
  }

  ; Escribir cada PLU en CRE
  count := 0
  pos   := 1
  while RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos) {
    plu := m1
    qty := m2 + 0
    pos += StrLen(m)

    Loop, %qty%
    {
      Sleep, 300
      ; Cerrar error si hay uno abierto
      IfWinExist, Item Not Found
      {
        WinActivate, Item Not Found
        Sleep, 100
        Send {Enter}
        Sleep, 200
      }
      ; Activar ventana de CRE y escribir PLU
      WinActivate, Cash Register Express
      Sleep, 150
      SendInput % plu
      Sleep, 100
      SendInput {Enter}
      Sleep, 600
    }
    count++
  }

  TrayTip, Exito, Orden #%orderNum% - %count% producto(s) en CRE., 2
  return
