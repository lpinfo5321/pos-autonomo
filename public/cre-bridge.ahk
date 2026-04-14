; ============================================================
;  BRIDGE v10: Kiosco -> Cash Register Express
;
;  METODO PROMPT PRICE:
;  1. El script tipea el PLU "KIOSKO" en CRE
;  2. CRE pide el precio automaticamente (Prompt Price activado)
;  3. El script escribe el total de la orden
;  4. Listo para cobrar
;
;  REQUISITOS:
;  - Articulo KIOSKO en CRE con "Prompt Price" MARCADO
;  - PLU del KIOSKO configurado en Admin del kiosco > Configuracion
;  - EJECUTAR COMO ADMINISTRADOR
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

TrayTip, Bridge CRE v10, Activo. Escanea el ticket del cliente., 5

SetTimer, ReadScanField, 30
SetTimer, WatchDialog,   150
return

; ── Leer campo de escaneo de CRE ────────────────────────────────
ReadScanField:
  global busy, lastScanField, capturedOrderNum
  if busy
    return
  SetTitleMatchMode, 2
  IfWinExist, Cash Register Express
  {
    ControlGetText, fv, Edit1, Cash Register Express
    fv := Trim(fv)
    if (fv != "" && fv != lastScanField)
    {
      lastScanField := fv
      if fv is integer
      {
        if (StrLen(fv) <= 6)
          capturedOrderNum := fv
      }
    }
  }
  return

; ── Detectar dialogo "Item Not Found" ───────────────────────────
WatchDialog:
  global busy, capturedOrderNum, lastScanField
  global lastProcessed, lastProcessedTime
  SetTitleMatchMode, 2   ; CRITICO: los timers usan modo 1 por defecto
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

    WinActivate, Item Not Found
    Sleep, 200
    Send {Enter}
    Sleep, 500

    GoSub, ProcesarOrden
  }
  return

; ── Consultar kiosco y escribir PLU + precio en CRE ─────────────
ProcesarOrden:
  SetTitleMatchMode, 2
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
    TrayTip, Bridge CRE, Orden #%orderNum% no encontrada., 5
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error servidor: %httpStatus%, 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  json := httpBody

  RegExMatch(json, """kioskPlu"":""([^""]*?)""", pluM)
  RegExMatch(json, """total"":([\d.]+)", totalM)

  kioskPlu   := pluM1
  orderTotal := totalM1 + 0

  if (kioskPlu = "")
  {
    TrayTip, Bridge CRE, Configura el PLU KIOSKO en Admin > Configuracion., 6
    SetTimer, ReadScanField, 30
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

  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, No se encontro Cash Register Express., 4
    SetTimer, ReadScanField, 30
    busy := false
    return
  }

  ; ── Paso 1: tipear el PLU del KIOSKO ────────────────────────────
  WinActivate, Cash Register Express
  Sleep, 400
  SendInput % kioskPlu
  Sleep, 100
  SendInput {Enter}
  Sleep, 800

  ; ── Paso 2: CRE pide el precio (Prompt Price) → escribir total ──
  ; Esperar hasta 3 segundos a que aparezca el dialogo de precio
  priceDialogFound := false
  Loop, 15
  {
    ; CRE muestra un dialogo "Enter Price" o similar
    IfWinExist, ahk_class #32770
    {
      priceDialogFound := true
      break
    }
    ; Tambien puede ser que ya se haya agregado con otro dialogo
    IfWinExist, Item Not Found
    {
      ; El PLU no fue reconocido
      WinActivate, Item Not Found
      Sleep, 100
      Send {Enter}
      Sleep, 200
      TrayTip, Bridge CRE, PLU %kioskPlu% no reconocido en CRE.`nVerifica el PLU en Admin del kiosco., 7
      SetTimer, ReadScanField, 30
      busy := false
      return
    }
    Sleep, 200
  }

  if priceDialogFound
  {
    WinActivate, ahk_class #32770
    Sleep, 200
    SendInput % orderTotal
    Sleep, 100
    SendInput {Enter}
    Sleep, 500
  }
  else
  {
    ; Si no hubo dialogo de precio, intentar con PRICE CHANGE (Ctrl+L)
    WinActivate, Cash Register Express
    Sleep, 300
    Send ^l
    Sleep, 600
    SendInput % orderTotal
    Sleep, 100
    SendInput {Enter}
    Sleep, 500
  }

  TrayTip, Listo, Orden #%orderNum% - $%orderTotal% en CRE., 4

  Sleep, 2000
  lastScanField    := ""
  capturedOrderNum := ""
  SetTimer, ReadScanField, 30
  busy := false
  return
