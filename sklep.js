(function(){
  const STORAGE_KEY='pracownia_natury_cart_v1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const parsePrice=value=>{
    const match=String(value||'').replace(',','.').match(/(\d+(?:\.\d+)?)\s*zł/i);
    return match ? Number(match[1]) : null;
  };
  const money=value=>`${Number(value).toFixed(2).replace('.',',')} zł`;
  const getCart=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return []}};
  const saveCart=cart=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(cart));renderCart();};
  const products=window.PRODUCTS||{};
  const shipping=Array.isArray(window.SHIPPING)?window.SHIPPING:[];
  const isAvailable=item=>/dostępny/i.test(item?.dostepnosc||'') && !/niedostęp|potwierd|zamówienie|sezon/i.test(item?.dostepnosc||'');

  function addProduct(key,qty=1){
    const item=products[key];
    if(!item) return;
    if(!isAvailable(item)){alert('Ten produkt jest obecnie niedostępny do zakupu online.');return;}
    const price=parsePrice(item.cena);
    if(price===null){alert('Cena tego produktu nie została jeszcze uzupełniona.');return;}
    qty=Math.max(1,Math.min(99,Number(qty)||1));
    const cart=getCart();
    const existing=cart.find(x=>x.key===key);
    if(existing) existing.qty=Math.min(99,existing.qty+qty);
    else cart.push({key,name:item.nazwa||key,price,qty});
    saveCart(cart);
    openCart();
  }

  // Systemowy znak wodny wdrażamy stopniowo: tylko dla kart oznaczonych data-watermark="system".
  document.querySelectorAll('.card > img').forEach(img=>{
    if(img.parentElement.classList.contains('product-image-wrap')) return;
    const wrap=document.createElement('div');
    wrap.className='product-image-wrap';
    img.parentNode.insertBefore(wrap,img);
    wrap.append(img);
    if(img.closest('[data-watermark]')?.dataset.watermark === 'system'){
      const mark=document.createElement('div');
      mark.className='product-watermark';
      mark.setAttribute('aria-hidden','true');
      mark.innerHTML='<strong><span>Pracownia</span><span>Natury</span></strong>';
      wrap.append(mark);
    }
  });

  // Akcje zakupowe na kartach produktów.
  document.querySelectorAll('[data-product]').forEach(card=>{
    const key=card.dataset.product;
    const item=products[key];
    const body=card.querySelector('.body');
    if(!item||!body) return;
    card.querySelectorAll('.actions').forEach(x=>x.remove());
    const actions=document.createElement('div');
    actions.className='actions shop-actions';
    const price=parsePrice(item.cena);
    const available=isAvailable(item);
    const status=document.createElement('div');
    status.className=`shop-availability ${available?'is-available':'is-unavailable'}`;
    status.innerHTML=`<span class="availability-dot"></span>${available?'Dostępny':'Niedostępny'}`;
    const buyRow=document.createElement('div');
    buyRow.className='buy-row';
    buyRow.append(status);
    const qty=document.createElement('div');
    qty.className='product-qty';
    qty.innerHTML='<button type="button" data-qty-minus aria-label="Zmniejsz ilość">−</button><input type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Ilość sztuk"><button type="button" data-qty-plus aria-label="Zwiększ ilość">+</button>';
    const input=qty.querySelector('input');
    qty.querySelector('[data-qty-minus]').addEventListener('click',()=>input.value=Math.max(1,(Number(input.value)||1)-1));
    qty.querySelector('[data-qty-plus]').addEventListener('click',()=>input.value=Math.min(99,(Number(input.value)||1)+1));
    input.addEventListener('change',()=>input.value=Math.max(1,Math.min(99,Number(input.value)||1)));
    const button=document.createElement('button');
    button.type='button';
    button.className='btn primary add-cart-btn';
    button.setAttribute('data-add-cart',key);
    if(price===null){
      button.textContent='Cena do uzupełnienia'; button.disabled=true; button.classList.add('disabled'); qty.classList.add('disabled');
    }else if(!available){
      button.textContent='Niedostępny'; button.disabled=true; button.classList.add('disabled'); qty.classList.add('disabled');
    }else{
      button.textContent='🛒 Dodaj do koszyka';
      button.addEventListener('click',()=>addProduct(key,input.value));
    }
    buyRow.append(qty,button); actions.append(buyRow); body.append(actions);
  });

  // Przycisk koszyka w menu.
  document.querySelectorAll('.menu').forEach(menu=>{
    if(menu.querySelector('.cart-menu-button')) return;
    const btn=document.createElement('button');
    btn.type='button'; btn.className='cart-menu-button';
    btn.innerHTML='🛒 Koszyk <span class="cart-count" data-cart-count>0</span>';
    btn.addEventListener('click',openCart); menu.append(btn);
  });

  // Panel koszyka + formularz zamówienia.
  const overlay=document.createElement('div');
  overlay.className='cart-overlay'; overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Koszyk i zamówienie">
      <div class="cart-head"><div><span class="eyebrow">Sklep</span><h2>Koszyk</h2></div><button type="button" class="cart-close" aria-label="Zamknij">×</button></div>
      <div class="checkout-steps"><span class="active" data-step-dot="cart">1. Koszyk</span><span data-step-dot="details">2. Dane</span><span data-step-dot="summary">3. Podsumowanie</span></div>
      <section class="checkout-panel active" data-checkout-panel="cart">
        <div class="cart-items" data-cart-items></div>
        <button type="button" class="cart-clear-button" data-clear-cart>Wyczyść koszyk</button>
        <div class="cart-summary">
          <label for="cart-shipping">Sposób dostawy</label>
          <select id="cart-shipping" data-cart-shipping></select>
          <div class="cart-total-row"><span>Produkty</span><strong data-cart-subtotal>0,00 zł</strong></div>
          <div class="cart-total-row"><span>Dostawa</span><strong data-cart-shipping-price>0,00 zł</strong></div>
          <div class="cart-total-row cart-grand"><span>Razem</span><strong data-cart-total>0,00 zł</strong></div>
          <button type="button" class="btn primary cart-order" data-go-details>Przejdź do danych zamówienia</button>
        </div>
      </section>
      <section class="checkout-panel" data-checkout-panel="details">
        <form class="checkout-form" data-checkout-form novalidate>
          <h3>Dane zamawiającego</h3>
          <div class="checkout-grid">
            <label>Imię i nazwisko<input name="name" autocomplete="name" required></label>
            <label>Telefon<input name="phone" type="tel" autocomplete="tel" required></label>
            <label class="full">E-mail<input name="email" type="email" autocomplete="email" required></label>
          </div>
          <h3>Adres zamawiającego</h3>
          <div class="checkout-grid">
            <label class="full">Ulica i numer<input name="street" autocomplete="street-address" required></label>
            <label>Kod pocztowy<input name="postal" autocomplete="postal-code" required inputmode="numeric" placeholder="00-000" pattern="[0-9]{2}-[0-9]{3}"></label>
            <label>Miejscowość<input name="city" autocomplete="address-level2" required></label>
          </div>
          <div class="delivery-fields" data-delivery-fields></div>
          <fieldset class="payment-choice"><legend>Sposób płatności</legend><label><input type="radio" name="payment" value="Przelew na konto" required> Przelew na konto</label><label><input type="radio" name="payment" value="Pobranie" required> Pobranie</label><label><input type="radio" name="payment" value="BLIK na telefon" required> BLIK na telefon</label></fieldset>
          <label class="full">Uwagi do zamówienia<textarea name="notes" rows="3" placeholder="Opcjonalnie"></textarea></label>
          <div class="payment-info" data-payment-info></div>
          <p class="checkout-note">Uzupełnij dane i przejdź do podsumowania. Zamówienie wyślesz bezpośrednio ze strony — bez otwierania programu pocztowego.</p>
          <div class="checkout-nav"><button type="button" class="btn ghost" data-back-cart>← Koszyk</button><button type="submit" class="btn primary">Podsumowanie →</button></div>
        </form>
      </section>
      <section class="checkout-panel" data-checkout-panel="summary">
        <div data-summary-content>
          <div class="order-preview" data-order-preview></div>
          <div class="checkout-nav"><button type="button" class="btn ghost" data-back-details>← Popraw dane</button><button type="button" class="btn primary" data-send-order>Wyślij zamówienie</button></div>
          <p class="checkout-note">Po wysłaniu zamówienia Pracownia skontaktuje się z Tobą mailowo w sprawie potwierdzenia zamówienia i płatności.</p>
          <p class="checkout-note order-send-status" data-order-send-status aria-live="polite"></p>
        </div>
        <div class="order-success" data-order-success hidden>
          <h3>Dziękujemy za zamówienie.</h3>
          <p>Zamówienie zostało przekazane do Pracowni Natury EKO.</p>
          <p>Skontaktujemy się z Tobą mailowo w sprawie potwierdzenia zamówienia i płatności.</p>
          <button type="button" class="btn primary" data-close-after-order>Zamknij</button>
        </div>
      </section>
    </aside>`;
  document.body.append(overlay);
  overlay.querySelector('.cart-close').addEventListener('click',closeCart);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeCart()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});

  const shippingSelect=overlay.querySelector('[data-cart-shipping]');
  shipping.forEach((item,i)=>{
    const option=document.createElement('option'); option.value=i; option.textContent=`${item.nazwa} — ${item.cena}`; shippingSelect.append(option);
  });
  shippingSelect.addEventListener('change',()=>{renderCart(); renderDeliveryFields();});

  function openCart(){overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');const sc=overlay.querySelector('[data-summary-content]'),os=overlay.querySelector('[data-order-success]'),st=overlay.querySelector('[data-order-send-status]'),sb=overlay.querySelector('[data-send-order]');if(sc)sc.hidden=false;if(os)os.hidden=true;if(st)st.textContent='';if(sb){sb.disabled=false;sb.textContent='Wyślij zamówienie';}showStep('cart');renderCart();}
  function closeCart(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');}
  function shippingItem(){return shipping[Number(shippingSelect.value)||0]||null;}
  function shippingCost(){const item=shippingItem(); if(!item||/bezpłat/i.test(item.cena))return 0; return parsePrice(item.cena)||0;}
  function paymentLabel(){return formDataObject().payment||'Nie wybrano';}
  function showStep(step){
    overlay.querySelectorAll('[data-checkout-panel]').forEach(p=>p.classList.toggle('active',p.dataset.checkoutPanel===step));
    overlay.querySelectorAll('[data-step-dot]').forEach(d=>d.classList.toggle('active',d.dataset.stepDot===step));
  }

  function renderCart(){
    const cart=getCart();
    const count=cart.reduce((n,x)=>n+x.qty,0);
    document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count);
    const list=overlay.querySelector('[data-cart-items]');
    if(!cart.length){list.innerHTML='<div class="cart-empty"><strong>Koszyk jest pusty.</strong><p>Dodaj wybrany produkt z jednej z kategorii.</p></div>'}
    else{
      list.innerHTML=cart.map((x,i)=>`<div class="cart-item"><div><strong>${esc(x.name)}</strong><small>${money(x.price)} / szt.</small></div><div class="cart-qty"><button type="button" data-minus="${i}" aria-label="Zmniejsz ilość">−</button><span>${x.qty}</span><button type="button" data-plus="${i}" aria-label="Zwiększ ilość">+</button><button type="button" class="cart-remove" data-remove="${i}" aria-label="Usuń">×</button></div></div>`).join('');
      list.querySelectorAll('[data-minus]').forEach(btn=>btn.addEventListener('click',()=>changeQty(Number(btn.dataset.minus),-1)));
      list.querySelectorAll('[data-plus]').forEach(btn=>btn.addEventListener('click',()=>changeQty(Number(btn.dataset.plus),1)));
      list.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>removeItem(Number(btn.dataset.remove))));
    }
    const subtotal=cart.reduce((sum,x)=>sum+x.price*x.qty,0), ship=shippingCost();
    overlay.querySelector('[data-cart-subtotal]').textContent=money(subtotal);
    overlay.querySelector('[data-cart-shipping-price]').textContent=money(ship);
    overlay.querySelector('[data-cart-total]').textContent=money(subtotal+ship);
    overlay.querySelector('[data-go-details]').disabled=!cart.length;
    overlay.querySelector('[data-clear-cart]').disabled=!cart.length;
  }
  function changeQty(index,delta){const cart=getCart();if(!cart[index])return;cart[index].qty=Math.min(99,cart[index].qty+delta);if(cart[index].qty<=0)cart.splice(index,1);saveCart(cart);}
  function removeItem(index){const cart=getCart();cart.splice(index,1);saveCart(cart);}
  function clearCart(){
    if(!getCart().length) return;
    if(!window.confirm('Czy na pewno chcesz wyczyścić cały koszyk?')) return;
    saveCart([]);
    showStep('cart');
  }

  const form=overlay.querySelector('[data-checkout-form]');
  function renderDeliveryFields(){
    const name=shippingItem()?.nazwa||'';
    const box=overlay.querySelector('[data-delivery-fields]');
    let html='<h3>Dane dostawy</h3>';
    if(/Paczkomat/i.test(name)){
      html+='<label class="full">Kod Paczkomatu InPost<input name="paczkomat" required placeholder="np. KRA01N" maxlength="12" autocapitalize="characters" spellcheck="false"></label><p class="delivery-hint">Wpisz wyłącznie kod Paczkomatu, nie adres. <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noopener noreferrer">Znajdź Paczkomat na stronie InPost</a>.</p>';
    }else if(/Odbiór osobisty/i.test(name)){
      html+='<p class="delivery-hint">Odbiór osobisty po wcześniejszym uzgodnieniu terminu.</p>';
    }else{
      html+='<p class="delivery-hint">Przesyłka zostanie wysłana na adres zamawiającego podany powyżej.</p>';
    }
    box.innerHTML=html;
    overlay.querySelector('[data-payment-info]').innerHTML='<strong>Płatność</strong>Wybierz: przelew na konto, pobranie albo BLIK na telefon.';
  }

  overlay.querySelector('[data-go-details]').addEventListener('click',()=>{if(!getCart().length)return;renderDeliveryFields();showStep('details');});
  overlay.querySelector('[data-back-cart]').addEventListener('click',()=>showStep('cart'));
  overlay.querySelector('[data-clear-cart]').addEventListener('click',clearCart);
  overlay.querySelector('[data-back-details]').addEventListener('click',()=>showStep('details'));

  function formDataObject(){return Object.fromEntries(new FormData(form).entries());}
  function orderData(){
    const cart=getCart(), ship=shippingItem(), subtotal=cart.reduce((sum,x)=>sum+x.price*x.qty,0), delivery=shippingCost();
    return {cart,ship,subtotal,delivery,total:subtotal+delivery,customer:formDataObject(),payment:formDataObject().payment||'Nie wybrano'};
  }
  function validateForm(){
    if(!form.checkValidity()){form.reportValidity();return false;}
    const delivery=shippingItem()?.nazwa||''; const data=formDataObject(); const pay=data.payment||'';
    if(/Paczkomat/i.test(delivery)){
      const input=form.querySelector('input[name="paczkomat"]');
      const code=(data.paczkomat||'').trim().toUpperCase().replace(/\s+/g,'');
      if(!/^[A-Z]{2,8}[0-9]{1,4}[A-Z]{0,2}$/.test(code)){
        alert('Wpisz kod Paczkomatu InPost, np. KRA01N. Nie wpisuj adresu ani dowolnego tekstu.');
        input?.focus(); return false;
      }
      if(input) input.value=code;
    }
    if(/pobranie/i.test(delivery) && pay!=='Pobranie'){alert('Dla dostawy za pobraniem wybierz płatność „Pobranie”.');return false;}
    if(/przedpłata/i.test(delivery) && pay==='Pobranie'){alert('Dla tej dostawy wybierz „Przelew na konto” albo „BLIK na telefon”.');return false;}
    return true;
  }
  form.addEventListener('submit',e=>{
    e.preventDefault(); if(!validateForm())return;
    const d=orderData();
    const c=d.customer;
    const customerAddress=`${c.street}, ${c.postal||''} ${c.city||''}`;
    const deliveryAddress=c.paczkomat?`Paczkomat: ${c.paczkomat}`:(/Odbiór osobisty/i.test(d.ship?.nazwa||'')?'Odbiór osobisty':customerAddress);
    overlay.querySelector('[data-order-preview]').innerHTML=`
      <h3>Podsumowanie zamówienia</h3>
      <div class="order-preview-list">${d.cart.map(x=>`<div><span>${esc(x.name)} × ${x.qty}</span><strong>${money(x.price*x.qty)}</strong></div>`).join('')}</div>
      <div class="order-preview-totals"><div><span>Dostawa</span><strong>${money(d.delivery)}</strong></div><div class="grand"><span>Razem</span><strong>${money(d.total)}</strong></div></div>
      <div class="order-customer"><p><strong>${esc(c.name)}</strong><br>${esc(c.email)}<br>${esc(c.phone)}<br><strong>Adres zamawiającego:</strong> ${esc(customerAddress)}</p><p><strong>Adres dostawy:</strong> ${esc(deliveryAddress)}</p><p><strong>Dostawa:</strong> ${esc(d.ship?.nazwa||'do ustalenia')}<br><strong>Płatność:</strong> ${esc(d.payment)}</p>${c.notes?`<p><strong>Uwagi:</strong> ${esc(c.notes)}</p>`:''}</div>`;
    showStep('summary');
  });

  const sendOrderButton=overlay.querySelector('[data-send-order]');
  const sendOrderStatus=overlay.querySelector('[data-order-send-status]');
  const summaryContent=overlay.querySelector('[data-summary-content]');
  const orderSuccess=overlay.querySelector('[data-order-success]');

  overlay.querySelector('[data-close-after-order]').addEventListener('click',closeCart);

  sendOrderButton.addEventListener('click',async()=>{
    if(!getCart().length){showStep('cart');renderCart();return;}
    const d=orderData(), c=d.customer;
    const lines=d.cart.map(x=>`- ${x.name} x ${x.qty} = ${money(x.price*x.qty)}`);
    const customerAddress=`${c.street}, ${c.postal||''} ${c.city||''}`;
    const deliveryAddress=c.paczkomat?`Paczkomat: ${c.paczkomat}`:(/Odbiór osobisty/i.test(d.ship?.nazwa||'')?'Odbiór osobisty':customerAddress);
    const email=(window.CONTACT&&window.CONTACT.email)||'aga_bialk@int.pl';
    const endpoint=`https://formsubmit.co/ajax/${email}`;
    const payload={
      _subject:'Nowe zamówienie — Pracownia Natury EKO',
      _template:'table',
      _replyto:c.email,
      _url:window.location.href,
      name:c.name,
      email:c.email,
      phone:c.phone,
      products:lines.join('\n'),
      customer_address:customerAddress,
      delivery_method:d.ship?`${d.ship.nazwa} — ${d.ship.cena}`:'do ustalenia',
      delivery_address:deliveryAddress,
      payment:d.payment,
      products_total:money(d.subtotal),
      delivery_cost:money(d.delivery),
      order_total:money(d.total),
      notes:c.notes||'brak'
    };

    sendOrderButton.disabled=true;
    sendOrderButton.textContent='Wysyłanie…';
    sendOrderStatus.textContent='Wysyłamy zamówienie do Pracowni…';

    try{
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok || result.success===false) throw new Error(result.message||'Nie udało się wysłać zamówienia.');

      localStorage.setItem(STORAGE_KEY,'[]');
      renderCart();
      form.reset();
      sendOrderStatus.textContent='';
      summaryContent.hidden=true;
      orderSuccess.hidden=false;
    }catch(error){
      console.error('Błąd wysyłania zamówienia:',error);
      sendOrderStatus.textContent='Nie udało się wysłać zamówienia. Sprawdź połączenie z internetem i spróbuj ponownie.';
      sendOrderButton.disabled=false;
      sendOrderButton.textContent='Wyślij zamówienie';
    }
  });

  renderCart();
})();
