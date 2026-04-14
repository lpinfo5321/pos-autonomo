; ============================================================
;  BRIDGE v7: Kiosco -> Cash Register Express
;
;  TOTALMENTE AUTOMATICO - sin teclas ni pantalla tactil
;
;  1. Ejecutar como Administrador (clic derecho -> Run as admin)
;  2. Escanear ticket del cliente en CRE -> se agrega solo
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE        := "https://pos-app-taupe.vercel.app"

global busy          := false
global lastScanField := ""   ; ultimo valor visto en el campo de CRE
global lastProcessed := ""   ; ultima orden procesada (evita duplicados)
global lastProcessedTime := 0

TrayTip, Bridge CRE v7, Activo. Escanea el ticket del cliente., 5

; ── Leer campo de escaneo de CRE cada 20ms ──────────────────────
SetTimer, ReadScanField, 20

; ── Detectar dialogo de error cada 200ms ────────────────────────
SetTimer, WatchDialog, 200

return

; ── Leer continuamente el campo "Scan Barcode Now..." de CRE ────
ReadScanField:
  global busy, lastScanField
  if busy
    return
  IfWinExist, Cash Register Express
  {
    ControlGetText, fieldVal, Edit1, Cash Register Express
    fieldVal := Trim(fieldVal)
    if (fieldVal != "" && fieldVal != lastScanField)
      lastScanField := fieldVal
  }
  return

; ── Detectar dialogo "Item Not Found" y procesar ────────────────
WatchDialog:
  global busy, lastScanField, lastProcessed, lastProcessedTime
  if busy
    return

  IfWinExist, Item Not Found
  {
    busy := true

    ; Intentar leer el campo de CRE en este momento tambien (por si acaso)
    ControlGetText, liveVal, Edit1, Cash Register Express
    liveVal := Trim(liveVal)
    if (liveVal != "")
      lastScanField := liveVal

    ; Capturar orden del campo de CRE
    orderNum := lastScanField
    lastScanField := ""

    ; Validar que sea un numero de orden
    if orderNum is not integer
    {
      ; Cerrar el dialogo y salir
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      busy := false
      return
    }

    ; Evitar procesar la misma orden dos veces seguidas (en menos de 8s)
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 8000)
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      busy := false
      return
    }

    ; Cerrar el dialogo
    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 500

    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount

    GoSub, ProcesarOrden
  }
  return

; ── Consultar API y escribir PLU en CRE ─────────────────────────
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
    TrayTip, Bridge CRE, Error de conexion. Verifica internet., 4
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

  if (httpStatus = 404)
  {
    TrayTip, Bridge CRE, Orden #%orderNum% no encontrada., 4
    busy := false
    return
  }

  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error servidor: %httpStatus%, 4
    busy := false
    return
  }

  json := httpBody

  if !RegExMatch(json, """plu"":""([^""]+)""")
  {
    TrayTip, Bridge CRE, Orden #%orderNum% sin PLU configurado., 5
    busy := false
    return
  }

  ; Cerrar dialogo pendiente
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
    TrayTip, Bridge CRE, No se encontro Cash Register Express., 4
    busy := false
    return
  }

  WinActivate, Cash Register Express
  Sleep, 400

  ; Escribir cada PLU en CRE
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

  TrayTip, Orden lista, #%orderNum% - %count% producto(s) en CRE., 4
  busy := false
  return
