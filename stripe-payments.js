(()=>{
  const BACKEND='https://pracownia-natury-platnosci.3000charly.workers.dev';
  const CART_KEY='pracownia_natury_cart_v1';
  const PENDING_KEY='pracownia_natury_pending_stripe_v1';

  const getCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch{return []}};
  const getPending=()=>{try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch{return null}};

  function formDataObject(){
    const form=document.querySelector('[data-checkout-form]');
    return form ? Object.fromEntries(new FormData(form).entries()) : {};
  }

  function shippingItem(){
    const select=document.querySelector('[data-cart-shipping]');
    const list=Array.isArray(window.SHIPPING) ? window.SHIPPING : [];
    if(!select || !list.length) return null;
    return list[Number(select.value)||0] || null;
  }

  function updatePaymentUi(){
    const fieldset=document.querySelector('.payment-choice');
    if(fieldset){
      fieldset.innerHTML=`
        <legend>Sposób płatności</legend>
        <input type="hidden" name="payment" value="Płatność online Stripe">
        <p class="delivery-hint">Płatność online przez Stripe: BLIK, karta, Apple Pay, Google Pay lub Revolut Pay (zależnie od urządzenia i dostępności).</p>`;
    }

    const info=document.querySelector('[data-payment-info]');
    if(info){
      info.innerHTML='<strong>Płatność online</strong>Po zatwierdzeniu zamówienia przejdziesz do bezpiecznej strony Stripe.';
    }

    const button=document.querySelector('[data-send-order]');
    if(button && !button.disabled) button.textContent='Przejdź do płatności';

    const note=document.querySelector('[data-summary-content] > .checkout-note:not(.order-send-status)');
    if(note){
      note.textContent='Po kliknięciu przejdziesz do bezpiecznej płatności Stripe. Zamówienie zostanie oznaczone numerem widocznym także w Stripe.';
    }
  }

  async function beginCheckout(){
    const button=document.querySelector('[data-send-order]');
    const form=document.querySelector('[data-checkout-form]');
    const cart=getCart();
    const ship=shippingItem();
    const c=formDataObject();

    if(!cart.length){alert('Koszyk jest pusty.');return;}
    if(!form || !form.checkValidity()){form?.reportValidity();return;}
    if(!ship){alert('Wybierz sposób dostawy.');return;}

    if(button){
      button.disabled=true;
      button.textContent='Przechodzę do płatności…';
    }

    const status=document.querySelector('[data-order-send-status]');
    if(status) status.textContent='Tworzymy bezpieczną płatność Stripe…';

    try{
      const response=await fetch(`${BACKEND}/create-checkout-session`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          items:cart.map(x=>({id:x.key,qty:Number(x.qty)||1})),
          email:c.email||'',
          name:c.name||'',
          phone:c.phone||'',
          street:c.street||'',
          postal:c.postal||'',
          city:c.city||'',
          paczkomat:c.paczkomat||'',
          shipping:ship.nazwa,
          notes:c.notes||''
        })
      });

      const result=await response.json().catch(()=>({}));
      if(!response.ok || !result.ok || !result.url){
        throw new Error(result.error||'Nie udało się utworzyć płatności.');
      }

      const pending={orderId:result.orderId,cart,ship,customer:c,createdAt:Date.now()};
      localStorage.setItem(PENDING_KEY,JSON.stringify(pending));
      window.location.href=result.url;
    }catch(error){
      console.error('Błąd płatności Stripe:',error);
      if(status) status.textContent=`Nie udało się rozpocząć płatności: ${error.message}`;
      if(button){
        button.disabled=false;
        button.textContent='Przejdź do płatności';
      }
    }
  }

  function showPaidMessage(orderId){
    const overlay=document.querySelector('.cart-overlay');
    const summaryContent=document.querySelector('[data-summary-content]');
    const success=document.querySelector('[data-order-success]');

    if(overlay && success){
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden','false');
      document.querySelectorAll('[data-checkout-panel]').forEach(panel=>{
        panel.classList.toggle('active',panel.dataset.checkoutPanel==='summary');
      });
      if(summaryContent) summaryContent.hidden=true;
      success.hidden=false;
      const h3=success.querySelector('h3');
      const paragraphs=success.querySelectorAll('p');
      if(h3) h3.textContent='Płatność zakończona pomyślnie.';
      if(paragraphs[0]) paragraphs[0].textContent='Płatność została potwierdzona przez Stripe. Dziękujemy za zamówienie.';
      if(paragraphs[1]) paragraphs[1].textContent=orderId ? `Numer zamówienia: ${orderId}` : 'Zamówienie zostało opłacone.';
    }else{
      alert(orderId ? `Płatność zakończona pomyślnie. Numer zamówienia: ${orderId}` : 'Płatność zakończona pomyślnie.');
    }
  }

  async function handlePaymentReturn(){
    const params=new URLSearchParams(window.location.search);
    const payment=params.get('payment');

    if(payment==='cancelled' || payment==='test-cancelled'){
      history.replaceState({},'',window.location.pathname+window.location.hash);
      alert('Płatność została anulowana. Koszyk został zachowany.');
      return;
    }

    if(payment!=='success' && payment!=='test-success') return;

    const sessionId=params.get('session_id');
    if(!sessionId){
      history.replaceState({},'',window.location.pathname+window.location.hash);
      alert('Nie udało się potwierdzić płatności — brak identyfikatora Stripe.');
      return;
    }

    try{
      const response=await fetch(`${BACKEND}/session-status?session_id=${encodeURIComponent(sessionId)}`,{
        headers:{'Accept':'application/json'}
      });
      const result=await response.json().catch(()=>({}));

      if(!response.ok || !result.ok || result.payment_status!=='paid'){
        throw new Error(result.error||'Stripe nie potwierdził opłacenia zamówienia.');
      }

      const pending=getPending();
      localStorage.setItem(CART_KEY,'[]');

      if(pending) localStorage.removeItem(PENDING_KEY);

      history.replaceState({},'',window.location.pathname+window.location.hash);
      showPaidMessage(result.order_id || pending?.orderId || '');
    }catch(error){
      console.error('Błąd potwierdzenia płatności:',error);
      history.replaceState({},'',window.location.pathname+window.location.hash);
      alert(`Nie udało się potwierdzić płatności: ${error.message}`);
    }
  }

  function install(){
    updatePaymentUi();

    const goDetails=document.querySelector('[data-go-details]');
    if(goDetails) goDetails.addEventListener('click',()=>setTimeout(updatePaymentUi,0));

    const shippingSelect=document.querySelector('[data-cart-shipping]');
    if(shippingSelect) shippingSelect.addEventListener('change',()=>setTimeout(updatePaymentUi,0));

    const button=document.querySelector('[data-send-order]');
    if(button){
      button.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        beginCheckout();
      },true);
    }

    handlePaymentReturn();
  }

  install();
})();
