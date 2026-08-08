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


  // Wysyłka i odbiór — ceny z pliku wysylka.js
  const shippingList=document.querySelector('[data-shipping-list]');
  if(shippingList){
    const shipping=Array.isArray(window.SHIPPING) ? window.SHIPPING : [];
    shippingList.innerHTML=shipping.map(item=>`
      <div class="shipping-row"><span>${esc(item.nazwa)}</span><strong>${esc(item.cena)}</strong></div>`
    ).join('');
  }

  // Dane kontaktowe z pliku kontakt.js
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

// Rozwijany dział „Prawdziwa osoba. Prawdziwa praca.”
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
