; ============================================================
;  BRIDGE v11: Kiosco -> Cash Register Express
;  Metodo: PLU individual por cada producto y modificador
;
;  FLUJO:
;  1. Cajero escanea el ticket del cliente (codigo de barras)
;  2. CRE muestra "Item Not Found" (el # de orden no es un PLU)
;  3. Este script detecta el dialogo, cierra automaticamente
;  4. Consulta el kiosco para obtener los productos con sus PLUs
;  5. Tipea cada PLU en CRE uno por uno
;  6. Si algun PLU no existe en CRE, lo descarta silenciosamente
;  7. El cajero solo cobra el total que ya aparece en CRE
;
;  REQUISITOS:
;  - EJECUTAR COMO ADMINISTRADOR
;  - CRE debe estar abierto
; ============================================================
#NoEnv
#SingleInstance Force
#Persistent
#InstallKeybdHook
SetBatchLines -1
SetTitleMatchMode, 2

API_BASE := "https://pos-app-taupe.vercel.app"

global busy              := false
global capturedOrderNum  := ""
global lastScanField     := ""
global lastProcessed     := ""
global lastProcessedTime := 0

TrayTip, Bridge CRE v11, Activo - Escanea el ticket del cliente., 5

; Leer el campo de escaneo de CRE cada 25ms
SetTimer, ReadScanField, 25
; Vigilar el dialogo "Item Not Found" cada 100ms
SetTimer, WatchDialog,   100
return

; ── Hotkey manual: Ctrl+Shift+R = reprocesar ultima orden ────────────────────
^+r::
  if busy
  {
    TrayTip, Bridge CRE, Ocupado procesando..., 2
    return
  }
  if (lastProcessed = "")
  {
    TrayTip, Bridge CRE, No hay orden reciente para reprocesar., 3
    return
  }
  orderNum := lastProcessed
  lastProcessedTime := 0   ; resetear anti-duplicado para permitir reproceso
  GoSub, ProcesarOrden
return

; ── Leer campo de escaneo de CRE ─────────────────────────────────────────────
ReadScanField:
  if busy
    return
  SetTitleMatchMode, 2
  IfWinExist, Cash Register Express
  {
    ControlGetText, fv, Edit1, Cash Register Express
    fv := Trim(fv)
    if (fv = "" || fv = lastScanField)
      return
    lastScanField := fv
    ; Solo capturar numeros cortos (numeros de orden)
    if fv is integer
    {
      if (StrLen(fv) >= 1 && StrLen(fv) <= 6)
        capturedOrderNum := fv
    }
  }
  return

; ── Detectar y manejar dialogo "Item Not Found" ───────────────────────────────
WatchDialog:
  SetTitleMatchMode, 2
  if busy
    return

  IfWinExist, Item Not Found
  {
    ; Tomar el numero capturado y limpiar estado
    orderNum := capturedOrderNum
    capturedOrderNum := ""
    lastScanField    := ""

    ; Validar que sea un numero de orden
    if orderNum is not integer
    {
      ; No era una orden, solo cerrar el dialogo
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      return
    }

    ; Anti-duplicado: no reprocesar la misma orden en los proximos 30 segundos
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      TrayTip, Bridge CRE, Orden #%orderNum% ya fue procesada., 3
      return
    }

    ; Marcar como ocupado ANTES de cualquier Sleep para evitar re-entrada
    busy := true
    SetTimer, ReadScanField, Off

    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount

    ; Cerrar el dialogo "Item Not Found"
    WinActivate, Item Not Found
    Sleep, 80
    Send {Enter}
    Sleep, 300

    GoSub, ProcesarOrden
  }
  return

; ── Tipear un PLU en CRE y manejar posible "Item Not Found" ─────────────────
; Parametro global: g_plu
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return

  WinActivate, Cash Register Express
  Sleep, 150

  SendInput % g_plu
  Sleep, 80
  SendInput {Enter}

  ; Esperar hasta 600ms a que CRE procese
  Loop, 6
  {
    Sleep, 100
    ; Si aparece "Item Not Found", descartarlo silenciosamente y continuar
    IfWinExist, Item Not Found
    {
      WinActivate, Item Not Found
      Sleep, 60
      Send {Enter}
      Sleep, 120
      break
    }
  }
  return

; ── Consultar kiosco y escribir PLUs en CRE ──────────────────────────────────
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
    SetTimer, ReadScanField, 25
    busy := false
    return
  }

  httpStatus := whr.Status
  httpBody   := whr.ResponseText

  if (httpStatus = 404)
  {
    TrayTip, Bridge CRE, Orden #%orderNum% no encontrada en el kiosco., 5
    SetTimer, ReadScanField, 25
    busy := false
    return
  }

  if (httpStatus != 200)
  {
    TrayTip, Bridge CRE, Error del servidor: %httpStatus%, 4
    SetTimer, ReadScanField, 25
    busy := false
    return
  }

  ; Verificar que CRE esta abierto
  IfWinNotExist, Cash Register Express
  {
    TrayTip, Bridge CRE, No se encontro Cash Register Express., 4
    SetTimer, ReadScanField, 25
    busy := false
    return
  }

  ; ── Parsear JSON con items y sus PLUs ──────────────────────────────────────
  ;
  ; Estructura esperada:
  ;   { "items": [ { "name":"...", "qty":2, "plus":["8MOD","68MOD"] }, ... ] }
  ;
  ; Extraemos cada bloque de item y su lista de PLUs.
  ;

  json       := httpBody
  itemsAdded := 0

  ; Posicion de busqueda dentro del JSON
  pos        := 1

  ; Iterar cada objeto de item en el array "items"
  Loop
  {
    ; Encontrar el proximo bloque { ... } dentro del array
    startBrace := InStr(json, "{", false, pos)
    if (startBrace = 0)
      break

    ; Encontrar el cierre correspondiente (nivel 1)
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

    ; Extraer qty
    RegExMatch(itemJson, """qty""\s*:\s*(\d+)", qtyM)
    itemQty := (qtyM1 + 0)
    if (itemQty < 1)
      itemQty := 1

    ; Extraer el array "plus": ["PLU1","PLU2",...]
    RegExMatch(itemJson, """plus""\s*:\s*\[([^\]]*)\]", plusM)
    plusRaw := plusM1

    ; Construir lista de PLUs desde el string extraido
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

    ; ── Tipear los PLUs: qty veces cada combinacion de PLUs ────────────────
    Loop, % itemQty
    {
      for k, plu in plusList
      {
        g_plu := plu
        GoSub, TypePLU
        Sleep, 80
      }
      ; Pausa pequeña entre unidades del mismo item
      Sleep, 200
    }

    itemsAdded++
  }

  ; Mostrar resumen discreto
  TrayTip, Listo, Orden #%orderNum% cargada en CRE (%itemsAdded% items)., 4

  ; Limpiar estado
  Sleep, 1500
  lastScanField    := ""
  capturedOrderNum := ""
  SetTimer, ReadScanField, 25
  busy := false
  return
