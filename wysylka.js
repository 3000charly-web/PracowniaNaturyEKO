// CENY WYSYŁKI — EDYTUJ TUTAJ
// maly:true  = tania wysyłka małej paczki (dostępna tylko, gdy w koszyku są wyłącznie produkty z SHIPPING_RULES.smallKeys)
// gratisPromo:true = ta opcja może być darmowa w promocji z SHIPPING_RULES.freePromo
window.SHIPPING = [
  { nazwa: "Paczkomat InPost — mała paczka (herbatki, zioła suszone) — przedpłata", cena: "15 zł", maly: true, gratisPromo: true },
  { nazwa: "Paczkomat InPost — przedpłata", cena: "19 zł", gratisPromo: true },
  { nazwa: "Kurier InPost — przedpłata", cena: "29 zł" },
  { nazwa: "Inny kurier", cena: "39 zł" },
  { nazwa: "Odbiór osobisty — po wcześniejszym uzgodnieniu", cena: "bezpłatnie" }
];

window.SHIPPING_RULES = {
  // Produkty mieszczące się w małej paczce (gabaryt A)
  smallKeys: [
    "herbata-przeziebienie-kaszel", "herbatka-zdrowa-watroba", "herbata-aksamitka",
    "herbata-melisa", "herbata-mieta-pieprzowa", "suszony-rumianek",
    "ziele-mniszka", "ziele-piolunu", "zestaw-herbatek"
  ],
  // Promocja: wysyłka paczkomatem gratis przy min. 3 butelkach zakwasu Bołotowa.
  // ABY WYŁĄCZYĆ PROMOCJĘ: zmień enabled na false.
  freePromo: { enabled: true, key: "enzymy-bolotowa", minQty: 3 }
};
