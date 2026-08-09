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


// Formularz kontaktowy otwierany przyciskiem „Napisz wiadomość”.
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
