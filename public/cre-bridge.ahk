; ============================================================
;  BRIDGE: Kiosco Autónomo  ↔  Cash Register Express (CRE)
;  Versión 2.0 - Detección inteligente escáner vs teclado
;
;  INSTRUCCIONES:
;  1. AutoHotKey v1 debe estar instalado
;  2. Haz doble clic en este archivo - verás un H verde en la barra de tareas
;  3. Abre CRE en la pantalla de venta ("Scan Barcode Now...")
;  4. Escanea el código de barras del ticket del cliente
; ============================================================

#NoEnv
#SingleInstance Force
SetBatchLines -1
SetKeyDelay, 60, 30

; ── CONFIGURACIÓN ─────────────────────────────────────────
API_BASE      := "https://pos-app-taupe.vercel.app"
SCAN_MAX_MS   := 40   ; Escáner: menos de 40ms entre teclas
SCAN_TIMEOUT  := 300  ; Si pasan 300ms sin Enter, cancelar captura
; ──────────────────────────────────────────────────────────

global buffer   := ""
global lastKey  := 0
global isScanning := false

; ── Captura de dígitos ────────────────────────────────────
; Sin ~ → los dígitos NO se pasan a CRE automáticamente
; El script decide si pasarlos (teclado humano) o capturarlos (escáner)

$0:: HandleDigit("0")
$1:: HandleDigit("1")
$2:: HandleDigit("2")
$3:: HandleDigit("3")
$4:: HandleDigit("4")
$5:: HandleDigit("5")
$6:: HandleDigit("6")
$7:: HandleDigit("7")
$8:: HandleDigit("8")
$9:: HandleDigit("9")

HandleDigit(d) {
  global buffer, lastKey, isScanning, SCAN_MAX_MS
  now := A_TickCount
  gap := now - lastKey

  if (gap < SCAN_MAX_MS || (isScanning && buffer != "")) {
    ; Velocidad de escáner → capturar
    buffer    .= d
    lastKey   := now
    isScanning := true
  } else {
    ; Velocidad humana → pasar a CRE normalmente
    buffer     := d
    lastKey    := now
    isScanning := false
    SendInput % d
  }
}

; ── Enter: decide si es fin de escaneo o tecla normal ─────
$Enter::
  global buffer, lastKey, isScanning, SCAN_MAX_MS, SCAN_TIMEOUT
  now := A_TickCount
  gap := now - lastKey

  if (isScanning && buffer != "" && gap < SCAN_TIMEOUT) {
    orderNum   := buffer
    buffer     := ""
    isScanning := false

    if orderNum is integer
    {
      GoSub, LoadOrderInCRE
      return   ; NO enviar Enter a CRE — el script maneja todo
    }
  }

  ; No era escaneo → Enter normal
  buffer     := ""
  isScanning := false
  SendInput {Enter}
  return

; ── Consulta la API y teclea los PLU en CRE ───────────────
LoadOrderInCRE:
  url := API_BASE . "/api/orders/pos/" . orderNum
  whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
  whr.Open("GET", url, false)

  try {
    whr.Send()
  } catch e {
    MsgBox, 48, Bridge CRE, No se pudo conectar al kiosco.`nVerifica tu conexión a internet.
    return
  }

  if (whr.Status != 200) {
    MsgBox, 48, Bridge CRE, No se encontró la orden #%orderNum%
    return
  }

  json := whr.ResponseText
  itemsFound := 0

  ; Parsear cada ítem: {"plu":"123456789","qty":2,"name":"..."}
  pos := 1
  while RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos) {
    plu := m1
    qty := m2 + 0
    pos += StrLen(m)

    Loop, %qty%
    {
      Sleep, 150
      SendInput % plu
      Sleep, 80
      SendInput {Enter}
      Sleep, 400   ; Esperar que CRE procese el ítem
    }
    itemsFound++
  }

  ; Revisar ítems sin PLU
  hasMissing := RegExMatch(json, """missing"":\[""[^""]+""")

  if (itemsFound = 0 && !hasMissing) {
    MsgBox, 48, Bridge CRE, La orden #%orderNum% no tiene códigos PLU configurados.`n`nAsigna los PLU en Admin → Menú del kiosco.
  } else if (hasMissing) {
    MsgBox, 64, Bridge CRE, Orden #%orderNum% cargada (%itemsFound% ítem/s).`n`n⚠ Algunos ítems no tienen PLU - agrégalos manualmente.
  }
  return
