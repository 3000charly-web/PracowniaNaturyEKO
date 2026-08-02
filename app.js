(function(){
  const b=document.querySelector('.menu-toggle');
  const m=document.querySelector('.menu');
  if(b && m) b.onclick=()=>m.classList.toggle('open');

  document.querySelectorAll('.placeholder-olx').forEach(x=>x.addEventListener('click',e=>{
    const href=x.getAttribute('href');
    if(!href || href==='#'){
      e.preventDefault();
      alert('Tutaj podłączymy właściwy link do OLX.');
    }
  }));

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
          ${item.dostepnosc ? `<p class="availability">${esc(item.dostepnosc)}</p>` : ''}
        </div>`;
      const descriptionDetails=card.querySelector('.product-details');
      descriptionDetails.insertAdjacentElement('afterend', priceDetails);
    }
  });

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
  configureLink('[data-contact-olx]', contact.olx);
})();
