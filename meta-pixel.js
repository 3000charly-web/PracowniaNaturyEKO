/* Pracownia Natury EKO — baner zgody na cookies + Piksel Meta (Facebook).
   Piksel włącza się DOPIERO po kliknięciu „Akceptuję”. Wybór jest zapamiętany w przeglądarce.
   Numer piksela: zmień wyłącznie wartość PIXEL_ID poniżej. */
(function(){
  'use strict';
  var PIXEL_ID='1484309313587327';
  var CONSENT_KEY='pn_consent_v1';
  var pixelLoaded=false;
  var purchaseData=null;      // dane zakupu odczytane po powrocie ze Stripe
  var purchaseSent=false;

  function getConsent(){try{return localStorage.getItem(CONSENT_KEY)}catch(e){return null}}
  function setConsent(v){try{localStorage.setItem(CONSENT_KEY,v)}catch(e){}}

  /* ---------- pomocnicze ---------- */
  function parseNum(text){
    var m=String(text||'').replace(/ /g,' ').match(/(\d+(?:[.,]\d+)?)\s*zł/i);
    return m?Number(m[1].replace(',','.')):null;
  }
  function isAvailable(item){
    var d=(item&&item.dostepnosc)||'';
    return /dostępny/i.test(d)&&!/niedostęp|potwierd|zamówienie|sezon/i.test(d);
  }
  function track(name,params){
    if(!pixelLoaded||typeof window.fbq!=='function')return;
    try{params?window.fbq('track',name,params):window.fbq('track',name)}catch(e){}
  }

  /* ---------- Zakup po powrocie ze Stripe (czytamy adres od razu, zanim strona go wyczyści) ---------- */
  (function readPurchase(){
    try{
      var p=new URLSearchParams(window.location.search);
      if(p.get('payment')!=='success')return;
      var sid=p.get('session_id')||'';
      if(!sid)return;
      if(localStorage.getItem('pn_pixel_purchase_'+sid))return; // ten zakup już zgłoszony
      var pending=JSON.parse(localStorage.getItem('pracownia_natury_pending_stripe_v1')||'null');
      var value=0,ids=[];
      if(pending&&Array.isArray(pending.cart)){
        pending.cart.forEach(function(it){
          value+=(Number(it.price)||0)*(Number(it.qty)||1);
          ids.push(it.key);
        });
        var ship=pending.ship&&parseNum(pending.ship.cena);
        if(ship)value+=ship;
      }
      purchaseData={sid:sid,value:value,ids:ids};
    }catch(e){}
  })();

  function sendPurchase(){
    if(!purchaseData||purchaseSent||!pixelLoaded)return;
    purchaseSent=true;
    var params={currency:'PLN',content_type:'product'};
    if(purchaseData.value>0)params.value=purchaseData.value;
    if(purchaseData.ids.length)params.content_ids=purchaseData.ids;
    track('Purchase',params);
    try{localStorage.setItem('pn_pixel_purchase_'+purchaseData.sid,'1')}catch(e){}
  }

  /* ---------- Ładowanie piksela (tylko po zgodzie) ---------- */
  function loadPixel(){
    if(pixelLoaded)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init',PIXEL_ID);
    pixelLoaded=true;
    track('PageView');
    // Oglądanie produktu: podstrona zakwasu
    if(/zakwas-bolotowa/i.test(window.location.pathname)){
      var prods=window.PRODUCTS||{};
      var item=prods['enzymy-bolotowa'];
      var params={content_ids:['enzymy-bolotowa'],content_type:'product',content_name:'Zakwas Enzymy Bołotowa',currency:'PLN'};
      var price=item&&parseNum(item.cena);
      if(price)params.value=price;
      track('ViewContent',params);
    }
    sendPurchase();
  }

  /* ---------- Zdarzenia: dodanie do koszyka i przejście do płatności ---------- */
  document.addEventListener('click',function(e){
    if(!pixelLoaded)return;
    var add=e.target.closest&&e.target.closest('[data-add-cart]');
    if(add){
      var key=add.getAttribute('data-add-cart');
      var item=(window.PRODUCTS||{})[key];
      if(item&&isAvailable(item)){
        var params={content_ids:[key],content_type:'product',content_name:item.nazwa||key,currency:'PLN'};
        if(!(Array.isArray(item.warianty)&&item.warianty.length)){
          var price=parseNum(item.cena);
          if(price)params.value=price;
        }
        track('AddToCart',params);
      }
      return;
    }
    if(e.target.closest&&e.target.closest('[data-send-order]')){
      track('InitiateCheckout',{currency:'PLN'});
    }
  },true);

  /* ---------- Baner zgody ---------- */
  var banner=null;
  function hideBanner(){if(banner&&banner.parentNode){banner.parentNode.removeChild(banner)}banner=null}
  function showBanner(){
    if(banner)return;
    banner=document.createElement('div');
    banner.className='cookie-banner';
    banner.setAttribute('role','dialog');
    banner.setAttribute('aria-label','Zgoda na pliki cookies');
    banner.innerHTML=
      '<p>Używamy piksela Meta (Facebook), aby mierzyć skuteczność naszych reklam. Robimy to tylko za Twoją zgodą. '+
      'Statystyki odwiedzin zbieramy bez plików cookies.</p>'+
      '<div class="cookie-banner-buttons">'+
      '<button type="button" class="btn primary" data-cookie-accept>Akceptuję</button>'+
      '<button type="button" class="btn" data-cookie-reject>Odrzucam</button>'+
      '</div>';
    document.body.appendChild(banner);
    banner.querySelector('[data-cookie-accept]').addEventListener('click',function(){
      setConsent('yes');hideBanner();loadPixel();
    });
    banner.querySelector('[data-cookie-reject]').addEventListener('click',function(){
      setConsent('no');hideBanner();
      if(pixelLoaded&&typeof window.fbq==='function'){try{window.fbq('consent','revoke')}catch(e){}}
    });
  }

  // Link „Zmień ustawienia cookies” w informacji prawnej
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-cookie-settings]');
    if(!a)return;
    e.preventDefault();
    showBanner();
  });

  function init(){
    var c=getConsent();
    if(c==='yes')loadPixel();
    else if(c!=='no')showBanner();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
