export const STORAGE_KEYS = {
  usuarios: 'usuariosITT',
  usuarioActual: 'usuarioActualITT',
  incidencias: 'incidenciasITT',
  notificaciones: 'notificacionesITT',
}

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  TECNICO: 'Técnico',
  ALUMNO: 'Alumno',
  DOCENTE: 'Docente',
}

export const ESTADOS_INCIDENCIA = [
  'Pendiente',
  'En proceso',
  'En revisión',
  'Resuelto',
  'Cerrado',
  'Cancelado',
]

export const TIPOS_FALLA = [
  'Proyector',
  'Mobiliario',
  'Instalación eléctrica',
  'Sanitarios',
  'Aula o laboratorio',
  'Red o conectividad',
  'Climatización',
  'Otro',
]

export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

export const EDIFICIO_T = 'T - Edificio de Sistemas Computacionales y TICs'

export const EDIFICIOS_ITT = [
  'A - Edificio administrativo',
  'A1 - Sanitarios alumnos',
  'B - Centro de información',
  'B1 - Centro de cómputo',
  'B2 - Aulas de ingeniería industrial',
  'B3 - Posgrado e investigación',
  'B4 - Laboratorio de ingeniería ambiental',
  'B5 - Laboratorio de ingeniería ambiental',
  'C - Unidad de apoyo tutorial',
  'C1 - Centro académico y orientación educativa',
  'C2 - División de estudios profesionales',
  'C3 - Centro de enseñanza de lenguas extranjeras',
  'D - Jefatura y cubículos de ingeniería química',
  'D1 - Jefatura y laboratorio de ingeniería electrónica',
  'D3 - Ingeniería mecatrónica',
  'E - Estacionamiento',
  'F - Aulas de sistemas computacionales',
  'G - Sindicato',
  'H - Cafetería',
  'K - Gestión tecnológica y vinculación',
  EDIFICIO_T,
  'G1 - Gradas, vestidores y actividades extraescolares',
  'G2 - Actividades extraescolares',
]

export const clasesEstado = {
  Pendiente: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  'En proceso': 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  'En revisión': 'border-violet-400/40 bg-violet-400/10 text-violet-200',
  Resuelto: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  Cerrado: 'border-slate-400/40 bg-slate-400/10 text-slate-200',
  Cancelado: 'border-red-400/40 bg-red-400/10 text-red-200',
}

export const clasesPrioridad = {
  Baja: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  Media: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  Alta: 'border-orange-400/40 bg-orange-400/10 text-orange-200',
  Crítica: 'border-red-400/40 bg-red-400/10 text-red-200',
}

const TRANSICIONES_ESTADO = {
  Pendiente: ['En proceso', 'Cancelado'],
  'En proceso': ['En revisión', 'Resuelto', 'Cancelado'],
  'En revisión': ['En proceso', 'Resuelto', 'Cancelado'],
  Resuelto: ['Cerrado', 'En revisión'],
  Cerrado: [],
  Cancelado: [],
}

const DEMO_USERS = [
  {
    id: 1,
    nombre: 'Administrador ITT',
    correo: 'admin@ittoluca.edu.mx',
    password: 'admin123',
    rol: ROLES.ADMINISTRADOR,
    identificador: 'ADM001',
  },
  {
    id: 2,
    nombre: 'Técnico de Mantenimiento',
    correo: 'tecnico@ittoluca.edu.mx',
    password: 'tecnico123',
    rol: ROLES.TECNICO,
    identificador: 'TEC001',
  },
  {
    id: 3,
    nombre: 'Alumno Demo',
    correo: 'alumno@ittoluca.edu.mx',
    password: 'alumno123',
    rol: ROLES.ALUMNO,
    identificador: '23280182',
  },
  {
    id: 4,
    nombre: 'Docente Demo',
    correo: 'docente@ittoluca.edu.mx',
    password: 'docente123',
    rol: ROLES.DOCENTE,
    identificador: 'DOC001',
  },
]

function fechaDemo(diasAtras, horas = 9, minutos = 30) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - diasAtras)
  fecha.setHours(horas, minutos, 0, 0)

  return {
    fechaISO: fecha.toISOString(),
    fecha: formatearFecha(fecha),
  }
}

function crearHistorialDemo(items) {
  return items.map((item) => ({
    fecha: item.fecha,
    fechaISO: item.fechaISO,
    responsable: item.responsable,
    estado: item.estado,
    comentario: item.comentario,
  }))
}

function buildDemoIncidencias() {
  const f1 = fechaDemo(8, 8, 20)
  const f2 = fechaDemo(7, 10, 10)
  const f3 = fechaDemo(5, 11, 45)
  const f4 = fechaDemo(4, 13, 15)
  const f5 = fechaDemo(3, 9, 5)
  const f6 = fechaDemo(2, 15, 35)
  const f7 = fechaDemo(1, 12, 30)

  return [
    {
      id: 'INC-DEMO-001',
      tipo: 'Proyector',
      prioridad: 'Alta',
      edificio: 'F - Aulas de sistemas computacionales',
      aula: 'Aula F-12',
      descripcion:
        'El proyector enciende, pero no muestra imagen desde el equipo del aula.',
      evidencia: 'Nota: se probó con otro cable HDMI y continúa la falla.',
      estado: 'Pendiente',
      fecha: f1.fecha,
      fechaISO: f1.fechaISO,
      reportadoPor: 'alumno@ittoluca.edu.mx',
      nombreReportante: 'Alumno Demo',
      tecnicoAsignado: '',
      tecnicoCorreo: '',
      historial: crearHistorialDemo([
        {
          ...f1,
          estado: 'Pendiente',
          responsable: 'Alumno Demo',
          comentario: 'Incidencia registrada por el usuario.',
        },
      ]),
    },
    {
      id: 'INC-DEMO-002',
      tipo: 'Instalación eléctrica',
      prioridad: 'Crítica',
      edificio: 'B1 - Centro de cómputo',
      aula: 'Laboratorio B1-03',
      descripcion:
        'Un contacto eléctrico genera chispas al conectar reguladores del laboratorio.',
      evidencia: 'Señalamiento colocado junto al contacto dañado.',
      estado: 'En proceso',
      fecha: f2.fecha,
      fechaISO: f2.fechaISO,
      reportadoPor: 'docente@ittoluca.edu.mx',
      nombreReportante: 'Docente Demo',
      tecnicoAsignado: 'Técnico de Mantenimiento',
      tecnicoCorreo: 'tecnico@ittoluca.edu.mx',
      historial: crearHistorialDemo([
        {
          ...f2,
          estado: 'Pendiente',
          responsable: 'Docente Demo',
          comentario: 'Incidencia registrada por el usuario.',
        },
        {
          ...f3,
          estado: 'En proceso',
          responsable: 'Administrador ITT',
          comentario: 'Se asignó técnico para revisión eléctrica preventiva.',
        },
      ]),
    },
    {
      id: 'INC-DEMO-003',
      tipo: 'Mobiliario',
      prioridad: 'Media',
      edificio: 'B2 - Aulas de ingeniería industrial',
      aula: 'Aula B2-08',
      descripcion:
        'Tres sillas presentan respaldo flojo y podrían causar accidentes durante clase.',
      evidencia: 'Nota: mobiliario separado al fondo del aula.',
      estado: 'En revisión',
      fecha: f3.fecha,
      fechaISO: f3.fechaISO,
      reportadoPor: 'alumno@ittoluca.edu.mx',
      nombreReportante: 'Alumno Demo',
      tecnicoAsignado: 'Técnico de Mantenimiento',
      tecnicoCorreo: 'tecnico@ittoluca.edu.mx',
      historial: crearHistorialDemo([
        {
          ...f3,
          estado: 'Pendiente',
          responsable: 'Alumno Demo',
          comentario: 'Incidencia registrada por el usuario.',
        },
        {
          ...f4,
          estado: 'En proceso',
          responsable: 'Administrador ITT',
          comentario: 'Se canalizó al técnico de mantenimiento.',
        },
        {
          ...f5,
          estado: 'En revisión',
          responsable: 'Técnico de Mantenimiento',
          comentario: 'Se repararon dos sillas y queda una pendiente por refacción.',
        },
      ]),
    },
    {
      id: 'INC-DEMO-004',
      tipo: 'Sanitarios',
      prioridad: 'Media',
      edificio: 'A1 - Sanitarios alumnos',
      aula: 'Sanitarios planta baja',
      descripcion:
        'Fuga constante de agua en lavabo del área de sanitarios de alumnos.',
      evidencia: 'Reporte verbal de varios alumnos durante el turno matutino.',
      estado: 'Resuelto',
      fecha: f4.fecha,
      fechaISO: f4.fechaISO,
      reportadoPor: 'docente@ittoluca.edu.mx',
      nombreReportante: 'Docente Demo',
      tecnicoAsignado: 'Técnico de Mantenimiento',
      tecnicoCorreo: 'tecnico@ittoluca.edu.mx',
      historial: crearHistorialDemo([
        {
          ...f4,
          estado: 'Pendiente',
          responsable: 'Docente Demo',
          comentario: 'Incidencia registrada por el usuario.',
        },
        {
          ...f5,
          estado: 'En proceso',
          responsable: 'Administrador ITT',
          comentario: 'Se asignó técnico para revisión de plomería.',
        },
        {
          ...f6,
          estado: 'Resuelto',
          responsable: 'Técnico de Mantenimiento',
          comentario: 'Se sustituyó empaque y se verificó que no hubiera fuga.',
        },
      ]),
    },
    {
      id: 'INC-DEMO-005',
      tipo: 'Red o conectividad',
      prioridad: 'Alta',
      edificio: EDIFICIO_T,
      aula: 'Laboratorio de redes',
      descripcion:
        'La conexión de red es intermitente en las estaciones del laboratorio.',
      evidencia: 'Nota: falla reportada durante práctica de redes.',
      estado: 'Cerrado',
      fecha: f5.fecha,
      fechaISO: f5.fechaISO,
      reportadoPor: 'alumno@ittoluca.edu.mx',
      nombreReportante: 'Alumno Demo',
      tecnicoAsignado: 'Técnico de Mantenimiento',
      tecnicoCorreo: 'tecnico@ittoluca.edu.mx',
      historial: crearHistorialDemo([
        {
          ...f5,
          estado: 'Pendiente',
          responsable: 'Alumno Demo',
          comentario: 'Incidencia registrada por el usuario.',
        },
        {
          ...f6,
          estado: 'Resuelto',
          responsable: 'Técnico de Mantenimiento',
          comentario: 'Se reemplazó patch cord dañado y se validó conectividad.',
        },
        {
          ...f7,
          estado: 'Cerrado',
          responsable: 'Administrador ITT',
          comentario: 'Cierre administrativo después de confirmar solución.',
        },
      ]),
    },
    {
      id: 'INC-DEMO-006',
      tipo: 'Otro',
      prioridad: 'Baja',
      edificio: 'H - Cafetería',
      aula: 'Acceso principal',
      descripcion:
        'Se reportó señalética dañada, pero el área confirmó que ya estaba programada su reposición.',
      evidencia: 'Sin evidencia adicional.',
      estado: 'Cancelado',
      fecha: f6.fecha,
      fechaISO: f6.fechaISO,
      reportadoPor: 'docente@ittoluca.edu.mx',
      nombreReportante: 'Docente Demo',
      tecnicoAsignado: '',
      tecnicoCorreo: '',
      historial: crearHistorialDemo([
        {
          ...f6,
          estado: 'Pendiente',
          responsable: 'Docente Demo',
          comentario: 'Incidencia registrada por el usuario.',
        },
        {
          ...f7,
          estado: 'Cancelado',
          responsable: 'Administrador ITT',
          comentario:
            'Se canceló porque la reposición ya estaba contemplada en mantenimiento preventivo.',
        },
      ]),
    },
  ]
}

function buildDemoNotificaciones() {
  const f1 = fechaDemo(2, 16, 20)
  const f2 = fechaDemo(1, 9, 50)
  const f3 = fechaDemo(0, 8, 40)

  return [
    {
      id: 'NOT-DEMO-001',
      titulo: 'Nueva incidencia registrada',
      mensaje: 'Se registró la incidencia INC-DEMO-001 para revisión.',
      fecha: f1.fecha,
      fechaISO: f1.fechaISO,
      leida: false,
      destinatarioCorreo: 'admin@ittoluca.edu.mx',
      incidenciaId: 'INC-DEMO-001',
      tipo: 'registro',
    },
    {
      id: 'NOT-DEMO-002',
      titulo: 'Incidencia asignada',
      mensaje: 'Se te asignó la incidencia INC-DEMO-003.',
      fecha: f2.fecha,
      fechaISO: f2.fechaISO,
      leida: false,
      destinatarioCorreo: 'tecnico@ittoluca.edu.mx',
      incidenciaId: 'INC-DEMO-003',
      tipo: 'asignacion',
    },
    {
      id: 'NOT-DEMO-003',
      titulo: 'Incidencia resuelta',
      mensaje: 'La incidencia INC-DEMO-004 fue marcada como resuelta.',
      fecha: f3.fecha,
      fechaISO: f3.fechaISO,
      leida: false,
      destinatarioCorreo: 'docente@ittoluca.edu.mx',
      incidenciaId: 'INC-DEMO-004',
      tipo: 'estado',
    },
  ]
}

export function formatearFecha(fecha = new Date()) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

export function emitirCambioDatos() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('itt-storage-updated'))
  }
}

function leerStorage(clave, fallback = []) {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? JSON.parse(valor) : fallback
  } catch {
    return fallback
  }
}

function guardarStorage(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
  emitirCambioDatos()
}

function corregirTexto(texto) {
  if (typeof texto !== 'string') return texto

  return texto
    .replaceAll('TÃ©cnico', 'Técnico')
    .replaceAll('tÃ©cnico', 'técnico')
    .replaceAll('En revisiÃ³n', 'En revisión')
    .replaceAll('InstalaciÃ³n', 'Instalación')
    .replaceAll('elÃ©ctrica', 'eléctrica')
    .replaceAll('informaciÃ³n', 'información')
    .replaceAll('cÃ³mputo', 'cómputo')
    .replaceAll('ingenierÃ­a', 'ingeniería')
    .replaceAll('investigaciÃ³n', 'investigación')
    .replaceAll('DivisiÃ³n', 'División')
    .replaceAll('GestiÃ³n', 'Gestión')
    .replaceAll('ubicaciÃ³n', 'ubicación')
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã±', 'ñ')
    .replaceAll('Ã', 'Á')
    .replaceAll('Ã‰', 'É')
    .replaceAll('Ã', 'Í')
    .replaceAll('Ã“', 'Ó')
    .replaceAll('Ãš', 'Ú')
    .replaceAll('Ã‘', 'Ñ')
    .replaceAll('CrÃ­tica', 'Crítica')
    .replaceAll('sesiÃ³n', 'sesión')
    .replaceAll('contraseÃ±a', 'contraseña')
}

function normalizarRol(rol) {
  const rolCorregido = corregirTexto(rol)
  if (rolCorregido === 'Tecnico') return ROLES.TECNICO
  return Object.values(ROLES).includes(rolCorregido) ? rolCorregido : rol
}

export function normalizarUsuario(usuario) {
  return {
    ...usuario,
    nombre: corregirTexto(usuario.nombre),
    correo: usuario.correo?.trim().toLowerCase(),
    rol: normalizarRol(usuario.rol),
  }
}

function normalizarHistorial(item) {
  return {
    estado: corregirTexto(item.estado || 'Pendiente'),
    comentario: corregirTexto(item.comentario || 'Sin comentario registrado.'),
    fecha: item.fecha || formatearFecha(),
    fechaISO: item.fechaISO || new Date().toISOString(),
    responsable: corregirTexto(item.responsable || 'Sistema'),
  }
}

function normalizarEdificio(edificio) {
  const valor = corregirTexto(edificio || 'Sin dato')

  if (
    valor.startsWith('T - Laboratorio de redes') ||
    valor.startsWith('T - Edificio de Sistemas Computacionales')
  ) {
    return EDIFICIO_T
  }

  return valor
}

export function normalizarIncidencia(incidencia) {
  const usuarios = getUsuarios()
  const tecnico = usuarios.find((u) => u.nombre === corregirTexto(incidencia.tecnicoAsignado))

  return {
    ...incidencia,
    id: String(incidencia.id),
    tipo: corregirTexto(incidencia.tipo || 'Otro'),
    prioridad: corregirTexto(incidencia.prioridad || 'Media'),
    edificio: normalizarEdificio(incidencia.edificio),
    aula: corregirTexto(incidencia.aula || 'Sin dato'),
    descripcion: corregirTexto(incidencia.descripcion || ''),
    evidencia: corregirTexto(incidencia.evidencia || ''),
    estado: corregirTexto(incidencia.estado || 'Pendiente'),
    fecha: incidencia.fecha || formatearFecha(),
    fechaISO: incidencia.fechaISO || new Date().toISOString(),
    reportadoPor: incidencia.reportadoPor,
    nombreReportante: corregirTexto(incidencia.nombreReportante || incidencia.reportadoPor),
    tecnicoAsignado: corregirTexto(incidencia.tecnicoAsignado || ''),
    tecnicoCorreo: incidencia.tecnicoCorreo || tecnico?.correo || '',
    historial: Array.isArray(incidencia.historial)
      ? incidencia.historial.map(normalizarHistorial)
      : [],
  }
}

export function getUsuarios() {
  return leerStorage(STORAGE_KEYS.usuarios, []).map(normalizarUsuario)
}

export function guardarUsuarios(usuarios) {
  guardarStorage(STORAGE_KEYS.usuarios, usuarios.map(normalizarUsuario))
}

export function getIncidencias() {
  return leerStorage(STORAGE_KEYS.incidencias, []).map(normalizarIncidencia)
}

export function guardarIncidencias(incidencias) {
  guardarStorage(STORAGE_KEYS.incidencias, incidencias.map(normalizarIncidencia))
}

export function getNotificaciones() {
  return leerStorage(STORAGE_KEYS.notificaciones, []).map((notificacion) => ({
    ...notificacion,
    titulo: corregirTexto(notificacion.titulo),
    mensaje: corregirTexto(notificacion.mensaje),
    fecha: notificacion.fecha || formatearFecha(),
    fechaISO: notificacion.fechaISO || new Date().toISOString(),
    leida: Boolean(notificacion.leida),
  }))
}

export function guardarNotificaciones(notificaciones) {
  guardarStorage(STORAGE_KEYS.notificaciones, notificaciones)
}

export function ensureDemoData() {
  const usuariosGuardados = leerStorage(STORAGE_KEYS.usuarios, null)
  const incidenciasGuardadas = leerStorage(STORAGE_KEYS.incidencias, null)
  const notificacionesGuardadas = leerStorage(STORAGE_KEYS.notificaciones, null)

  if (!usuariosGuardados || usuariosGuardados.length === 0) {
    guardarUsuarios(DEMO_USERS)
  } else {
    const normalizados = usuariosGuardados.map(normalizarUsuario)
    const correos = new Set(normalizados.map((usuario) => usuario.correo))
    const faltantes = DEMO_USERS.filter((usuario) => !correos.has(usuario.correo))
    guardarUsuarios([...normalizados, ...faltantes])
  }

  if (!incidenciasGuardadas || incidenciasGuardadas.length === 0) {
    guardarIncidencias(buildDemoIncidencias())
  } else {
    guardarIncidencias(incidenciasGuardadas.map(normalizarIncidencia))
  }

  if (!notificacionesGuardadas || notificacionesGuardadas.length === 0) {
    guardarNotificaciones(buildDemoNotificaciones())
  } else {
    guardarNotificaciones(notificacionesGuardadas)
  }
}

export function reiniciarDatosDemo() {
  guardarUsuarios(DEMO_USERS)
  guardarIncidencias(buildDemoIncidencias())
  guardarNotificaciones(buildDemoNotificaciones())
}

export function limpiarIncidenciasDemo() {
  guardarIncidencias([])
  guardarNotificaciones([])
}

export function getUsuarioActualGuardado() {
  const usuario = leerStorage(STORAGE_KEYS.usuarioActual, null)
  return usuario ? normalizarUsuario(usuario) : null
}

export function guardarUsuarioActual(usuario) {
  localStorage.setItem(STORAGE_KEYS.usuarioActual, JSON.stringify(normalizarUsuario(usuario)))
}

export function limpiarUsuarioActual() {
  localStorage.removeItem(STORAGE_KEYS.usuarioActual)
}

export function puedeCrearIncidencia(usuario) {
  return [ROLES.ALUMNO, ROLES.DOCENTE].includes(usuario?.rol)
}

export function puedeVerReportes(usuario) {
  return usuario?.rol === ROLES.ADMINISTRADOR
}

export function puedeVerAdministracion(usuario) {
  return usuario?.rol === ROLES.ADMINISTRADOR
}

export function esTecnicoAsignado(incidencia, usuario) {
  return (
    usuario?.rol === ROLES.TECNICO &&
    (incidencia.tecnicoCorreo === usuario.correo ||
      incidencia.tecnicoAsignado === usuario.nombre)
  )
}

export function puedeGestionarIncidencia(incidencia, usuario) {
  return usuario?.rol === ROLES.ADMINISTRADOR || esTecnicoAsignado(incidencia, usuario)
}

export function puedeAsignarTecnico(usuario) {
  return usuario?.rol === ROLES.ADMINISTRADOR
}

export function getIncidenciasVisibles(incidencias, usuario) {
  if (!usuario) return []

  if (usuario.rol === ROLES.ADMINISTRADOR) {
    return incidencias
  }

  if (usuario.rol === ROLES.TECNICO) {
    return incidencias.filter((incidencia) => esTecnicoAsignado(incidencia, usuario))
  }

  return incidencias.filter((incidencia) => incidencia.reportadoPor === usuario.correo)
}

export function getEstadosPermitidos(estadoActual, usuario) {
  if (usuario?.rol === ROLES.ADMINISTRADOR) {
    return ESTADOS_INCIDENCIA
  }

  const siguientes = TRANSICIONES_ESTADO[estadoActual] || []
  return [estadoActual, ...siguientes].filter(Boolean)
}

export function esCambioEstadoPermitido(estadoActual, nuevoEstado, usuario) {
  return getEstadosPermitidos(estadoActual, usuario).includes(nuevoEstado)
}

export function ordenarPorFechaDesc(items) {
  return [...items].sort((a, b) => {
    const fechaA = Date.parse(a.fechaISO || a.fecha) || 0
    const fechaB = Date.parse(b.fechaISO || b.fecha) || 0
    return fechaB - fechaA
  })
}

export function normalizarParaComparacion(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function obtenerTokensClave(texto = '') {
  const palabrasIgnoradas = new Set([
    'con',
    'del',
    'desde',
    'donde',
    'el',
    'en',
    'la',
    'las',
    'los',
    'para',
    'por',
    'que',
    'se',
    'sin',
    'un',
    'una',
    'y',
  ])

  return normalizarParaComparacion(texto)
    .split(' ')
    .filter((palabra) => palabra.length > 2 && !palabrasIgnoradas.has(palabra))
}

function calcularSimilitudTexto(textoA = '', textoB = '') {
  const tokensA = new Set(obtenerTokensClave(textoA))
  const tokensB = new Set(obtenerTokensClave(textoB))

  if (tokensA.size === 0 || tokensB.size === 0) return 0

  const interseccion = [...tokensA].filter((token) => tokensB.has(token)).length
  const base = Math.min(tokensA.size, tokensB.size)

  return interseccion / base
}

function estaActiva(incidencia) {
  return ['Pendiente', 'En proceso', 'En revisión'].includes(incidencia.estado)
}

function posibleCoincidenciaDuplicada(base, incidencia) {
  const mismoTipo =
    normalizarParaComparacion(base.tipo) === normalizarParaComparacion(incidencia.tipo)
  const mismoEdificio =
    normalizarParaComparacion(base.edificio) ===
    normalizarParaComparacion(incidencia.edificio)
  const mismaAula =
    normalizarParaComparacion(base.aula) === normalizarParaComparacion(incidencia.aula)

  if (!mismoTipo || !mismoEdificio) return false

  const evidenciaBase = normalizarParaComparacion(base.evidencia)
  const evidenciaIncidencia = normalizarParaComparacion(incidencia.evidencia)
  const evidenciaIgual =
    evidenciaBase.length >= 4 &&
    evidenciaIncidencia.length >= 4 &&
    evidenciaBase === evidenciaIncidencia

  const descripcionParecida =
    mismaAula &&
    calcularSimilitudTexto(base.descripcion, incidencia.descripcion) >= 0.58

  return evidenciaIgual || (mismaAula && descripcionParecida)
}

export function detectarIncidenciasDuplicadas(base, incidencias, opciones = {}) {
  const { excluirId = '', incluirCerradas = false } = opciones

  if (!base?.tipo || !base?.edificio || !base?.aula || !base?.descripcion) {
    return []
  }

  return ordenarPorFechaDesc(incidencias).filter((incidencia) => {
    if (incidencia.id === excluirId) return false
    if (!incluirCerradas && !estaActiva(incidencia)) return false
    return posibleCoincidenciaDuplicada(base, incidencia)
  })
}

export function obtenerIdsDuplicadosRepetidos(incidencias) {
  const repetidas = new Set()
  const ordenadas = ordenarPorFechaDesc(incidencias)

  ordenadas.forEach((incidencia, index) => {
    if (repetidas.has(incidencia.id)) return

    const duplicadas = ordenadas
      .slice(index + 1)
      .filter((candidata) => posibleCoincidenciaDuplicada(incidencia, candidata))

    if (duplicadas.length === 0) return

    duplicadas.forEach((duplicada) => repetidas.add(duplicada.id))
  })

  return [...repetidas]
}

export function crearNotificaciones(destinatarios, datos) {
  const correos = [...new Set(destinatarios.filter(Boolean))]
  if (correos.length === 0) return []

  const ahora = new Date()
  const nuevas = correos.map((correo, index) => ({
    id: `NOT-${Date.now()}-${index}`,
    titulo: datos.titulo,
    mensaje: datos.mensaje,
    fecha: formatearFecha(ahora),
    fechaISO: ahora.toISOString(),
    leida: false,
    destinatarioCorreo: correo,
    incidenciaId: datos.incidenciaId || '',
    tipo: datos.tipo || 'general',
  }))

  guardarNotificaciones([...nuevas, ...getNotificaciones()])
  return nuevas
}

export function getCorreosAdministradores() {
  return getUsuarios()
    .filter((usuario) => usuario.rol === ROLES.ADMINISTRADOR)
    .map((usuario) => usuario.correo)
}

export function getDestinatariosIncidencia(incidencia, incluirAdmins = true) {
  const destinatarios = [incidencia.reportadoPor, incidencia.tecnicoCorreo]
  if (incluirAdmins) {
    destinatarios.push(...getCorreosAdministradores())
  }
  return [...new Set(destinatarios.filter(Boolean))]
}

export function marcarNotificacionLeida(id) {
  const actualizadas = getNotificaciones().map((notificacion) =>
    notificacion.id === id ? { ...notificacion, leida: true } : notificacion,
  )
  guardarNotificaciones(actualizadas)
  return actualizadas
}

export function marcarTodasNotificacionesLeidas(correo) {
  const actualizadas = getNotificaciones().map((notificacion) =>
    notificacion.destinatarioCorreo === correo
      ? { ...notificacion, leida: true }
      : notificacion,
  )
  guardarNotificaciones(actualizadas)
  return actualizadas
}

export function contarPorCampo(items, campo) {
  return items.reduce((conteo, item) => {
    const valor = item[campo] || 'Sin dato'
    conteo[valor] = (conteo[valor] || 0) + 1
    return conteo
  }, {})
}

export function convertirConteoGrafica(conteo) {
  return Object.entries(conteo).map(([nombre, total]) => ({
    nombre,
    total,
  }))
}
