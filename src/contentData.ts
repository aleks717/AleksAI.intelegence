export interface FAQItem {
  id: string;
  question: { [key: string]: string };
  answer: { [key: string]: string };
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  model: string;
  date: string;
  isCustom?: boolean;
}

export interface MatrixRow {
  benefit: { [key: string]: string };
  max: string;       // AleksAI Max
  neo: string;       // AleksAI neo
  pro: string;       // AleksAI Pro
  standart: string;  // AleksAI StandArt
  buissnis: string;  // AleksAI buissnis
  ultra: string;     // AleksAI Ultra
}

export interface ChangelogItem {
  version: string;
  date: string;
  title: { [key: string]: string };
  bullets: { [key: string]: string[] };
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    question: {
      de: "Wie funktioniert AlerksAI Intelegence und ist es wirklich kostenlos?",
      en: "How does AlerksAI Intelegence work and is it really free?",
      es: "¿Cómo funciona AlerksAI Intelegence y es realmente gratis?",
      fr: "Comment fonctionne AlerksAI Intelegence et est-ce vraiment gratuit?",
      it: "Come funziona AlerksAI Intelegence ed è davvero gratuito?",
      tr: "AlerksAI Intelegence nasıl çalışır ve gerçekten ücretsiz midir?",
      sr: "Kako funkcioniše AlerksAI Intelegence i da li je zaista besplatan?"
    },
    answer: {
      de: "Ja, AlerksAI ist vollkommen kostenlos! Du erhältst täglich 100 Energie-Credits gratis, die für KI-Anfragen genutzt werden können. Es gibt keine Abonnements, keine Kreditkarten-Pflicht und keine versteckten Kosten.",
      en: "Yes, AlerksAI is completely free! You get 100 free energy credits daily, which can be used for AI queries. There are no subscriptions, no credit card requirements, and no hidden fees.",
      es: "¡Sí, AlerksAI es absolutamente gratuito! Recibes 100 créditos de energía diarios de forma gratuita para usar en consultas de IA. No hay suscripciones, ni requisitos de tarjeta de crédito, ni tarifas ocultas.",
      fr: "Oui, AlerksAI est entièrement gratuit! Vous recevez 100 crédits d'énergie gratuits par jour, utilisables pour des requêtes d'IA. Il n'y a ni abonnement, ni obligation de carte bancaire, ni frais cachés.",
      it: "Sì, AlerksAI è completamente gratuito! Ricevi 100 crediti energetici gratuiti al giorno, utilizzabili per le query dynamic dell'IA. Non ci sono abbonamenti, requisiti di carta di credito o costi nascosti.",
      tr: "Evet, AlerksAI tamamen ücretsizdir! Yapay zekâ sorguları için her gün 100 ücretsiz enerji kredisi alırsınız. Abonelik, kredi kartı zorunluluğu veya gizli ücretler yoktur.",
      sr: "Da, AlerksAI je potpuno besplatan! Svakog dana dobijate 100 besplatnih energetskih kredita koji se mogu koristiti za AI upite. Nema pretplata, obaveznih kartica niti skrivenih troškova.",
    }
  },
  {
    id: "faq-2",
    question: {
      de: "Wie werden meine Energie-Credits zurückgesetzt oder aufgeladen?",
      en: "How are my energy credits reset or recharged?",
      es: "¿Cómo se restablecen o recargan mis créditos de energía?",
      fr: "Comment mes crédits d'énergie sont-ils réinitialisés ou rechargés?",
      it: "Come vengono ripristinati o ricaricati i miei crediti energetici?",
      tr: "Enerji kredilerim nasıl sıfırlanır veya yeniden doldurulur?",
      sr: "Kako se moji energetski krediti resetuju ili dopunjuju?"
    },
    answer: {
      de: "Deine Credits werden jeden Tag automatisch wieder auf 100 Credits aufgefüllt, sobald die Uhr Mitternacht schlägt. Du musst dafür nichts tun. Logge dich einfach ein und deine Energie ist wieder voll!",
      en: "Your credits are automatically refilled to 100 credits every day when midnight strikes. You don't have to do anything. Simply log in and your energy is fully restored!",
      es: "Tus créditos se recargan automáticamente a 100 créditos todos los días a medianoche. No tienes que hacer nada. ¡Simplemente inicia sesión y tu energía se restaurará por completo!",
      fr: "Vos crédits sont automatiquement rechargés à 100 chaque jour à minuit. Vous n'avez rien à faire. Connectez-vous simplement et votre jauge d'énergie est à nouveau pleine!",
      it: "I tuoi crediti vengono ricaricati automaticamente a 100 ogni giorno a mezzanotte. Non devi fare nulla. Entra semplicemente e la tua barra energetica tornerà al massimo!",
      tr: "Kredileriniz her gün gece yarısı otomatik olarak 100 krediye tamamlanır. Hiçbir şey yapmanıza gerek yoktur. Sadece sohbet alanına girin, krediniz dolu olacaktır!",
      sr: "Vaši krediti se automatski dopunjuju na 100 kredita svakog dana u ponoć. Ne morate ništa da radite. Jednostavno se prijavite i vaša energija je ponovo puna!"
    }
  },
  {
    id: "faq-3",
    question: {
      de: "Welches KI-Modell ist das beste für meine Aufgabe?",
      en: "Which AI model is the best for my task?",
      es: "¿Qué modelo de IA es el mejor para mi tarea?",
      fr: "Quel modèle d'IA est le meilleur pour ma tâche?",
      it: "Quale modello IA è il migliore per il mio compito?",
      tr: "Görevim için en iyi yapay zekâ modeli hangisidir?",
      sr: "Koji AI model je najbolji za moj zadatak?"
    },
    answer: {
      de: "Nutze AlerksAI Intelegence (Gemini Intelligence) für kreative Texte und multimodale Aufgaben, AlerksAI Pro (GPT-4o) für schnelle, logische Antworten, AlerksAI neo (Llama) für prägnante, direkte Chats, AlerksAI Max (Meta Llama) für extrem anspruchsvolle tiefgehende Analysen und AlerksAI Business (Claude) für exzellenten Code und lange Dokumente.",
      en: "Use AlerksAI Intelegence (Gemini Intelligence) for creative writing and multimodal work, AlerksAI Pro (GPT-4o) for fast, logical answers, AlerksAI neo (Llama) for concise responses, AlerksAI Max (Meta Llama) for incredibly deep logical reasoning, and AlerksAI Business (Claude) for peak performance coding and brilliant language understanding.",
      es: "Usa AlerksAI Intelegence (Gemini Intelligence) para redacción creativa, AlerksAI Pro (GPT-4o) para respuestas rápidas y lógicas, AlerksAI neo (Llama) para chats directos y breves, AlerksAI Max (Meta Llama) para razonamiento lógico profundo und AlerksAI Business (Claude) para desarrollo de código excelente.",
      fr: "Utilisez AlerksAI Intelegence (Gemini Intelligence) pour la rédaction créative, AlerksAI Pro (GPT-4o) pour des réponses logiques et ultra-rapides, AlerksAI neo (Llama) pour des discussions directes, AlerksAI Max (Meta Llama) pour des analyses de logique complexes, et AlerksAI Business (Claude) pour un codage de haut niveau.",
      it: "Usa AlerksAI Intelegence (Gemini Intelligence) per testi creativi, AlerksAI Pro (GPT-4o) per risposte logiche e veloci, AlerksAI neo (Llama) per conversazioni coincise, AlerksAI Max (Meta Llama) per riflessioni logiche profonde, e AlerksAI Business (Claude) per codice eccellente.",
      tr: "Yaratıcı metinler ve görseller için AlerksAI Intelegence (Gemini Intelligence), hızlı ve mantıklı yanıtlar için AlerksAI Pro (GPT-4o), doğrudan sohbetler için AlerksAI neo (Llama), derinlemesine analiz için AlerksAI Max (Meta Llama) ve yazılım geliştirme & kod yazma için AlerksAI Business (Claude) modelini kullanın.",
      sr: "Koristite AlerksAI Intelegence (Gemini Intelligence) za kreativno pisanje, AlerksAI Pro (GPT-4o) za brze i logične odgovore, AlerksAI neo (Llama) za koncizne razgovore, AlerksAI Max (Meta Llama) za duboko logičko razmišljanje, a AlerksAI Business (Claude) za vrhunsko programiranje i dugačke analize.",
    }
  },
  {
    id: "faq-4",
    question: {
      de: "Sind meine Chatverläufe sicher und privat?",
      en: "Are my chat histories secure and private?",
      es: "¿Mis historiales de chat son seguros y privados?",
      fr: "Mes historiques de discussion sont-ils sécurisés et privés?",
      it: "La mia cronologia di chat è sicura e privata?",
      tr: "Sohbet geçmişlerim güvenli ve gizli mi?",
      sr: "Da li je moja istorija ćaskanja sigurna i privatna?"
    },
    answer: {
      de: "Absolut! Deine Unterhaltungen werden ausschließlich lokal im Speicher deines Webbrowsers (LocalStorage) auf deinem eigenen Gerät gesichert. Niemand sonst hat Zugriff auf deine privaten Chats oder Daten.",
      en: "Absolutely! Your conversations are stored exclusively in your local web browser storage (LocalStorage) on your own device. No one else has access to your private discussions or data.",
      es: "¡Totalmente! Tus conversaciones se guardan exclusivamente de manera local en el almacenamiento de tu navegador web (LocalStorage) en tu propio dispositivo. Nadie más tiene acceso a tus chats o datos privados.",
      fr: "Absolument! Vos conversations sont stockées exclusivement de manière locale dans la mémoire de votre navigateur internet (LocalStorage) sur votre propre appareil. Personne d'autre n'a accès à vos discussions ou données privées.",
      it: "Assolutamente! Le tue conversazioni sono salvate esclusivamente nella memoria locale del tuo browser web (LocalStorage) sul tuo dispositivo. Nessun altro ha accesso alle tue chat o ai tuoi dati personali.",
      tr: "Kesinlikle! Sohbetleriniz yalnızca kendi cihazınızdaki internet tarayıcısının yerel deposunda (LocalStorage) saklanır. Özel sohbetlerinize veya verilerinize sizden başka kimse erişemez.",
      sr: "Apsolutno! Vaši razgovori se čuvaju isključivo lokalno u memoriji vašeg veb pregledača (LocalStorage) na vašem sopstvenom uređaju. Niko drugi nema pristup vašim privatnim ćaskanjima ili podacima."
    }
  },
  {
    id: "faq-5",
    question: {
      de: "Kann AlerksAI Programmiercode schreiben?",
      en: "Can AlerksAI write programming code?",
      es: "¿Puede AlerksAI escribir código de programación?",
      fr: "AlerksAI peut-il écrire du code de programmation?",
      it: "AlerksAI può scrivere codice di programmazione?",
      tr: "AlerksAI programlama kodu yazabilir mi?",
      sr: "Da li AlerksAI može da piše programski kod?"
    },
    answer: {
      de: "Ja, AlerksAI ist ein hervorragender Programmierpartner! Ob HTML, CSS, JavaScript, Python, C++, SQL oder Java — er schreibt Code, erklärt logische Fehler und optimiert Algorithmen sekundenschnell.",
      en: "Yes, AlerksAI is an excellent coding partner! Whether HTML, CSS, JavaScript, Python, C++, SQL, or Java — it writes code, explains logical bugs, and optimizes algorithms within seconds.",
      es: "¡Sí, AlerksAI es un excelente compañero de programación! Ya sea HTML, CSS, JavaScript, Python, C++, SQL o Java: escribe código, explica errores lógicos y optimiza algoritmos en segundos.",
      fr: "Oui, AlerksAI est un excellent partenaire de développement! Qu'il s'agisse de HTML, CSS, JavaScript, Python, C++, SQL ou Java — il écrit du code, explique les bugs logiques et optimise les algorithmes en quelques secondes.",
      it: "Sì, AlerksAI è un eccellente partner di programmazione! Che si tratti di HTML, CSS, JavaScript, Python, C++, SQL o Java, scrive codice, corregge bug logici e ottimizza algoritmi in pochi secondi.",
      tr: "Evet, AlerksAI mükemmel bir programlama ortağıdır! HTML, CSS, JavaScript, Python, C++, SQL veya Java fark etmeksizin kod yazar, mantıksal hataları açıklar ve algoritmaları saniyeler içinde optimize eder.",
      sr: "Da, AlerksAI je odličan partner za programiranje! Bilo da je u pitanju HTML, CSS, JavaScript, Python, C++, SQL ili Java — on piše kod, objašnjava logičke greške i optimizuje algoritme u sekundi.",
    }
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Hasan M.",
    rating: 5,
    text: "Die Performance hier schlägt alles! Dass ich AlerksAI Intelegence (Gemini Intelligence) und AlerksAI Business für vollkommen kostenfrei und ohne nerviges Abo nutzen kann, ist eine absolute Revolution. Beste Seite!",
    model: "AlerksAI Intelegence",
    date: "12.06.2026"
  },
  {
    id: "rev-2",
    name: "Boris S.",
    rating: 5,
    text: "Schöne, cleane Benutzeroberfläche und nützliche Gerät-Emulatoren in den Einstellungen! Ich lerne täglich mit AlerksAI Pro. Meine Empfehlung an alle Studierenden.",
    model: "AlerksAI Pro",
    date: "10.06.2026"
  },
  {
    id: "rev-3",
    name: "Aleks S√.",
    rating: 4,
    text: "Gute Modellauswahl. AlerksAI Max (Meta Llama) löst komplexe Logikfragen erstaunlich gründlich. Die Ladezeiten im Chat sind super.",
    model: "AlerksAI Max",
    date: "08.06.2026"
  },
  {
    id: "rev-4",
    name: "Marica T.",
    rating: 5,
    text: "Absolument fantastique! Très rapide, pas de spam publicitaire, et la traduction française est impeccable. Merci beaucoup pour ce service généreux.",
    model: "AlerksAI neo",
    date: "05.06.2026"
  },
  {

    id: "rev-5",
    name: "leon R",
    rating: 5,
    text: "Sehr gut! Wie eine Echte proffesionelle KI.sehr sclau und hilfsbereit.Weiss einfach alles!Sofort 5 sterne ohne lange nachdenken.",
    model: "AlerksAI pro",
    date: "26.06.2026"
  }
]; 
   
export const MODEL_COMPARISON_MATRIX: MatrixRow[] = [
  {
    benefit: {
      de: "💡 Haupt-Spezialität",
      en: "💡 Main Specialty",
      es: "💡 Especialidad principal",
      fr: "💡 Spécialité principale",
      it: "💡 Specialità principale",
      tr: "💡 Ana Uzmanlık Alanı",
      sr: "💡 Glavna specijalnost"
    },
    max: "Text & Kreativität (Google)",
    neo: "Effizienz & Chats (Meta)",
    pro: "Blitzschnell (OpenAI)",
    standart: "Komplexe Forschung (DeepSeek)",
    buissnis: "Programmierung & Detail (Claude)",
    ultra: "Meta Power (70B)"
  },
  {
    benefit: {
      de: "⚡ Geschwindigkeit",
      en: "⚡ Speed Index",
      es: "⚡ Índice de velocidad",
      fr: "⚡ Vitesse de réponse",
      it: "⚡ Indice di velocità",
      tr: "⚡ Hız Endeksi",
      sr: "⚡ Brzina"
    },
    max: "Sehr hoch (9/10)",
    neo: "Exzellent (9.5/10)",
    pro: "Maximal (10/10)",
    standart: "Moderat (7.5/10)",
    buissnis: "Gut (8.5/10)",
    ultra: "Sehr gut (8.8/10)"
  },
  {
    benefit: {
      de: "🧠 Logik & Mathe-Stärke",
      en: "🧠 Logic & Math Strength",
      es: "🧠 Fuerza lógica y mates",
      fr: "🧠 Logique et maths",
      it: "🧠 Capacità di logica e matematica",
      tr: "🧠 Mantık ve Matematik",
      sr: "🧠 Logika i matematika"
    },
    max: "8.5 / 10",
    neo: "7.5 / 10",
    pro: "9.0 / 10",
    standart: "10 / 10 (Unglaublich!)",
    buissnis: "9.5 / 10",
    ultra: "9.3 / 10"
  },
  {
    benefit: {
      de: "🌐 Fremdsprachen",
      en: "🌐 Multi-language Ability",
      es: "🌐 Habilidad multilingüe",
      fr: "🌐 Capacités linguistiques",
      it: "🌐 Multilinguismo, traduzione",
      tr: "🌐 Yabancı Dil Becerisi",
      sr: "🌐 Strani jezici"
    },
    max: "Überragend (9.8/10)",
    neo: "Gut (8.5/10)",
    pro: "Exzellent (9.5/10)",
    standart: "Sehr gut (9/10)",
    buissnis: "Perfekt (9.9/10)",
    ultra: "Exzellent (9.4/10)"
  },
  {
    benefit: {
      de: "💻 Coding / Programmieren",
      en: "💻 Coding / Programming",
      es: "💻 Codificación y software",
      fr: "💻 Programmation et dev",
      it: "💻 Programmazione / Dev",
      tr: "💻 Programlama Yeteneği",
      sr: "💻 Programiranje / Kod"
    },
    max: "8.8 / 10",
    neo: "8.0 / 10",
    pro: "9.2 / 10",
    standart: "9.6 / 10",
    buissnis: "10 / 10",
    ultra: "9.0 / 10"
  },
  {
    benefit: {
      de: "🔋 Credit-Kosten",
      en: "🔋 Credit Cost",
      es: "🔋 Costo de créditos",
      fr: "🔋 Coût en crédits",
      it: "🔋 Consumo di crediti",
      tr: "🔋 Kredi Maliyeti",
      sr: "🔋 Potrošnja kredita"
    },
    max: "1 Credit",
    neo: "1 Credit",
    pro: "1 Credit",
    standart: "1 Credit",
    buissnis: "1 Credit",
    ultra: "0 Credits (Kostenlos!)"
  }
];

export const CHANGELOG_DATA: ChangelogItem[] = [
  {
    version: "v2.1",
    date: "Juni 2026",
    title: {
      de: "Interactive Community Erweiterungen",
      en: "Interactive Community Enhancements",
      es: "Mejoras comunitarias interactivas",
      fr: "Améliorations communautaires interactives",
      it: "Miglioramenti interattivi della community",
      tr: "Etkileşimli Topluluk Geliştirmeleri",
      sr: "Interaktivna poboljšanja zajednice"
    },
    bullets: {
      de: [
        "Integrierte FAQs: Beantwortet die brennendsten Fragen rund um AlerksAI auf einen Klick.",
        "Live-Bewertungs-Dashboard: Schreibe eigene Erfahrungsberichte und vergebe Sterne.",
        "Detail-Vergleichsmatrix: Optimiere deine Modellwahl basierend auf Geschwindigkeit und Programmierstärke.",
        "Responsive Device-Frame Upgrade: Settings und Vorschau-Größen wurden auf ein handliches, barrierefreies Maß komprimiert."
      ],
      en: [
        "Integrated FAQs: Instant answers to the most common questions about AlerksAI.",
        "Live Reviews Dashboard: Leave custom comments and cast star ratings securely.",
        "Model Comparison Matrix: Pick your perfect brain based on capabilities, speed index, and logic quality.",
        "Optimized Device-Frame View: Compressed settings panels and simulator frames to be more compact."
      ],
      es: [
        "Preguntas frecuentes (FAQs): Respuestas inmediatas a tus dudas sobre AlerksAI.",
        "Dashboard interactivo de reseñas: Envía comentarios y valora con estrellas.",
        "Matriz de comparación de modelos: Elige tu modelo ideal de forma inteligente.",
        "Diseño más compacto: Panel de configuración y emulador optimizados en tamaño."
      ],
      fr: [
        "FAQs intégrées: Réponses instantanées à vos questions sur AlerksAI.",
        "Tableau de bord d'avis en direct: Écrivez vos commentaires et attribuez des étoiles.",
        "Matrice comparative de modèles: Sélectionnez le meilleur selon la vitesse et la logique.",
        "Émulateur compact: Amélioration du design pour une fermeture plus ergonomique."
      ],
      it: [
        "FAQ integrate: Risposte immediate alle domande frequenti su AlerksAI.",
        "Recensioni in tempo reale: Scrivi la tua esperienza e assegna le stelle.",
        "Tabella comparativa: Trova il modello ottimale in base alle prestazioni.",
        "Frame emulatori ottimizzati: Interfaccia utente compatta e accessibile."
      ],
      tr: [
        "Entegre SSS Alanı: AlerksAI hakkındaki sorulara tek tıklamayla yanıt alın.",
        "Canlı Değerlendirme Paneli: Kendi geri bildirimlerinizi yazın ve yıldız verin.",
        "Model Karşılaştırma Tablosu: Hız ve mantık yeteneklerine göre en iyi modeli seçin.",
        "Küçültülmüş Ayarlar Modalı: Kapatılması kolay kılan kompakt tasarımlı görünüm."
      ],
      sr: [
        "Integrisana FAQ sekcija: Odgovori na najvažnija pitanja o funkcionisanju AlerksAI platforme.",
        "Zajednički panel za recenzije: Napišite sopstvene utiske i ocenite rad zvezdicama.",
        "Matrica poređenja modela: Izaberite savršen model na osnovu brzine i preciznosti programiranja.",
        "Kompaktniji interfejs: Podešavanja i emulatori su smanjeni radi bolje preglednosti."
      ]
    }
  },
  {
    version: "v2.0",
    date: "Mai 2026",
    title: {
      de: "Multi-Modell Revolution",
      en: "Multi-Model Revolution",
      es: "Revolución de modelos múltiples",
      fr: "Révolution multi-modèles",
      it: "Rivoluzione multi-modello",
      tr: "Çoklu Model Devrimi",
      sr: "Revolucija više modela"
    },
    bullets: {
      de: [
        "Erweitert auf 5 Weltklasse-KI-Modelle vollständig kostenfrei.",
        "Sichere Authentifizierung: Profile erstellen und Verläufe lokal synchronisieren.",
        "Integration von Meta Llama 3.3 (AlerksAI Intelegence) für anspruchsvolle Text- und logische Analysen.",
        "Mehrsprachiger Sprachassistent: Automatische Übersetzung der gesamten Oberfläche in 7 Sprachen."
      ],
      en: [
        "Expanded to 5 world-class AI models entirely free of charge.",
        "Secure authorization: Create profiles and synchronize chats locally.",
        "Integration of Meta Llama 3.3 (AlerksAI Intelegence) for rich text and reasoning analyses.",
        "Multi-language support: Complete translated interfaces for 7 different nations."
      ],
      es: [
        "Ampliado a 5 modelos de IA de nivel mundial completamente gratuitos.",
        "Autorización segura de perfiles combinada con almacenamiento en la memoria local.",
        "Introducción de Meta Llama 3.3 (AlerksAI Intelegence) para resolver tareas complejas y análisis de texto.",
        "Traducción automática de la plataforma a 7 idiomas oficiales."
      ],
      fr: [
        "Passage à 5 modèles d'IA de classe mondiale entièrement gratuits.",
        "Création de profil sécurisée et historique synchronisé localement.",
        "Ajout de Meta Llama 3.3 (AlerksAI Intelegence) pour les analyses complexes et la rédaction.",
        "Support multilingue étendu à 7 langues nationales."
      ],
      it: [
        "Piattaforma ampliata a 5 modelli IA mondiali del tutto gratis.",
        "Profilo sicuro con cronologia salvata in locale.",
        "Introduzione di Meta Llama 3.3 (AlerksAI Intelegence) per sessioni di scrittura e analisi complessa.",
        "Interfaccia tradotta professionalmente in 7 lingue."
      ],
      tr: [
        "Sisteme tamamen ücretsiz 5 dünya lideri yapay zekâ modeli yerleştirildi.",
        "Güvenli kimlik doğrulama ile profil oluşturma und geçmişi yerel kaydetme.",
        "Zengin metin analizi ve yazım becerileri için Meta Llama 3.3 (AlerksAI Intelegence) eklendi.",
        "Yapay zekâ arayüzü 7 farklı dile profesyonelce çevrildi."
      ],
      sr: [
        "Proširili smo ponudu na 5 besplatnih svetskih AI modela.",
        "Kreiranje bezbednih profila sa lokalnim čuvanjem istorije ćaskanja.",
        "Dodat model Meta Llama 3.3 (AlerksAI Intelegence) za rešavanje složenih tekstualnih i logičkih zadataka.",
        "Kompletan interfejs je jezički prilagođen za 7 svetskih jezika."
      ]
    }
  }
];

export const OTHER_TEXTS: { [key: string]: { [key: string]: string } } = {
  faqTitle: {
    de: "💡 Häufig gestellte Fragen (FAQ)",
    en: "💡 Frequently Asked Questions (FAQ)",
    es: "💡 Preguntas Frecuentes (FAQ)",
    fr: "💡 Foire Aux Questions (FAQ)",
    it: "💡 Domande Frequenti (FAQ)",
    tr: "💡 Sıkça Sorulan Sorular (SSS)",
    sr: "💡 Često postavljana pitanja (FAQ)"
  },
  faqSubtitle: {
    de: "Smarte Antworten auf deine Fragen zu AlerksAI Intelegence",
    en: "Smart answers to your questions about AlerksAI Intelegence",
    es: "Respuestas directas a tus dudas sobre AlerksAI Intelegence",
    fr: "Réponses intelligentes à vos questions sur AlerksAI Intelegence",
    it: "Risposte intelligenti alle tue domande su AlerksAI Intelegence",
    tr: "AlerksAI Intelegence hakkında bilmek istediğiniz her şey",
    sr: "Brzi i jasni odgovori na vaša pitanja o AlerksAI platformi"
  },
  reviewsTitle: {
    de: "⭐ Bewertungen & Feedback-Center",
    en: "⭐ Reviews & Feedback Center",
    es: "⭐ Centro de Reseñas y Comentarios",
    fr: "⭐ Espace Avis & Commentaires",
    it: "⭐ Centro Recensioni e Feedback",
    tr: "⭐ Değerlendirme & Geri Bildirim Merkezi",
    sr: "⭐ Recenzije i centar za utiske"
  },
  reviewsSubtitle: {
    de: "Echtes Feedback von unseren Nutzern. Schreibe auch du deinen Bericht!",
    en: "Real feedback from our users. Write your experience too!",
    es: "Opiniones reales de usuarios activos. ¡Deja tu propia valoración!",
    fr: "Avis authentiques de nos utilisateurs. Écrivez le vôtre !",
    it: "Feedback sinceri dai nostri utenti. Lascia anche la tua recensione!",
    tr: "Kullanıcılarımızdan gelen gerçek yorumlar. Siz de yazın!",
    sr: "Iskustva realnih korisnika platforme. Napišite i vaš utisak!"
  },
  modelMatrixTitle: {
    de: "📊 Modell-Vergleichsmatrix",
    en: "📊 Model Comparison Matrix",
    es: "📊 Matriz Comparativa de Modelos",
    fr: "📊 Tableau Comparatif des Modèles",
    it: "📊 Tabella Comparativa dei Modelli",
    tr: "📊 Model Karşılaştırma Matrisi",
    sr: "📊 Matrica poređenja modela"
  },
  modelMatrixSubtitle: {
    de: "Erfahre auf einen Blick, welches unserer 5 Modelle am besten für deinen Zweck geeignet ist",
    en: "Find out at a glance which of our 5 models is best suited for your purpose",
    es: "Descubre al instante qué modelo de los 5 se adapta mejor a tu necesidad",
    fr: "Découvrez en un coup d'œil quel est le meilleur modèle pour vos besoins",
    it: "Individua all'istante il modello ideale in base alle tue specifiche esigenze",
    tr: "Amacınıza en uygun yapay zekâ modelini anında tespit edin",
    sr: "Saznajte na prvi pogled koji je od 5 modela idealan za vaše specifične potrebe"
  },
  writeReviewTitle: {
    de: "✍️ Teile deine Erfahrung",
    en: "✍️ Share Your Experience",
    es: "✍️ Comparte Tu Experiencia",
    fr: "✍️ Partagez Votre Expérience",
    it: "✍️ Condividi la tua Esperienza",
    tr: "✍️ Kendi Yorumunu Yaz",
    sr: "✍️ Podelite i vi vaše utiske"
  },
  nameLabel: {
    de: "Dein Name",
    en: "Your Name",
    es: "Tu Nombre",
    fr: "Votre Nom",
    it: "Il tuo Nome",
    tr: "Adınız",
    sr: "Vaše ime"
  },
  ratingLabel: {
    de: "Bewertung",
    en: "Rating",
    es: "Valoración",
    fr: "Note",
    it: "Valutazione",
    tr: "Değerlendirme",
    sr: "Ocena"
  },
  reviewTextLabel: {
    de: "Dein Bericht (Schreibe etwas Schönes...)",
    en: "Your review (Write something nice...)",
    es: "Tu opinión (Escribe algo bonito...)",
    fr: "Votre commentaire (Écrivez un joli message...)",
    it: "La tua recensione (Scrivi un pensiero gentile...)",
    tr: "Değerlendirmeniz (Hoş bir şeyler yazın...)",
    sr: "Vaši utisci (Napišite nešto lepo...)"
  },
  commentLabel: {
    de: "Dein Kommentar",
    en: "Your Comment",
    es: "Tu comentario",
    fr: "Votre commentaire",
    it: "Il tuo commento",
    tr: "Yorumunuz",
    sr: "Vaš komentar"
  },
  submitReviewBtn: {
    de: "Erfahrungsbericht veröffentlichen",
    en: "Publish Review",
    es: "Publicar Valoración",
    fr: "Publier mon Avis",
    it: "Pubblica Recensione",
    tr: "Yorumu Yayınla",
    sr: "Objavite vaš utisak"
  },
  toastReviewSuccess: {
    de: "Vielen Dank! Dein Beitrag wurde erfolgreich auf dem AlerksAI-Board veröffentlicht.",
    en: "Thank you! Your feedback was successfully posted to the AlerksAI board.",
    es: "¡Muchas gracias! Tu opinión ha sido publicada exitosamente.",
    fr: "Merci beaucoup ! Votre message a été ajouté avec succès.",
    it: "Grazie mille! Il tuo feedback è stato pubblicato con successo sul tabellone.",
    tr: "Teşekkürler! Değerlendirmeniz panomuzda başarıyla yayınlandı.",
    sr: "Hvala vam! Vaši utisci su uspešno objavljeni na tabli."
  },
  updatesTitle: {
    de: "🚀 Release-History & Entwickler-Feed",
    en: "🚀 Release History & Developer Feed",
    es: "🚀 Historial de Lanzamientos & Feed del Desarrollador",
    fr: "🚀 Historique des Versions & Feed Développeur",
    it: "🚀 Storico Rilasci & Feed Sviluppatori",
    tr: "🚀 Güncelleme Geçmişi & Geliştirici Günlüğü",
    sr: "🚀 Istorija izdanja i vesti o razvoju"
  },
  updatesSubtitle: {
    de: "Alle Neuerungen, Features und Optimierungen von AlerksAI auf einen Blick",
    en: "All improvements, features, and optimizations of AlerksAI at a glance",
    es: "Descubre todas las optimizaciones y características más recientes",
    fr: "Découvrez toutes les améliorations et nouveautés en un coup d'œil",
    it: "Tutte le nuove funzionalità e i perfezionamenti a colpo d'occhio",
    tr: "AlerksAI platformundaki en son yenilikler ve çalışma raporları",
    sr: "Sva poboljšanja, funkcije i optimizacije na AlerksAI platformi"
  },
  averageRatingLabel: {
    de: "Sterne im Schnitt",
    en: "Average Stars",
    es: "Estrellas Promedio",
    fr: "Moyenne d'Étoiles",
    it: "Media Stelle",
    tr: "Yıldız Ortalaması",
    sr: "Prosečne zvezdice"
  },
  totalReviewsLabel: {
    de: "Gesamte Berichte",
    en: "Total Reviews",
    es: "Total de Reseñas",
    fr: "Total des Avis",
    it: "Recensioni Totali",
    tr: "Toplam Yorum",
    sr: "Ukupno recenzija"
  },
  fiveStarRatioLabel: {
    de: "Empfehlungsrate",
    en: "Recommendation Rate",
    es: "Tasa de Recomendación",
    fr: "Taux de Recommandation",
    it: "Tasso di Raccomandazione",
    tr: "Beğeni Oranı",
    sr: "Preporuka"
  },
  modelLabel: {
    de: "Integrierte Modelle",
    en: "Integrated Models",
    es: "Modelos integrados",
    fr: "Modèles intégrés",
    it: "Modelli integrati",
    tr: "Entegre modeller",
    sr: "Integrisani modeli"
  },
  enterNameError: {
    de: "Bitte gib deinen Namen ein.",
    en: "Please enter your name.",
    es: "Por favor, introduce tu nombre.",
    fr: "Veuillez entrer votre nom.",
    it: "Inserisci il tuo nome, per favore.",
    tr: "Lütfen adınızı girin.",
    sr: "Molimo vas da unesete vaše ime."
  },
  enterTextError: {
    de: "Schreibe bitte einen kurzen Kommentar für den Bericht.",
    en: "Please write a short comment for your review.",
    es: "Por favor, escribe un breve comentario.",
    fr: "Veuillez écrire un court commentaire.",
    it: "Per favore, inserisci un breve commento.",
    tr: "Lütfen inceleme için kısa bir yorum yazın.",
    sr: "Molimo vas napišite kratak utisak."
  }
};
