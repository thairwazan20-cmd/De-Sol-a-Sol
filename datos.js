// ─────────────────────────────────────────────────────────────
// DATOS DEL NEGOCIO: todo lo que cambia con frecuencia está aquí.
// Después de editar, ejecuta:  npm run build
// ─────────────────────────────────────────────────────────────
module.exports = {
  dominio: 'https://desolasolbungalows.com',

  // Número de WhatsApp sin "+" ni espacios (todos los botones de reserva lo usan).
  whatsapp: '51968783431',

  telefonos: [
    { texto: '+51 968 783 431', enlace: '+51968783431' },
    { texto: '+51 997 476 516', enlace: '+51997476516' },
  ],
  correo: 'hoteldesolasolbungalows@gmail.com',
  facebook: 'https://www.facebook.com/hoteldesolasol2020',
  instagram: 'https://www.instagram.com/bungalowsdesolasol/',

  // Cuando tengan el Libro de Reclamaciones virtual, pega aquí su enlace
  // y aparecerá solo en el pie de página. Ejemplo: 'https://...'
  libroReclamaciones: null,

  // Precio por noche en soles. null = muestra "Consultar precio".
  precios: {
    familiar: null, // La web anterior decía S/350, S/420 y S/450: pon aquí el correcto.
    vista: 180,
    grupal: 210,
    triple: 210,
    matrimonial: 140,
    doble: 140,
    terraza: 140,
  },
};
