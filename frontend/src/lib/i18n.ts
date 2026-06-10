import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple translation resources
const resources = {
  en: {
    translation: {
      "nav.home": "Home",
      "nav.products": "Our Pickles",
      "nav.about": "Heritage",
      "hero.title": "Authentic Andhra Flavors",
      "hero.subtitle": "Experience the rich, traditional recipes of Visakhapatnam, crafted with love and aged to perfection.",
      "hero.cta": "Shop Now",
      
      // Heritage Page
      "heritage.since": "Since 1960's",
      "heritage.title": "Our Legacy of Spices",
      "heritage.subtitle": "Rooted in the sun-drenched coastal plains of Andhra Pradesh, our story began in a small family kitchen in MVP Colony. Today, we carry forward the whispers of our ancestors through every jar of authentic pickle and spice blend.",
      "heritage.sec1_title": "The Grandmother's Hands",
      "heritage.sec1_p1": "It was in the days back in the 1960's that Smt. Neralla first began preparing her signature 'Avakaya' for neighbors. What started as a labor of love for family quickly grew into a community staple, as the secret of her unique blend of Guntur chilies and cold-pressed sesame oil traveled through the streets of Visakhapatnam.",
      "heritage.sec1_p2": "Every ingredient is still sourced from the same small-scale farmers our family has trusted for three generations. We believe that authenticity isn't just about the recipe—it's about the relationship between the earth, the hand, and the jar.",
      "heritage.bento_title": "From Earth to Soul",
      "heritage.bento_desc": "A visual journey of our meticulous hand-packing process and sun-dried ingredients.",
      "heritage.visit_title": "Visit Our Heritage Kitchen",
      "heritage.visit_desc": "Come witness the magic of hand-pounded spices and traditional pickling in the heart of Vizag.",
      "heritage.journal_cta": "Read Our Family Journal",

      // Product Details Page
      "product.spice_level": "Spice Level",
      "product.shelf_life": "Shelf Life",
      "product.select_weight": "Select Weight",
      "product.select_pkg": "Packaging Type",
      "product.ingredients": "Ingredients",
      "product.storage": "Storage Instructions",
      "product.add_to_cart": "Add to Cart",
      "product.order_whatsapp": "Order via WhatsApp",
      "product.homemade": "100% Homemade",
      "product.veg": "Vegetarian",
      "product.traditional": "Traditional Recipe",
      "product.no_preservatives": "No Preservatives",
      "product.ceramic_jar": "Ceramic Jar",
      "product.eco_refill": "Eco-Refill",
      "product.pure_handcrafted": "Purely Handcrafted",
      "product.incl_pkg": "incl. pkg",

      // Order Success Page
      "success.title": "Order Request Sent",
      "success.subtitle": "Thank you for choosing నేరెళ్ల ఇంటి రుచులు",
      "success.desc": "Our team will contact you shortly to confirm your order details and delivery preferences. We appreciate your patience while we prepare your authentic Andhra experience.",
      "success.whatsapp": "Contact on WhatsApp",
      "success.continue": "Continue Shopping",

      // Offline Page
      "offline.title": "Oops! You're Offline",
      "offline.desc": "It seems your connection has dipped, but the aroma of our pickles is still here. We'll be back as soon as you're online.",
      "offline.retry": "Retry Connection",
      "offline.call": "Call Us",
    }
  },
  te: {
    translation: {
      "nav.home": "హోమ్",
      "nav.products": "మా పచ్చళ్లు",
      "nav.about": "చరిత్ర",
      "hero.title": "అసలైన ఆంధ్ర రుచులు",
      "hero.subtitle": "విశాఖపట్నం సంప్రదాయ వంటకాలను రుచి చూడండి, ప్రేమతో తయారుచేసినవి.",
      "hero.cta": "ఇప్పుడే కొనండి",

      // Heritage Page
      "heritage.since": "1960ల నుండి",
      "heritage.title": "మా సుగంధ ద్రవ్యాల వారసత్వం",
      "heritage.subtitle": "ఆంధ్రప్రదేశ్ తీరప్రాంత మైదానాల్లో వేర్లు వేసుకున్న మా కథ, MVP కాలనీలోని ఒక చిన్న కుటుంబ వంటగదిలో ప్రారంభమైంది. నేడు మా పూర్వీకుల సాంప్రదాయ పద్ధతులతో ప్రతి పచ్చడి సీసాను తయారుచేస్తున్నాము.",
      "heritage.sec1_title": "అమ్మమ్మ చేతి వంట",
      "heritage.sec1_p1": "1960లలో శ్రీమతి నేరెళ్ల గారు తన ప్రత్యేకమైన 'ఆవకాయ'ను ఇరుగుపొరుగు వారికి తయారుచేయడం ప్రారంభించారు. అది క్రమంగా విశాఖపట్నం అంతటా ప్రాచుర్యం పొందింది.",
      "heritage.sec1_p2": "మా వంటకాల్లో ఉపయోగించే ప్రతి పదార్ధాన్ని మూడు తరాలుగా మేము నమ్ముతున్న స్థానిక రైతుల నుండే సేకరిస్తున్నాము. విశ్వసనీయత అనేది వంటకంలో మాత్రమే కాదు — నేల, చేయి మరియు జాడీ మధ్య ఉన్న అనుబంధంలో ఉంటుంది.",
      "heritage.bento_title": "నేల నుండి ఆత్మ వరకు",
      "heritage.bento_desc": "మా చేతితో ప్యాక్ చేసే విధానం మరియు సహజంగా ఎండబెట్టిన పదార్ధాల దృశ్య ప్రయాణం.",
      "heritage.visit_title": "మా సాంప్రదాయ వంటగదిని సందర్శించండి",
      "heritage.visit_desc": "విశాఖపట్నం నడిబొడ్డున సాంప్రదాయ పద్ధతిలో మసాలాలు దంచడం మరియు పచ్చళ్ల తయారీని ప్రత్యక్షంగా చూడండి.",
      "heritage.journal_cta": "మా ఫ్యామిలీ జర్నల్ చదవండి",

      // Product Details Page
      "product.spice_level": "కారం స్థాయి",
      "product.shelf_life": "నిల్వ కాలం",
      "product.select_weight": "బరువును ఎంచుకోండి",
      "product.select_pkg": "ప్యాకేజింగ్ రకం",
      "product.ingredients": "కావలసిన పదార్థాలు",
      "product.storage": "నిల్వ సూచనలు",
      "product.add_to_cart": "కార్ట్‌కి జోడించు",
      "product.order_whatsapp": "వాట్సాప్ ద్వారా ఆర్డర్ చేయండి",
      "product.homemade": "100% ఇంటి తయారీ",
      "product.veg": "శాకాహారం",
      "product.traditional": "సాంప్రదాయ రెసిపీ",
      "product.no_preservatives": "సంరక్షకాలు లేవు",
      "product.ceramic_jar": "జాడీ (సీసా)",
      "product.eco_refill": "ఎకో-రీఫిల్",
      "product.pure_handcrafted": "పూర్తిగా హస్తకళతో కూడినది",
      "product.incl_pkg": "ప్యాకేజింగ్ తో కలిపి",

      // Order Success Page
      "success.title": "ఆర్డర్ అభ్యర్థన పంపబడింది",
      "success.subtitle": "నేరెళ్ల ఇంటి రుచులను ఎంచుకున్నందుకు ధన్యవాదాలు",
      "success.desc": "మీ ఆర్డర్ వివరాలు మరియు డెలివరీ ప్రాధాన్యతలను ధృవీకరించడానికి మా బృందం త్వరలో మిమ్మల్ని సంప్రదిస్తుంది. సహకరించినందుకు ధన్యవాదాలు.",
      "success.whatsapp": "వాట్సాప్‌లో సంప్రదించండి",
      "success.continue": "షాపింగ్ కొనసాగించండి",

      // Offline Page
      "offline.title": "అయ్యో! మీరు ఆఫ్‌లైన్‌లో ఉన్నారు",
      "offline.desc": "మీ ఇంటర్నెట్ కనెక్షన్ పోయినట్లుంది, కానీ మా పచ్చళ్ల సువాసన ఇంకా ఇక్కడే ఉంది. కనెక్షన్ రాగానే తిరిగి వస్తాము.",
      "offline.retry": "మళ్ళీ ప్రయత్నించండి",
      "offline.call": "మాకు కాల్ చేయండి",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
