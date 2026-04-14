; ============================================================
;  BRIDGE v8: Kiosco -> Cash Register Express
;
;  TOTALMENTE AUTOMATICO:
;  1. Ejecutar como Administrador (clic derecho -> Run as admin)
;  2. Escanear el ticket del cliente en CRE
;  3. El script cierra el error y agrega los productos solo
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE := "https://pos-app-taupe.vercel.app"

global busy              := false
global lastScanField     := ""
global capturedOrderNum  := ""   ; numero capturado antes del dialogo
global lastProcessed     := ""
global lastProcessedTime := 0

TrayTip, Bridge CRE v8, Activo. Escanea el ticket del cliente., 5

SetTimer, ReadScanField, 30
SetTimer, WatchDialog,   150
return

; ── Leer campo de escaneo de CRE ────────────────────────────────
ReadScanField:
  global busy, lastScanField, capturedOrderNum
  if busy
    return
  IfWinExist, Cash Register Express
  {
    ControlGetText, fv, Edit1, Cash Register Express
    fv := Trim(fv)
    if (fv != "" && fv != lastScanField)
    {
      lastScanField := fv
      ; Guardar si parece un numero de orden (maximo 6 digitos)
      if fv is integer
      {
        if (StrLen(fv) <= 6)
          capturedOrderNum := fv
      }
    }
  }
  return

; ── Detectar dialogo de CRE y procesar ──────────────────────────
WatchDialog:
  global busy, lastScanField, capturedOrderNum
  global lastProcessed, lastProcessedTime
  if busy
    return

  IfWinExist, Item Not Found
  {
    busy := true
    SetTimer, ReadScanField, Off   ; pausar lectura durante proceso

    ; Usar el numero capturado (corto = orden), no el PLU
    orderNum := capturedOrderNum
    capturedOrderNum := ""
    lastScanField    := ""

    ; Validar
    if orderNum is not integer
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      SetTimer, ReadScanField, 30
      busy := false
      return
    }

    ; Anti-duplicado: misma orden en menos de 15 segundos = ignorar
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 15000)
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      SetTimer, ReadScanField, 30
      busy := false
      return
    }

    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount

    ; Cerrar el dialogo de CRE
    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 500

    GoSub, ProcesarOrden
  }
  return

; ── Consultar API y tipear PLU en CRE ───────────────────────────
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
    TrayTip, Bridge CRE, Sin conexion a internet., 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

  if (httpStatus = 404)
  {
    TrayTip, Bridge CRE, Orden #%orderNum% no existe en el kiosco., 5
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error servidor %httpStatus%, 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  json := httpBody

  if !RegExMatch(json, """plu"":""([^""]+)""")
  {
    TrayTip, Bridge CRE, Orden #%orderNum% sin PLU. Ve al Admin del kiosco., 5
    SetTimer, ReadScanField, 30
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

  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, No se encontro CRE., 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  WinActivate, Cash Register Express
  Sleep, 400

  ; Escribir cada PLU (una sola vez por la cantidad indicada en la orden)
  count := 0
  pos   := 1
  while (matchPos := RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos))
  {
    plu := m1
    qty := m2 + 0
    pos := matchPos + StrLen(m)   ; avanzar correctamente

    Loop, %qty%
    {
      Sleep, 200
      ; Cerrar error si CRE abre uno
      IfWinExist, Item Not Found
      {
        WinActivate, Item Not Found
        Sleep, 100
        Send {Enter}
        Sleep, 300
      }
      WinActivate, Cash Register Express
      Sleep, 300
      SendInput % plu
      Sleep, 100
      SendInput {Enter}
      Sleep, 900
    }
    count++
  }

  TrayTip, Listo, Orden #%orderNum% - %count% producto(s) en CRE., 4

  ; Reactivar lectura de campo (con delay para que CRE limpie el campo)
  Sleep, 2000
  lastScanField    := ""
  capturedOrderNum := ""
  SetTimer, ReadScanField, 30
  busy := false
  return
