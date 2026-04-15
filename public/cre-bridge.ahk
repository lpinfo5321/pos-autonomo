; ============================================================
;  BRIDGE v12: Kiosco -> Cash Register Express
;
;  SOLUCION AL PROBLEMA DE TIMING:
;  Antes: un timer intentaba leer el campo DESPUES de que CRE
;         ya lo habia borrado → nunca capturaba el numero.
;  Ahora: interceptamos la tecla Enter mientras CRE esta activo.
;         En ese momento el campo Edit1 todavia tiene el valor
;         del escaner → captura 100% confiable.
;
;  FLUJO:
;  1. Escaner envia digitos + Enter a CRE
;  2. ANTES de que CRE procese el Enter, capturamos el valor
;  3. CRE muestra "Item Not Found" (numero de orden no es un PLU)
;  4. Script cierra el dialogo automaticamente
;  5. Consulta el kiosco, tipea los PLUs del pedido en CRE
;  6. Cualquier PLU no reconocido se descarta silenciosamente
;
;  REQUISITOS:
;  - Ejecutar como ADMINISTRADOR
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
global lastProcessed     := ""
global lastProcessedTime := 0

TrayTip, Bridge CRE v12, Activo - Escanea el ticket del cliente., 5

; Solo se necesita el timer para cerrar el dialogo y procesar
SetTimer, WatchDialog, 80
return

; ── Interceptar Enter cuando CRE esta activo ────────────────────────────────
; ~*Enter:: pasa el Enter a CRE Y ademas ejecuta este bloque.
; Si busy=true (el script esta tipeando PLUs) ignoramos la captura
; para que los PLUs que se tipean no se confundan con numeros de orden.
~*Enter::
  if busy
    return
  SetTitleMatchMode, 2
  IfWinActive, Cash Register Express
  {
    ; Leer el campo en el momento exacto antes de que CRE lo procese
    ControlGetText, fv, Edit1, Cash Register Express
    fv := Trim(fv)
    if (fv = "")
      return
    ; Solo capturar si es un numero entero corto (1-5 digitos = numero de orden)
    if fv is integer
    {
      n := fv + 0
      if (n >= 1 && n <= 99999)
        capturedOrderNum := fv
    }
  }
  return

; ── Detectar dialogo "Item Not Found" y procesar orden ──────────────────────
WatchDialog:
  SetTitleMatchMode, 2
  if busy
    return

  IfWinExist, Item Not Found
  {
    orderNum := capturedOrderNum
    capturedOrderNum := ""

    ; Si no hay numero capturado, solo cerrar el dialogo
    if orderNum is not integer
    {
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      return
    }

    ; Anti-duplicado: ignorar la misma orden por 30 segundos
    now := A_TickCount
    if (orderNum = lastProcessed && (now - lastProcessedTime) < 30000)
    {
      WinActivate, Item Not Found
      Sleep, 80
      Send {Enter}
      TrayTip, Bridge CRE, Orden #%orderNum% ya procesada., 3
      return
    }

    ; Bloquear re-entrada ANTES de cualquier Sleep
    busy := true
    lastProcessed     := orderNum
    lastProcessedTime := A_TickCount

    ; Cerrar el dialogo
    WinActivate, Item Not Found
    Sleep, 80
    Send {Enter}
    Sleep, 400

    GoSub, ProcesarOrden
  }
  return

; ── Hotkey manual: Ctrl+Shift+R = reprocesar ultima orden ───────────────────
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

; ── Tipear un PLU y descartar silenciosamente si no existe en CRE ────────────
; Usa la variable global g_plu
TypePLU:
  SetTitleMatchMode, 2
  IfWinNotExist, Cash Register Express
    return

  WinActivate, Cash Register Express
  Sleep, 120

  SendInput % g_plu
  Sleep, 60
  SendInput {Enter}

  ; Esperar hasta 700ms a que CRE procese el PLU
  Loop, 7
  {
    Sleep, 100
    IfWinExist, Item Not Found
    {
      ; PLU no reconocido — cerrar silenciosamente y continuar
      WinActivate, Item Not Found
      Sleep, 50
      Send {Enter}
      Sleep, 150
      break
    }
  }
  return

; ── Consultar kiosco y escribir PLUs en CRE ─────────────────────────────────
ProcesarOrden:
  SetTitleMatchMode, 2
  url := API_BASE . "/api/orders/pos/" . orderNum

  ; Notificar que se esta procesando
  TrayTip, Bridge CRE, Buscando orden #%orderNum%..., 2

  whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
  try
  {
    whr.Open("GET", url, false)
    whr.Send()
  }
  catch e
  {
    TrayTip, Bridge CRE, Sin conexion a internet., 4
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
    TrayTip, Bridge CRE, Error del servidor %httpStatus%, 4
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
  ; Formato: { "items": [ { "qty":N, "plus":["PLU1","PLU2"] }, ... ] }

  json       := httpBody
  pos        := 1
  itemsAdded := 0

  Loop
  {
    ; Buscar siguiente objeto { }
    startBrace := InStr(json, "{", false, pos)
    if (startBrace = 0)
      break

    ; Encontrar el cierre correspondiente
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

    ; Extraer lista de PLUs del array "plus"
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

    ; Tipear: qty repeticiones de la combinacion de PLUs
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
  busy             := false
  return
