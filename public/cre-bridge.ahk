; ============================================================
;  BRIDGE: Kiosco Autónomo  ↔  Cash Register Express (CRE)
;  Autor: generado automáticamente
;
;  INSTRUCCIONES:
;  1. Instala AutoHotKey v1.x desde https://www.autohotkey.com
;  2. Edita la línea API_BASE con la IP y puerto de tu kiosco
;  3. Abre CRE y asegúrate de que la ventana esté activa
;  4. Haz doble clic en este archivo para activar el bridge
;  5. Escanea el código de barras del ticket del cliente
;     → El script cargará todos los ítems en CRE automáticamente
; ============================================================

#NoEnv
#SingleInstance Force
SetBatchLines -1
SetKeyDelay, 80, 50

; ── CONFIGURACIÓN ────────────────────────────────────────────
; Cambia esta URL a la IP de la PC donde corre el kiosco
API_BASE := "https://pos-app-taupe.vercel.app"

; Intervalo máximo (ms) entre teclas para considerarse escáner
SCANNER_SPEED := 60
; ─────────────────────────────────────────────────────────────

global buffer := ""
global lastKey := 0

; Interceptar dígitos
~$*0:: GoSub, AddDigit
~$*1:: GoSub, AddDigit
~$*2:: GoSub, AddDigit
~$*3:: GoSub, AddDigit
~$*4:: GoSub, AddDigit
~$*5:: GoSub, AddDigit
~$*6:: GoSub, AddDigit
~$*7:: GoSub, AddDigit
~$*8:: GoSub, AddDigit
~$*9:: GoSub, AddDigit

AddDigit:
  now := A_TickCount
  digit := SubStr(A_ThisHotkey, 0, 1)  ; último carácter
  if ((now - lastKey) < SCANNER_SPEED) {
    buffer .= digit
  } else {
    buffer := digit
  }
  lastKey := now
  return

; Enter = fin de código de barras
~$*Enter::
  now := A_TickCount
  if ((now - lastKey) < SCANNER_SPEED + 150 && buffer != "") {
    orderNum := buffer
    buffer := ""
    if orderNum is integer
    {
      GoSub, LoadOrderInCRE
      return
    }
  }
  buffer := ""
  return

LoadOrderInCRE:
  ; Consultar la API del kiosco
  url := API_BASE . "/api/orders/pos/" . orderNum
  whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
  whr.Open("GET", url, false)
  whr.Send()

  if (whr.Status != 200) {
    MsgBox, 48, Bridge CRE, No se encontró la orden #%orderNum%`n`nVerifica que el kiosco esté corriendo.
    return
  }

  json := whr.ResponseText

  ; Extraer ítems del JSON con expresiones regulares
  ; Formato esperado: {"plu":"1234","qty":2,"name":"ShackBurger"}
  itemsFound := 0
  pos := 1
  while RegExMatch(json, """plu"":""([^""]+)"",""qty"":(\d+)", m, pos) {
    plu := m1
    qty := m2
    pos += StrLen(m)

    ; En CRE: escribir cantidad * PLU en el campo de búsqueda de ítems
    Loop, %qty%
    {
      Send, %plu%
      Send, {Enter}
      Sleep, 300
    }
    itemsFound++
  }

  ; Verificar ítems sin PLU (los "missing")
  missingCount := 0
  if RegExMatch(json, """missing"":\[([^\]]*)\]", mm) {
    if (mm1 != "")
      missingCount := 1
  }

  if (itemsFound = 0 && missingCount = 0) {
    MsgBox, 48, Bridge CRE, La orden #%orderNum% no tiene códigos PLU configurados.`n`nAsigna los PLU en el panel de administración del kiosco.
  } else if (missingCount > 0) {
    MsgBox, 64, Bridge CRE, Orden #%orderNum% cargada con %itemsFound% tipo(s) de ítem.`n`n⚠ Algunos ítems no tienen PLU asignado - agrégalos manualmente.
  }
  return
