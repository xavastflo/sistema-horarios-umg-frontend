import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import api    from '../../api/axios'

/**
 * SeccionForm
 *
 * Formulario de creación de secciones.
 * Tras la reingeniería, el usuario selecciona:
 *   1. Carrera
 *   2. Jornada (filtrada por la carrera elegida)
 *   → id_carrera_jornada (enviado al backend)
 *   3. Curso
 *   4. Período académico
 *   5. Número de sección (letra/código)
 *
 * Props:
 *   cursos     {array}    Cursos activos
 *   periodos   {array}    Períodos activos
 *   carreras   {array}    Carreras activas (nuevo)
 *   onGuardar  {function} (datos) => Promise
 *   onCancelar {function}
 *   errores422 {object}
 */
export default function SeccionForm({
  cursos     = [],
  periodos   = [],
  carreras   = [],
  onGuardar,
  onCancelar,
  errores422 = {},
}) {
  const [form, setForm] = useState({
    id_carrera:           '',
    id_carrera_jornada:   '',
    id_curso:             '',
    id_periodo_academico: '',
    numero_seccion:       '',
  })
  const [guardando,       setGuardando]       = useState(false)
  const [jornadasCarrera, setJornadasCarrera] = useState([])
  const [cursosFiltrados, setCursosFiltrados] = useState([])
  const [cargandoJorn,    setCargandoJorn]    = useState(false)

  // Reset al montar
  useEffect(() => {
    setForm({ id_carrera: '', id_carrera_jornada: '', id_curso: '', id_periodo_academico: '', numero_seccion: '' })
  }, []) // eslint-disable-line

  // Al cambiar carrera O período: cargar jornadas y cursos filtrados por período.
  // Sin carrera: limpiar todo.
  // Con carrera pero sin período: cargar jornadas, pero NO mostrar cursos todavía.
  // Con carrera + período: cargar cursos filtrados por ciclosPermitidos() del período.
  useEffect(() => {
    if (!form.id_carrera) {
      setJornadasCarrera([])
      setCursosFiltrados([])
      return
    }
    setCargandoJorn(true)
    Promise.all([
      api.get(`/carreras/${form.id_carrera}`),
      api.get('/pensums', { params: { id_carrera: form.id_carrera, estado: 'activo' } }),
    ])
      .then(([rCarrera, rPensums]) => {
        setJornadasCarrera(rCarrera.data.jornadas_activas ?? [])

        // Sin período seleccionado: no mostrar cursos (evita mezclar todos los ciclos)
        if (!form.id_periodo_academico) {
          setCursosFiltrados([])
          return
        }

        // Extraer IDs únicos de cursos de todos los pensums de la carrera
        const pensums   = Array.isArray(rPensums.data) ? rPensums.data : []
        const idPensums = pensums.map(p => p.id_pensum)
        if (idPensums.length === 0) { setCursosFiltrados([]); return }

        // Cargar cursos de todos los pensums en paralelo,
        // pasando id_periodo_academico para que el backend filtre por ciclosPermitidos()
        Promise.all(idPensums.map(id =>
          api.get(`/pensums/${id}/cursos`, {
            params: { id_periodo_academico: form.id_periodo_academico },
          })
        ))
          .then(responses => {
            const idsCursos = new Set(
              responses.flatMap(r =>
                (Array.isArray(r.data) ? r.data : (r.data?.cursos ?? []))
                .map(pc => pc.id_curso ?? pc.curso?.id_curso)
                .filter(Boolean)
              )
            )
            setCursosFiltrados(
              idsCursos.size > 0
                ? cursos.filter(c => idsCursos.has(c.id_curso))
                : []
            )
          })
          .catch(() => setCursosFiltrados([]))
      })
      .catch(() => { setJornadasCarrera([]); setCursosFiltrados([]) })
      .finally(() => setCargandoJorn(false))
  }, [form.id_carrera, form.id_periodo_academico]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    // numero_seccion: solo letras, forzar mayúsculas
    const valorFinal = name === 'numero_seccion'
      ? value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '').toUpperCase()
      : value
    setForm(f => ({
      ...f,
      [name]: valorFinal,
      // Si cambia la carrera, resetear jornada y curso
      ...(name === 'id_carrera' ? { id_carrera_jornada: '', id_curso: '' } : {}),
      // Si cambia el período, resetear curso (los ciclos disponibles cambian)
      ...(name === 'id_periodo_academico' ? { id_curso: '' } : {}),
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    await onGuardar({
      id_carrera_jornada:   Number(form.id_carrera_jornada),
      id_curso:             Number(form.id_curso),
      id_periodo_academico: Number(form.id_periodo_academico),
      numero_seccion:       form.numero_seccion.trim().toUpperCase(),
    })
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* ── 1. Carrera ─────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_carrera">
          Carrera <span style={es.req}>*</span>
        </label>
        <select
          id="id_carrera" name="id_carrera"
          value={form.id_carrera} onChange={onChange}
          disabled={guardando}
          style={es.input}
        >
          <option value="">— Selecciona una carrera —</option>
          {carreras.map(c => (
            <option key={c.id_carrera} value={c.id_carrera}>
              {c.nombre_carrera}
            </option>
          ))}
        </select>
      </div>

      {/* ── 2. Jornada ─────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_carrera_jornada">
          Jornada <span style={es.req}>*</span>
        </label>
        <select
          id="id_carrera_jornada" name="id_carrera_jornada"
          value={form.id_carrera_jornada} onChange={onChange}
          disabled={guardando || !form.id_carrera || cargandoJorn}
          style={{ ...es.input, ...(errores422.id_carrera_jornada ? es.inputErr : {}) }}
        >
          <option value="">
            {!form.id_carrera     ? '— Selecciona primero una carrera —'
              : cargandoJorn      ? 'Cargando jornadas…'
              : jornadasCarrera.length === 0 ? 'Sin jornadas activas'
              : '— Selecciona la jornada —'}
          </option>
          {jornadasCarrera.map(j => {
              // La relación BelongsToMany expone id_carrera_jornada en j.pivot.
              // Fallback a j.id_carrera_jornada si el endpoint ya lo aplanó.
              const idCj = j.pivot?.id_carrera_jornada ?? j.id_carrera_jornada
              return (
                <option key={idCj} value={idCj}>
                  {j.nombre_jornada}
                </option>
              )
            })}
        </select>
        {errores422.id_carrera_jornada && (
          <span style={es.errorMsg}>{errores422.id_carrera_jornada[0]}</span>
        )}
        <span style={es.hint}>
          Permite crear "Sección A Matutina" y "Sección A Vespertina" de forma independiente.
        </span>
      </div>

      {/* ── 3. Período ─────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_periodo_academico">
          Período académico <span style={es.req}>*</span>
        </label>
        <select
          id="id_periodo_academico" name="id_periodo_academico"
          value={form.id_periodo_academico} onChange={onChange}
          disabled={guardando}
          style={{ ...es.input, ...(errores422.id_periodo_academico ? es.inputErr : {}) }}
        >
          <option value="">— Selecciona un período —</option>
          {periodos.map(p => (
            <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
              {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''}{p.es_vigente ? ' ★' : ''}
            </option>
          ))}
        </select>
        {errores422.id_periodo_academico && (
          <span style={es.errorMsg}>{errores422.id_periodo_academico[0]}</span>
        )}
      </div>

      {/* ── 4. Curso ───────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_curso">
          Curso <span style={es.req}>*</span>
        </label>
        <select
          id="id_curso" name="id_curso"
          value={form.id_curso} onChange={onChange}
          disabled={guardando || !form.id_carrera || !form.id_periodo_academico}
          style={{ ...es.input, ...(errores422.id_curso ? es.inputErr : {}) }}
        >
          <option value="">
            {!form.id_carrera
              ? '— Selecciona primero una carrera —'
              : !form.id_periodo_academico
                ? '— Selecciona primero un período académico —'
                : '— Selecciona un curso —'}
          </option>
          {[...cursosFiltrados].sort((a, b) => {
              const nA = parseInt(a.codigo_curso, 10)
              const nB = parseInt(b.codigo_curso, 10)
              if (!isNaN(nA) && !isNaN(nB)) return nA - nB
              return a.codigo_curso.localeCompare(b.codigo_curso)
            }).map(c => (
            <option key={c.id_curso} value={c.id_curso}>
              [{c.codigo_curso}] {c.nombre_curso}
            </option>
          ))}
        </select>
        {errores422.id_curso && (
          <span style={es.errorMsg}>{errores422.id_curso[0]}</span>
        )}
      </div>

      {/* ── 5. Número / letra de sección ───────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="numero_seccion">
          Letra / código de sección <span style={es.req}>*</span>
        </label>
        <input
          id="numero_seccion" name="numero_seccion"
          type="text" maxLength={10}
          value={form.numero_seccion} onChange={onChange}
          placeholder="Ej: A, B, C"
          disabled={guardando}
          style={{
            ...es.input,
            fontFamily: 'var(--font-mono)', letterSpacing: '.06em',
            ...(errores422.numero_seccion ? es.inputErr : {}),
          }}
        />
        {errores422.numero_seccion && (
          <span style={es.errorMsg}>{errores422.numero_seccion[0]}</span>
        )}
        <span style={es.hint}>
          Solo letras (A, B, C…). Se convierte a mayúsculas automáticamente.
          Único por jornada + curso + período. Puede repetirse en otras jornadas.
        </span>
      </div>

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variante="primary" type="submit" cargando={guardando}
          disabled={
            !form.id_carrera_jornada ||
            !form.id_curso           ||
            !form.id_periodo_academico ||
            !form.numero_seccion.trim() ||
            guardando
          }
        >
          Crear sección
        </Button>
      </div>
    </form>
  )
}

const es = {
  form:     { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:      { color: 'var(--color-error)' },
  hint:     { fontSize: '11.5px', color: 'var(--color-text-muted)' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
