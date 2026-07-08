;(function(){
  'use strict'

  // Helper: throttle simple log failures silently
  function safe(fn){ try { return fn() } catch(e){ return undefined } }

  var doc = document
  var win = window

  var currentScript = doc.currentScript || (function(){
    var scripts = doc.getElementsByTagName('script')
    return scripts[scripts.length-1]
  })()

  var dataBot = safe(function(){ return currentScript.getAttribute('data-bot') }) || 'default-bot'
  var dataPosition = safe(function(){ return currentScript.getAttribute('data-position') }) || 'right'
  var dataBadge = safe(function(){ return currentScript.getAttribute('data-badge') }) || ''

  // Derive base origin from the script src so hosting can be flexible
  var scriptSrc = safe(function(){ return currentScript.src }) || ''
  var baseOrigin = (function(){
    try{
      if(!scriptSrc) return ''
      var u = new URL(scriptSrc)
      return u.origin
    }catch(e){ return '' }
  })()

  // Fallback to chat domain if origin not derivable
  if(!baseOrigin) baseOrigin = 'https://chatbot.pn-denpasar.go.id'

  var iframeUrl = baseOrigin + '/?bot=' + encodeURIComponent(dataBot)

  // Prevent double-initialization
  if(win.__pn_denpasar_widget_loaded) return
  win.__pn_denpasar_widget_loaded = true

  // Inject basic styles
  var css = '\n' +
    '.pn-chat-widget{position:fixed;z-index:2147483647;bottom:20px;right:20px;font-family:Arial,sans-serif}'+
    '.pn-chat-button{width:56px;height:56px;border-radius:28px;background:#0066cc;color:#fff;border:none;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;font-size:24px}'+
    '.pn-chat-panel{position:fixed;bottom:90px;right:20px;width:360px;height:500px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.25);display:flex;flex-direction:column;border:1px solid #e6e6e6}'+
    '.pn-chat-header{height:48px;background:#0066cc;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-weight:600}'+
    '.pn-chat-close{background:transparent;border:none;color:inherit;font-size:18px;cursor:pointer}'+
    '.pn-chat-iframe{flex:1;border:0;width:100%;height:100%;background:#fff}'+
    '.pn-chat-footer{height:36px;background:#fafafa;border-top:1px solid #eee;display:flex;align-items:center;justify-content:center;font-size:12px;color:#666}'+
    '.pn-hidden{display:none!important}'+
    '.pn-chat-badge{position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;border-radius:10px;padding:2px 6px;font-size:11px;font-weight:700}'+
    ''

  var style = doc.createElement('style')
  style.setAttribute('type','text/css')
  style.appendChild(doc.createTextNode(css))
  doc.head.appendChild(style)

  // Build widget DOM
  var widget = doc.createElement('div')
  widget.className = 'pn-chat-widget'

  var button = doc.createElement('button')
  button.className = 'pn-chat-button'
  button.setAttribute('aria-label','Open chat')
  button.innerHTML = '\u2709' // envelope icon

  if(dataBadge){
    var badge = doc.createElement('span')
    badge.className = 'pn-chat-badge'
    badge.textContent = dataBadge
    button.style.position = 'relative'
    button.appendChild(badge)
  }

  var panel = doc.createElement('div')
  panel.className = 'pn-chat-panel pn-hidden'

  var header = doc.createElement('div')
  header.className = 'pn-chat-header'
  header.innerHTML = '<div>Chat</div>'

  var closeBtn = doc.createElement('button')
  closeBtn.className = 'pn-chat-close'
  closeBtn.setAttribute('aria-label','Close chat')
  closeBtn.innerHTML = '\u2715'
  header.appendChild(closeBtn)

  var iframe = doc.createElement('iframe')
  iframe.className = 'pn-chat-iframe'
  iframe.src = iframeUrl
  iframe.title = 'Chat'
  iframe.allow = 'microphone; camera; fullscreen; autoplay; clipboard-write'

  var footer = doc.createElement('div')
  footer.className = 'pn-chat-footer'
  footer.textContent = 'Powered by PN Denpasar Chat'

  panel.appendChild(header)
  panel.appendChild(iframe)
  panel.appendChild(footer)

  widget.appendChild(button)
  widget.appendChild(panel)

  doc.body.appendChild(widget)

  // State helpers
  function isOpen(){ return !panel.classList.contains('pn-hidden') }
  function open(){ panel.classList.remove('pn-hidden'); saveState(true) }
  function close(){ panel.classList.add('pn-hidden'); saveState(false) }

  // persist open state across pages in same origin
  function saveState(v){ try{ localStorage.setItem('pn_chat_open_' + dataBot, v? '1':'0') }catch(e){} }
  function loadState(){ try{ return localStorage.getItem('pn_chat_open_' + dataBot) === '1' }catch(e){ return false } }

  // Restore last state if previously open
  if(loadState()) open()

  // Events
  button.addEventListener('click', function(e){ if(isOpen()) close(); else open() })
  closeBtn.addEventListener('click', function(e){ close() })

  // click outside to close (on small screens)
  doc.addEventListener('click', function(ev){
    var target = ev.target
    if(!widget.contains(target) && isOpen()) close()
  })

  // Expose minimal API
  win.PNChatWidget = win.PNChatWidget || {}
  win.PNChatWidget.open = open
  win.PNChatWidget.close = close
  win.PNChatWidget.toggle = function(){ if(isOpen()) close(); else open() }
  win.PNChatWidget.setBot = function(bot){ dataBot = bot; iframe.src = baseOrigin + '/?bot=' + encodeURIComponent(bot) }

  // graceful no-conflict: if document isn't ready yet, wait
  // (we appended on DOMContentLoaded but ensure body exists)
  if(!doc.body){ doc.addEventListener('DOMContentLoaded', function(){ doc.body.appendChild(widget) }) }

})();
