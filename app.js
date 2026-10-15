(function(){
  const b=document.querySelector('.menu-toggle');
  const m=document.querySelector('.menu');
  if(b && m) b.onclick=()=>m.classList.toggle('open');

  function esc(value){
    return String(value ?? '').replace(/[&<>\"']/g, c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'
    })[c]);
  }

  document.querySelectorAll('[data-product]').forEach(card=>{
    const key=card.dataset.product;
    const item=window.PRODUCTS && window.PRODUCTS[key];
    const target=card.querySelector('[data-product-description]');
    if(!item || !target) return;

    const sections = [
      ['Opis', item.opis],
      ['Skład', item.sklad],
      ['Sposób użycia', item.sposob],
      ['Zastosowanie', item.zastosowanie],
      ['Dodatkowe informacje', item.dodatkowe]
    ].filter(([,value])=>value && String(value).trim());

    target.innerHTML = sections.map(([label,value], index)=>
      `${index===0 ? '' : `<h4>${esc(label)}</h4>`}<p>${esc(value)}</p>`
    ).join('');

    if(!card.querySelector('[data-product-price]')){
      const priceDetails=document.createElement('details');
      priceDetails.className='product-details price-details';
      priceDetails.setAttribute('data-product-price','');
      priceDetails.innerHTML=`
        <summary>💰 Cena</summary>
        <div class="product-description price-description">
          <p class="price-value">${esc(item.cena || 'Uzupełnij cenę')}</p>
          ${item.dostepnosc ? `<p class="availability ${/dostępny/i.test(item.dostepnosc) && !/niedostęp|potwierd|zamówienie|sezon/i.test(item.dostepnosc) ? 'is-available' : 'is-unavailable'}"><span class="availability-dot"></span>${esc(item.dostepnosc)}</p>` : ''}
        </div>`;
      const descriptionDetails=card.querySelector('.product-details');
      descriptionDetails.insertAdjacentElement('afterend', priceDetails);
    }
  });

  const shippingList=document.querySelector('[data-shipping-list]');
  if(shippingList){
    const shipping=Array.isArray(window.SHIPPING) ? window.SHIPPING : [];
    shippingList.innerHTML=shipping.map(item=>`
      <div class="shipping-row"><span>${esc(item.nazwa)}</span><strong>${esc(item.cena)}</strong></div>`
    ).join('');
  }

  const contact=window.CONTACT || {};
  const setText=(selector,value)=>{
    const el=document.querySelector(selector);
    if(el && value) el.textContent=value;
  };
  setText('[data-contact-name]', contact.nazwa);
  setText('[data-contact-person]', contact.osoba);
  setText('[data-contact-location]', contact.miejscowosc);
  setText('[data-contact-hours]', contact.godziny);

  const phone=document.querySelector('[data-contact-phone]');
  if(phone && contact.telefon){
    phone.textContent=contact.telefon;
    phone.href='tel:'+String(contact.telefon).replace(/[^+\d]/g,'');
  }

  const email=document.querySelector('[data-contact-email]');
  const emailButton=document.querySelector('[data-contact-email-button]');
  if(contact.email){
    if(email){ email.textContent=contact.email; email.href='mailto:'+contact.email; }
    if(emailButton) emailButton.href='mailto:'+contact.email;
  }

  const configureLink=(selector,url)=>{
    const el=document.querySelector(selector);
    if(!el) return;
    if(url){
      el.href=url;
      el.hidden=false;
      el.target='_blank';
      el.rel='noopener noreferrer';
    } else {
      el.hidden=true;
    }
  };
  configureLink('[data-contact-facebook]', contact.facebook);
})();

(()=>{
  const grid=document.querySelector('[data-workshop-grid]');
  if(!grid) return;
  const entries=Array.isArray(window.PRACOWNIA) ? window.PRACOWNIA : [];
  const esc=value=>String(value ?? '').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);
  grid.innerHTML=entries.map(item=>`
    <article class="workshop-entry">
      <img src="${esc(item.zdjecie)}" alt="${esc(item.tytul || 'Zdjęcie z Pracowni')}" loading="lazy">
      <div>
        <h3>${esc(item.tytul || '')}</h3>
        <p>${esc(item.opis || '')}</p>
      </div>
    </article>`).join('');
})();

(()=>{
  const trigger=document.querySelector('[data-contact-form-button]');
  if(!trigger) return;
  const modal=document.createElement('div');
  modal.className='contact-modal'; modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`<div class="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-form-title"><button class="contact-modal-close" type="button" aria-label="Zamknij">×</button><div class="eyebrow">Kontakt</div><h2 id="contact-form-title">Napisz wiadomość</h2><form data-contact-form><label>Imię<input name="name" required autocomplete="name"></label><label>E-mail<input name="email" type="email" required autocomplete="email"></label><label>Temat<input name="subject" required></label><label>Wiadomość<textarea name="message" rows="6" required></textarea></label><button class="btn primary" type="submit">Wyślij</button></form></div>`;
  document.body.append(modal);
  const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')};
  trigger.addEventListener('click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');modal.querySelector('input').focus()});
  modal.querySelector('.contact-modal-close').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  modal.querySelector('form').addEventListener('submit',e=>{e.preventDefault(); const form=e.currentTarget;if(!form.checkValidity()){form.reportValidity();return;} const d=Object.fromEntries(new FormData(form));const to=(window.CONTACT&&window.CONTACT.email)||'';const body=`Imię: ${d.name}\nE-mail: ${d.email}\n\n${d.message}`;window.location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;});
})();

// Ładowanie modułu płatności Stripe po utworzeniu koszyka przez sklep.js.
window.addEventListener('load',()=>{
  const script=document.createElement('script');
  script.src='stripe-payments.js';
  document.body.append(script);
});

// === Promocja: gratis organizer na jajka przy zakupach za min. 200 zł (v3.39) ===
// Samo wyświetlanie informacji – bez wpływu na koszyk, Stripe i Worker (prezent dodawany ręcznie).
// ABY WYŁĄCZYĆ PROMOCJĘ: zmień PROMO_GIFT_ENABLED na false.
(()=>{
  const PROMO_GIFT_ENABLED=false;
  if(!PROMO_GIFT_ENABLED) return;

  const PHOTO='img/kolekcja/organizer-jajka-1.png';
  const PRODUCT_KEY='akcesorium-organizer-bialy'; // Organizer na jajka nr 1
  const STORAGE_KEY='promo_gift_200_closed';

  const style=document.createElement('style');
  style.textContent=`
    .promo-gift{position:fixed;right:24px;bottom:24px;z-index:90;width:270px;background:#faf6ec;border:3px solid #244d2c;border-radius:18px;overflow:hidden;font:700 1.15rem/1.3 Arial,sans-serif;color:#244d2c;box-shadow:0 10px 28px rgba(0,0,0,.28)}
    .promo-gift img{display:block;width:100%;height:170px;object-fit:cover}
    .promo-gift .promo-gift-cap{padding:.8rem 1rem 1rem;text-align:center}
    .promo-gift .promo-gift-close{position:absolute;top:8px;right:8px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(250,246,236,.92);font-size:1.5rem;line-height:1;color:#244d2c;cursor:pointer}
    body.collection-modal-open .promo-gift{display:none}
    .promo-gift-tag{position:absolute;z-index:5;box-sizing:border-box;background:#faf6ec;border:2px solid #244d2c;border-radius:10px;padding:.35rem;text-align:center;font:700 .8rem/1.2 Arial,sans-serif;color:#244d2c;pointer-events:none}
    .promo-gift-tag .long{display:none}
    @media(max-width:700px){
      .promo-gift{left:10px;right:10px;bottom:10px;width:auto;display:flex;align-items:center;gap:.8rem;border-width:2px;border-radius:16px;padding:.5rem .8rem .5rem .5rem;font-size:1rem}
      .promo-gift img{width:92px;height:76px;flex:none;border-radius:10px}
      .promo-gift .promo-gift-cap{padding:0;text-align:left}
      .promo-gift .promo-gift-close{position:static;margin-left:auto;flex:none;width:auto;height:auto;background:none;font-size:1.8rem}
      .promo-gift-tag{border-radius:12px;padding:.5rem;font-size:.85rem}
      .promo-gift-tag .short{display:none}
      .promo-gift-tag .long{display:inline}
    }`;
  document.head.append(style);

  const init=()=>{
    // Stała plakietka na każdej podstronie (do zamknięcia na czas wizyty).
    let closed=false;
    try{ closed=sessionStorage.getItem(STORAGE_KEY)==='1'; }catch(e){}
    if(!closed){
      const box=document.createElement('aside');
      box.className='promo-gift';
      box.setAttribute('aria-label','Promocja: gratis organizer na jajka');
      box.innerHTML=`<img src="${PHOTO}" alt="Organizer na jajka – gratis" loading="lazy"><div class="promo-gift-cap">🎁 Przy zakupach za min. 200 zł – <u>gratis organizer</u></div><button type="button" class="promo-gift-close" aria-label="Zamknij">×</button>`;
      box.querySelector('.promo-gift-close').addEventListener('click',()=>{
        box.remove();
        try{ sessionStorage.setItem(STORAGE_KEY,'1'); }catch(e){}
      });
      document.body.append(box);
    }

    // Etykieta na zdjęciu organizera nr 1 w karuzeli (strona główna).
    const track=document.querySelector('[data-carousel-track]');
    if(!track) return;
    const place=card=>{
      const img=card.querySelector(':scope > img');
      const tag=card.querySelector(':scope > .promo-gift-tag');
      if(!img||!tag) return;
      tag.style.left=(img.offsetLeft+8)+'px';
      tag.style.width=(img.offsetWidth-16)+'px';
      tag.style.top=(img.offsetTop+img.offsetHeight-tag.offsetHeight-8)+'px';
    };
    const apply=()=>{
      track.querySelectorAll(`.collection-card[data-product="${PRODUCT_KEY}"]`).forEach(card=>{
        if(getComputedStyle(card).position==='static') card.style.position='relative';
        if(!card.querySelector(':scope > .promo-gift-tag')){
          const tag=document.createElement('div');
          tag.className='promo-gift-tag';
          tag.innerHTML='🎁 <span class="short">GRATIS od 200 zł</span><span class="long">GRATIS przy zakupach<br>od 200 zł</span>';
          card.append(tag);
          const img=card.querySelector(':scope > img');
          if(img && !img.complete) img.addEventListener('load',()=>place(card),{once:true});
        }
        place(card);
      });
    };
    apply();
    new MutationObserver(apply).observe(track,{childList:true});
    window.addEventListener('resize',apply);
    window.addEventListener('load',apply);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
