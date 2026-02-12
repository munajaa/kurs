
import { UsefulItem } from '../types';

export const USEFUL_DATA: UsefulItem[] = [
  {
    id: 'u1',
    title: 'Najbolje Aplikacije za Tracking',
    description: 'Popis besplatnih alata za praćenje pošiljaka iz Kine i EU u realnom vremenu (17Track, AfterShip).',
    category: 'ALATI',
    images: [
      'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1526738549149-8e07eca2c1b4?auto=format&fit=crop&q=80&w=800'
    ],
    content: `Kada radite s dobavljačima iz Kine, najbitnija stvar je miran san, a njega dobivate kroz dobar tracking.

1. 17Track – Apsolutni standard. Prepoznaje gotovo svaki kineski carrier automatski. Skinite aplikaciju i uključite notifikacije.
2. AfterShip – Odličan za preglednije praćenje ako imate 10+ paketa istovremeno.
3. ParcelsApp – Često prepoznaje nove tracking brojeve koje carrieri generiraju pri ulasku u EU (npr. kad paket preuzme DHL ili lokalna pošta).

Savjet: Uvijek provjeravajte status "Customs clearance" – ako stoji predugo, reagirajte odmah.`
  },
  {
    id: 'u2',
    title: 'Kako slikati proizvod za Vinted?',
    description: 'Vodič za osvjetljenje i kuteve slikanja koji povećavaju šansu za prodaju za 40%.',
    category: 'SAVJETI',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800'
    ],
    content: `Na Vintedu ljudi kupuju očima. Loša slika = niska cijena ili nikakva prodaja.

KLJUČNE TOČKE:
• Prirodno svjetlo: Slikajte blizu prozora tijekom dana. Nikad ne koristite blic na mobitelu jer stvara neprirodne odsjaje na materijalima.
• Pozadina: Držite je neutralnom. Bijeli zid ili drveni pod su najbolji. Maknite sav nered iz kadra.
• Detalji: Prva slika mora biti cijeli proizvod. Ostale slike moraju prikazivati etikete, šavove i potplat (ako su tenisice). To dokazuje kvalitetu.
• Tagovi: Slikajte QR kodove i serijske brojeve ako ih ima.`
  },
  {
    id: 'u3',
    title: 'Checklista za Provjeru Kvalitete',
    description: 'Na što točno paziti kada vam stigne prvi batch od novog dobavljača. Šavovi, miris, etikete.',
    category: 'KVALITETA',
    images: [
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=800'
    ],
    content: `Čim otvorite paket, obratite pozornost na ove detalje prije nego što potvrdite prodaju kupcu:

1. Miris: Visokokvalitetni materijali nemaju jak kemijski miris "po plastici". Ako smrdi, ostavite na zraku 24h.
2. Šavovi: Provjerite simetriju. Kod premium batcheva, šavovi su ravni i bez izvučenih konaca.
3. Težina: 1:1 replike često imaju identičnu težinu kao original jer koriste istu gustoću materijala.
4. Box/Packaging: Kutija ne smije biti pretjerano zgužvana i fontovi moraju biti oštri, ne zamućeni.`
  },
  {
    id: 'u4',
    title: 'Psihologija Cjenkanja',
    description: 'Tri rečenice koje uvijek pale kada kupac pokušava nerealno spustiti cijenu.',
    category: 'PRODAJA',
    content: `Cjenkanje je dio kulture resellinga. Nemojte to shvaćati osobno.

MOĆNE REČENICE:
1. "Razumijem, ali s obzirom na kvalitetu ovog batcha i činjenicu da je rasprodan svuda, cijena je već maksimalno korigirana."
2. "Mogu ti spustiti 5 EUR ako uzmeš odmah danas, tako da obojica uštedimo vrijeme."
3. "Vjeruj mi, bolje je platiti 10 EUR više za ovaj batch nego uzeti jeftiniji koji će se raspasti nakon dva nošenja."

Uvijek nudite vrijednost, a ne samo popust.`
  },
  {
    id: 'u5',
    title: 'Vodič kroz Carinu',
    description: 'Kako izbjeći dodatne troškove i koja slanja (Tariffless) su najsigurnija za Balkan.',
    category: 'LOGISTIKA',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'
    ],
    content: `Za regiju Balkana (Hrvatska, Srbija, BiH), carina može biti prepreka ako ne znate što radite.

NAJBOLJE OPCIJE:
• DHL Tariffless / Triangle Shipping: Paket prvo ide u npr. Luksemburg ili Njemačku, tamo se "očisti" i onda ulazi u vašu državu kao EU pošiljka. Ovo je 99% sigurno od carine.
• IOSS Sustav: Za manje pakete (ispod 150 EUR) osigurajte da je PDV plaćen unaprijed (VAT paid).
• Deklaracija: Nikad ne deklarirajte punu cijenu ako ne koristite Tariffless. Za 2kg paket obično se deklarira 18-21 USD.`
  }
];
