;(function(){
  'use strict'

  function safe(fn){ try { return fn() } catch(e){ return undefined } }

  var doc = document
  var win = window

  var currentScript = doc.currentScript || (function(){
    var scripts = doc.getElementsByTagName('script')
    return scripts[scripts.length - 1]
  })()

  var dataBot = safe(function(){ return currentScript.getAttribute('data-bot') }) || 'pn-denpasar'
  var dataBadge = safe(function(){ return currentScript.getAttribute('data-badge') }) || ''

  var scriptSrc = safe(function(){ return currentScript.src }) || ''
  var baseOrigin = (function(){
    try {
      if (!scriptSrc) return ''
      return new URL(scriptSrc).origin
    } catch(e) { return '' }
  })()

  if (!baseOrigin) baseOrigin = 'https://chatbot.pn-denpasar.go.id'

  var iframeUrl = baseOrigin + '/?bot=' + encodeURIComponent(dataBot)
  var avatarUrl = baseOrigin + '/PandePintar.png'
  var logoUrl = baseOrigin + '/Logo.png'

  if (win.__pn_denpasar_widget_loaded) return
  win.__pn_denpasar_widget_loaded = true

  var css = '\n' +
    '.pn-chat-widget{position:fixed;z-index:2147483647;bottom:clamp(16px,3vw,28px);right:clamp(16px,3vw,28px);font-family:Arial,sans-serif}' +
    '.pn-chat-button{width:clamp(64px,10vw,84px);height:clamp(64px,10vw,84px);border-radius:50%;background:transparent;border:none;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0;transition:transform .2s ease,box-shadow .2s ease}' +
    '.pn-chat-button:hover{transform:scale(1.05);box-shadow:0 14px 32px rgba(0,0,0,.28)}' +
    '.pn-chat-button img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.pn-chat-panel{position:fixed;bottom:clamp(92px,12vh,110px);right:clamp(16px,3vw,28px);width:min(430px,calc(100vw - 32px));height:min(650px,calc(100dvh - 125px));background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.25);display:flex;flex-direction:column;border:1px solid #e6e6e6}' +
    '.pn-chat-header{height:56px;background:#9b0000;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14px;gap:12px;flex-shrink:0}' +
    '.pn-chat-header-left{display:flex;align-items:center;gap:12px;min-width:0}' +
    '.pn-chat-header-logo{width:42px;height:42px;border-radius:50%;background:#fff;padding:4px;object-fit:contain;flex-shrink:0}' +
    '.pn-chat-header-text{min-width:0}' +
    '.pn-chat-header-text strong{display:block;font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.pn-chat-header-text span{display:block;font-size:12px;opacity:.95;margin-top:2px}' +
    '.pn-chat-close{background:rgba(255,255,255,.16);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;flex-shrink:0}' +
    '.pn-chat-close:hover{background:rgba(255,255,255,.28)}' +
    '.pn-chat-iframe{flex:1;border:0;width:100%;height:100%;background:#fff}' +
    '.pn-hidden{display:none!important}' +
    '.pn-chat-badge{position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;border-radius:10px;padding:2px 6px;font-size:11px;font-weight:700}' +
    ''

  var style = doc.createElement('style')
  style.setAttribute('type', 'text/css')
  style.appendChild(doc.createTextNode(css))
  doc.head.appendChild(style)

  var widget = doc.createElement('div')
  widget.className = 'pn-chat-widget'

  var button = doc.createElement('button')
  button.className = 'pn-chat-button'
  button.setAttribute('aria-label', 'Buka chatbot PN Denpasar')
  button.style.position = 'relative'

  var buttonImg = doc.createElement('img')
  buttonImg.src = avatarUrl
  buttonImg.alt = 'Pande Pintar'
  button.appendChild(buttonImg)

  if (dataBadge) {
    var badge = doc.createElement('span')
    badge.className = 'pn-chat-badge'
    badge.textContent = dataBadge
    button.appendChild(badge)
  }

  var panel = doc.createElement('div')
  panel.className = 'pn-chat-panel pn-hidden'

  var header = doc.createElement('div')
  header.className = 'pn-chat-header'

  var headerLeft = doc.createElement('div')
  headerLeft.className = 'pn-chat-header-left'

  var headerLogo = doc.createElement('img')
  headerLogo.className = 'pn-chat-header-logo'
  headerLogo.src = logoUrl
  headerLogo.alt = 'Logo PN Denpasar'

  var headerText = doc.createElement('div')
  headerText.className = 'pn-chat-header-text'
  headerText.innerHTML = '<strong>PN Denpasar</strong><span>Pelayanan Informasi Online</span>'

  headerLeft.appendChild(headerLogo)
  headerLeft.appendChild(headerText)

  var closeBtn = doc.createElement('button')
  closeBtn.className = 'pn-chat-close'
  closeBtn.setAttribute('aria-label', 'Tutup chatbot')
  closeBtn.innerHTML = '\u2715'

  header.appendChild(headerLeft)
  header.appendChild(closeBtn)

  var iframe = doc.createElement('iframe')
  iframe.className = 'pn-chat-iframe'
  iframe.src = iframeUrl
  iframe.title = 'Chatbot PN Denpasar'
  iframe.allow = 'microphone; camera; fullscreen; autoplay; clipboard-write'

  panel.appendChild(header)
  panel.appendChild(iframe)

  widget.appendChild(button)
  widget.appendChild(panel)

  function mount() {
    if (!doc.body) return
    if (!doc.body.contains(widget)) doc.body.appendChild(widget)
  }

  mount()
  if (!doc.body) doc.addEventListener('DOMContentLoaded', mount)

  function isOpen(){ return !panel.classList.contains('pn-hidden') }
  function open(){ panel.classList.remove('pn-hidden'); saveState(true) }
  function close(){ panel.classList.add('pn-hidden'); saveState(false) }

  function saveState(v){ try { localStorage.setItem('pn_chat_open_' + dataBot, v ? '1' : '0') } catch(e){} }
  function loadState(){ try { return localStorage.getItem('pn_chat_open_' + dataBot) === '1' } catch(e){ return false } }

  if (loadState()) open()

  button.addEventListener('click', function(){ if (isOpen()) close(); else open() })
  closeBtn.addEventListener('click', function(){ close() })

  doc.addEventListener('click', function(ev){
    if (!widget.contains(ev.target) && isOpen()) close()
  })

  win.PNChatWidget = win.PNChatWidget || {}
  win.PNChatWidget.open = open
  win.PNChatWidget.close = close
  win.PNChatWidget.toggle = function(){ if (isOpen()) close(); else open() }
  win.PNChatWidget.setBot = function(bot){
    dataBot = bot
    iframe.src = baseOrigin + '/?bot=' + encodeURIComponent(bot)
  }

})();
