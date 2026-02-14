/**
 * Textos principales de la landing Donde Bailar MX.
 * Copy orientado a dolores, retención y posicionamiento (infraestructura / industria).
 */

export const landingContent = {
  hero: {
    /** Dolor + resultado en una línea */
    headline: "Deja de perderte en flyers y stories.",
    headlineHighlight: "Encuentra salsa, bachata y más con información real.",
    /** Visión corta para retener */
    subheadline:
      "La plataforma donde personas, academias y maestros se encuentran con intención real. Eventos y clases ordenados, filtros por ritmo y zona, actualizado diario.",
    ctaPrimary: "Descargar la app",
    ctaSecondary: "Soy academia o maestro",
    ctaMicrocopy: "Gratis · Sin spam · Descarga en segundos",
    badges: [
      "Datos reales, no algoritmo",
      "Filtros por ritmo y zona",
      "Comunidad con intención",
    ],
  },

  /** Bloque dolor → solución (marketing) */
  painSolution: {
    painHeadline: "¿Cansado de depender del algoritmo?",
    painSubline:
      "Flyers perdidos, historias que se borran, grupos llenos de ruido. La industria del baile merece un sistema propio.",
    solutionHeadline: "Aquí tienes infraestructura, no solo una app.",
    solutionPoints: [
      "Eventos y clases en un solo lugar, con datos verificados",
      "Decisiones guiadas por información real, no por likes",
      "Una comunidad que busca bailar, no scroll infinito",
    ],
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

  /** Factor WOW: posicionamiento infraestructura / sistema operativo */
  factorWow: {
    overline: "Factor WOW",
    tagline: "Donde Bailar no es una app de contenido. Es infraestructura.",
    pillars: [
      "Convierte flyers, historias y mensajes en data estructurada.",
      "Transforma decisiones improvisadas en decisiones guiadas por información real.",
      "Le da a una industria sin sistema un sistema operativo propio.",
    ],
  },

  /** Usuario buscador: no se vende descubrimiento, se vende decisión */
  decisionNotDiscovery: {
    overline: "Para quien busca",
    headline: "Decidir con datos, no perderse en el feed.",
    subline: "Quien busca salsa, bachata o un social concreto no quiere descubrimiento: quiere comparar, elegir y planear.",
    points: [
      { label: "Datos que importan", text: "Fecha, zona, precio y ritmo en un solo lugar. Sin historias que se borran ni flyers perdidos." },
      { label: "Comparar de verdad", text: "Ves todas las opciones del día o la semana. Eliges por información real, no por likes." },
      { label: "Agenda, no scroll", text: "Planificas tu semana de baile en minutos. Menos tiempo buscando, más tiempo bailando." },
    ],
    closing: "La propuesta es clara: información que te ayuda a decidir.",
  },

  /** Retención: lock-in funcional + comunidad */
  retention: {
    overline: "Retención de usuarios",
    headline: "Por qué la gente vuelve.",
    subline: "No es solo abrir la app: es tener una agenda de baile y una comunidad con la misma intención.",
    points: [
      { label: "Tu agenda de baile", text: "Próximos eventos y clases que guardaste. La app se vuelve tu referencia para planear la semana." },
      { label: "Ritmos y lugares guardados", text: "Sigues a tus academias y maestros favoritos. La información llega cuando la necesitas." },
      { label: "Comunidad con intención", text: "Otros usuarios que buscan aprender y crecer. Menos ruido, más conexiones reales." },
    ],
  },

  /** Business case: para academias y organizadores */
  businessCase: {
    overline: "Para academias y organizadores",
    headline: "Llega a quien ya está buscando.",
    subline: "En Donde Bailar tu audiencia no es el algoritmo: son bailarines que buscan clases y eventos por ritmo, zona y fecha.",
    items: [
      { title: "Visibilidad con intención", description: "Apareces cuando buscan tu ritmo o tu zona. Gente que quiere bailar, no solo scrollear.", icon: "Target" },
      { title: "Menos ruido, más conversión", description: "Leads que llegan desde la app con una pregunta concreta. Menos tiempo explicando, más alumnos en clase.", icon: "Users" },
      { title: "Publica y actualiza en minutos", description: "Eventos y horarios en un formato que la gente usa. Sin depender de stories ni grupos.", icon: "BarChart3" },
      { title: "Referencia del ecosistema", description: "Formas parte de la plataforma que la comunidad usa para planear. Presencia seria y profesional.", icon: "Compass" },
    ],
  },

  benefits: {
    title: "Lo que ganas desde el día uno",
    subtitle: "Diseñado para que encuentres y para que te encuentren.",
    items: [
      {
        title: "Eventos verificados",
        description:
          "Solo eventos y sociales verificados: fechas, lugares y horarios confirmados. Sin sorpresas.",
        icon: "CalendarCheck",
      },
      {
        title: "Filtra por ritmo y zona",
        description:
          "Salsa, bachata, kizomba, tango… y por colonia o zona. Encuentra lo que buscas en segundos.",
        icon: "Filter",
      },
      {
        title: "Clases y academias al día",
        description:
          "Horarios actualizados. Menos llamadas y mensajes perdidos; más tiempo bailando.",
        icon: "Clock",
      },
      {
        title: "Tú decides qué ver",
        description:
          "Sin depender del feed. Notificaciones opcionales. La información va a tu ritmo.",
        icon: "BellOff",
      },
      {
        title: "Gratis y sin trucos",
        description:
          "Descarga gratis. Sin suscripciones escondidas. La comunidad crece cuando la barrera es baja.",
        icon: "Gift",
      },
      {
        title: "Tu ciudad, siempre actualizada",
        description:
          "Contenido local. Actualizado cada día. La referencia para descubrir y gestionar tu vida del baile.",
        icon: "MapPin",
      },
    ],
  },

  howItWorks: {
    title: "En tres pasos",
    steps: [
      {
        step: 1,
        title: "Descarga",
        description: "Instala la app. Sin formularios largos ni barreras.",
      },
      {
        step: 2,
        title: "Filtra",
        description: "Elige fecha, ritmo y zona. Información real, no algoritmo.",
      },
      {
        step: 3,
        title: "Baila",
        description: "Llega al evento o clase. Conecta con la comunidad.",
      },
    ],
  },

  socialProof: {
    sectionTitle: "La comunidad ya está aquí",
    testimonials: [
      {
        quote:
          "Por fin un lugar donde todo está actualizado. Dejé de depender de grupos y stories para saber qué hay.",
        author: "Ana M.",
        role: "Bailarina",
      },
      {
        quote:
          "Publicamos nuestros eventos y nos llegan alumnos con intención real. No es like por like, es gente que quiere bailar.",
        author: "Estudio Salsa CDMX",
        role: "Academia",
      },
      {
        quote:
          "Los filtros por ritmo y zona me ahorran tiempo. Voy directo a lo que me interesa. La uso cada semana.",
        author: "Carlos R.",
        role: "Asiduo a socials",
      },
    ],
    metrics: [
      { value: "500+", label: "Eventos mensuales", placeholder: true },
      { value: "50+", label: "Academias y maestros", placeholder: true },
      { value: "10k+", label: "Bailarines en la app", placeholder: true },
    ],
    alliesTitle: "Academias y espacios que ya confían en la plataforma",
    alliesPlaceholder: "Logo academia 1 · Logo academia 2 · Logo academia 3",
  },

  b2b: {
    title: "Si enseñas u organizas: toma control de tu audiencia",
    subtitle:
      "Deja de depender del algoritmo. Llega a bailarines que buscan clases y eventos con intención real. Visibilidad, leads y profesionalización.",
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
      namePlaceholder: "Nombre o nombre de academia",
      contactPlaceholder: "WhatsApp o email",
      rolePlaceholder: "Rol",
      roleOptions: ["Academia", "Maestro", "Organizador"] as const,
      submit: "Quiero que me contacten",
      successMessage: "Gracias. Te contactaremos pronto.",
    },
  },

  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        q: "¿La app tiene costo?",
        a: "No. La descarga y el uso básico son gratuitos.",
      },
      {
        q: "¿En qué ciudades está disponible?",
        a: "Por ahora nos enfocamos en CDMX y área metropolitana. Pronto más ciudades.",
      },
      {
        q: "¿Cómo publico mi evento o clase?",
        a: "Regístrate como academia, maestro u organizador desde la app o contáctanos por el formulario.",
      },
      {
        q: "¿Cómo moderan el contenido?",
        a: "Revisamos eventos y perfiles para mantener información verídica y respetuosa.",
      },
      {
        q: "¿Puedo desactivar notificaciones?",
        a: "Sí. Puedes elegir qué notificaciones recibir o desactivarlas por completo.",
      },
      {
        q: "¿Mis datos están seguros?",
        a: "Sí. No vendemos tus datos. Revisa nuestra política de privacidad.",
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
    tagline: "La plataforma donde la comunidad del baile se encuentra. Descubre eventos, clases y perfiles en un solo lugar.",
    ctaPro: "Publica clases y eventos, recibe leads y crece tu comunidad desde un solo lugar.",
  },
} as const;

export type LandingContent = typeof landingContent;
