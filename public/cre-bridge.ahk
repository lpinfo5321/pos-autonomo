; ============================================================
;  BRIDGE v9: Kiosco -> Cash Register Express
;
;  NUEVO METODO - Un solo PLU "KIOSKO" para toda la orden:
;  1. El script busca el PLU "KIOSKO" configurado en el admin
;  2. Lo agrega en CRE con el total exacto de la orden
;  3. El cajero solo cobra ese monto - sin PLUs individuales
;
;  REQUISITO: Crear en CRE un articulo "KIOSKO" con precio $0.00
;  y configurar su PLU en Admin del kiosco > Configuracion
;
;  EJECUTAR COMO ADMINISTRADOR
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
global capturedOrderNum  := ""
global lastProcessed     := ""
global lastProcessedTime := 0

TrayTip, Bridge CRE v9, Activo. Escanea el ticket del cliente., 5

SetTimer, ReadScanField, 30
SetTimer, WatchDialog,   150
return

; ── Leer campo de escaneo de CRE (numeros cortos = numero de orden)
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
      if fv is integer
      {
        if (StrLen(fv) <= 6)   ; numeros cortos = orden, no PLU
          capturedOrderNum := fv
      }
    }
  }
  return

; ── Detectar dialogo "Item Not Found" ───────────────────────────
WatchDialog:
  global busy, capturedOrderNum, lastScanField
  global lastProcessed, lastProcessedTime
  if busy
    return

  IfWinExist, Item Not Found
  {
    busy := true
    SetTimer, ReadScanField, Off

    orderNum := capturedOrderNum
    capturedOrderNum := ""
    lastScanField    := ""

    if orderNum is not integer
    {
      WinActivate, Item Not Found
      Sleep, 150
      Send {Enter}
      SetTimer, ReadScanField, 30
      busy := false
      return
    }

    ; Anti-duplicado: misma orden en menos de 20 segundos
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 20000)
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

    ; Cerrar el dialogo de error
    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 500

    GoSub, ProcesarOrden
  }
  return

; ── Consultar kiosco y agregar "KIOSKO $XX.XX" en CRE ───────────
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
    TrayTip, Bridge CRE, Orden #%orderNum% no encontrada en el kiosco., 5
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error del servidor: %httpStatus%, 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  json := httpBody

  ; Extraer PLU del kiosco y total de la orden
  RegExMatch(json, """kioskPlu"":""([^""]*?)""", pluM)
  RegExMatch(json, """total"":([\d.]+)", totalM)

  kioskPlu   := pluM1
  orderTotal := totalM1

  if (kioskPlu = "")
  {
    TrayTip, Bridge CRE, Configura el PLU KIOSKO en Admin > Configuracion., 6
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  if (orderTotal = "")
  {
    TrayTip, Bridge CRE, No se pudo leer el total de la orden., 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  ; Formatear total como precio (ej: 15.99)
  orderTotal := orderTotal + 0

  ; Cerrar cualquier dialogo pendiente
  IfWinExist, Item Not Found
  {
    WinActivate, Item Not Found
    Sleep, 150
    Send {Enter}
    Sleep, 300
  }

  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, No se encontro Cash Register Express., 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  WinActivate, Cash Register Express
  Sleep, 400

  ; 1. Tipear PLU del articulo "KIOSKO"
  SendInput % kioskPlu
  Sleep, 100
  SendInput {Enter}
  Sleep, 900

  ; 2. Cambiar precio al total de la orden (Ctrl+L = Price Change en CRE)
  IfWinExist, Item Not Found
  {
    ; Si CRE no reconoce el PLU, avisar
    WinActivate, Item Not Found
    Sleep, 100
    Send {Enter}
    Sleep, 200
    TrayTip, Bridge CRE, PLU %kioskPlu% no encontrado en CRE.`nVerifica el PLU KIOSKO en Admin., 7
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  ; Price Change
  WinActivate, Cash Register Express
  Sleep, 300
  Send ^l    ; Ctrl+L = PRICE CHANGE en CRE
  Sleep, 600

  ; Tipear el total
  SendInput % orderTotal
  Sleep, 100
  SendInput {Enter}
  Sleep, 500

  TrayTip, Listo, Orden #%orderNum% - Total $%orderTotal% en CRE., 4

  Sleep, 2000
  lastScanField    := ""
  capturedOrderNum := ""
  SetTimer, ReadScanField, 30
  busy := false
  return
