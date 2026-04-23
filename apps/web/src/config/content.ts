/**
 * Textos principales de la landing Donde Bailar MX.
 * Copy orientado a conversión (CDMX, eventos, exploración web primero).
 */

export const landingContent = {
  hero: {
    kicker: "La comunidad de baile en CDMX",
    headlineBefore: "Nunca más te pierdas un ",
    headlineGrad: "evento de baile",
    headlineAfter: " en CDMX",
    subheadline:
      "Todos los eventos de baile de CDMX en un solo lugar. Sin grupos de WhatsApp, sin stories que desaparecen.",
    ctaPrimary: "Ver eventos de esta semana",
    ctaSecondary: "Ver en la web primero",
    ctaMicrocopy: "Gratis · Sin registro para explorar · iOS y Android",
    badges: ["500+ eventos publicados", "Salsa · Bachata · Kizomba y más"],
  },

  midCta: {
    title: "Esta semana hay sociales en tu zona",
    microcopy: "Gratis · Sin registro para explorar",
    ctaPrimary: "Ver eventos ahora",
    ctaSecondary: "Explorar en la web",
  },

  demo: {
    title: "¿Qué estás buscando?",
    dateOptions: ["Todos", "Hoy", "Mañana", "Esta semana"] as const,
    tabEvents: "Eventos",
    tabClasses: "Clases",
    tabAcademies: "Academias",
    tabTeachers: "Maestros",
    tabOrganizers: "Organizadores",
    viewDetails: "Ver detalles",
  },

  benefits: {
    title: "Por qué la comunidad lo usa cada semana",
    subtitle: "",
    items: [
      {
        title: "Eventos verificados",
        description:
          "Fecha, lugar y precio confirmados. No más llegar a un lugar cerrado.",
        icon: "CalendarCheck",
      },
      {
        title: "Filtra en segundos",
        description: "Por ritmo, zona y precio. Encuentra lo que buscas sin scroll infinito.",
        icon: "Filter",
      },
      {
        title: "Sin algoritmo",
        description: "Ves lo que hay, no lo que el algoritmo decide mostrarte.",
        icon: "BellOff",
      },
      {
        title: "Siempre actualizado",
        description: "Los organizadores actualizan directamente. La info es del día.",
        icon: "RefreshCw",
      },
    ],
  },

  howItWorks: {
    title: "En 3 pasos, esta semana bailas",
    steps: [
      {
        step: 1,
        title: "Descarga",
        description: "Gratis en iOS y Android. En 30 segundos estás dentro.",
      },
      {
        step: 2,
        title: "Filtra",
        description: "Salsa, bachata, kizomba — por zona y día. Solo eventos verificados.",
      },
      {
        step: 3,
        title: "Ve y baila",
        description: "Llega sabiendo precio, horario y lugar. Sin sorpresas.",
      },
    ],
  },

  socialProof: {
    testimonials: [
      {
        quote:
          "Antes buscaba en 4 grupos de WhatsApp para saber qué había el fin de semana. Ahora abro Donde Bailar y en 30 segundos ya sé a dónde voy.",
        author: "Ana Martínez",
        role: "Bailarina de salsa · CDMX Sur",
      },
      {
        quote:
          "Publicamos nuestros eventos y nos llegan alumnos que ya saben el precio y el horario. Menos mensajes, más inscripciones.",
        author: "Estudio Salsa CDMX",
        role: "Academia · Roma Norte",
      },
      {
        quote:
          "Los filtros por ritmo y zona me ahorran tiempo. Voy directo a lo que me interesa. La uso cada semana.",
        author: "Carlos R.",
        role: "Asiduo a socials",
      },
    ],
    metrics: [
      { value: "500+", label: "Eventos publicados" },
      { value: "50+", label: "Academias y maestros" },
      { value: "CDMX", label: "Ciudad de lanzamiento" },
    ],
  },

  b2b: {
    title: "Para academias y organizadores",
    subtitle: "Llega a bailarines que ya buscan clases y eventos. Sin depender del algoritmo.",
    visionLine:
      "Ser la plataforma de referencia para descubrir y gestionar la vida del baile.",
    benefits: [
      {
        title: "Visibilidad con intención",
        description: "Aparece en búsquedas por ritmo y zona. Tu audiencia te encuentra cuando busca.",
      },
      {
        title: "Leads directos",
        description: "Usuarios te contactan desde la app. Menos ruido, más conversión.",
      },
      {
        title: "Publica y actualiza fácil",
        description: "Sube eventos y clases en minutos. Información estructurada que la gente usa.",
      },
    ],
    form: {
      namePlaceholder: "Nombre o academia",
      contactPlaceholder: "WhatsApp o email",
      roleOptions: ["Academia", "Maestro", "Organizador"] as const,
      submit: "Quiero que me contacten",
      successMessage: "Recibido. Te escribimos en menos de 24h.",
    },
  },

  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        q: "¿La app tiene costo?",
        a: "No. La descarga y el uso son completamente gratuitos.",
      },
      {
        q: "¿En qué ciudades está disponible?",
        a: "Estamos enfocados en CDMX y área metropolitana. Pronto más ciudades.",
      },
      {
        q: "¿Cómo publico mi evento o clase?",
        a: "Regístrate como academia, maestro u organizador desde la app o déjanos tus datos arriba y te contactamos.",
      },
      {
        q: "¿Mis datos están seguros?",
        a: "Sí. No vendemos tus datos. Consulta nuestra política de privacidad.",
      },
    ],
  },

  footer: {
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
    ctaCopy: "Descarga gratis",
    socialLabel: "Síguenos",
    helpCenter: "Centro de ayuda",
    legalTitle: "Legal",
    supportTitle: "Soporte",
    tagline:
      "La comunidad del baile en un solo lugar: eventos, clases y perfiles. Descubre y conecta sin ruido.",
    ctaPro: "Para academias y organizadores: publica, recibe leads y crece desde la app.",
  },
} as const;

export type LandingContent = typeof landingContent;
