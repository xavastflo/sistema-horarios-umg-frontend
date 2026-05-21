import { useState, useRef } from 'react'
import Card        from '../ui/Card'
import Button      from '../ui/Button'
import api         from '../../api/axios'

/**
 * CargaPensumMasiva
 *
 * Componente de importación masiva de cursos desde CSV a un pensum.
 *
 * Columnas del CSV (en orden):
 *   codigo_curso | nombre_curso | ciclo_semestre
 *
 * Props:
 *   idPensum    {number}    ID del pensum destino
 *   nombrePensum{string}    Nombre del pensum (para display)
 *   onExito     {function}  Callback cuando la importación fue exitosa — padre recarga sus datos
 *   onCerrar    {function}  Callback para cerrar/ocultar este componente
 */
export default function CargaPensumMasiva({ idPensum, nombrePensum, onExito, onCerrar }) {
  const [archivo,    setArchivo]    = useState(null)
  const [arrastrado, setArrastrado] = useState(false)
  const [estado,     setEstado]     = useState('idle') // idle | procesando | exito | error
  const [resumen,    setResumen]    = useState(null)
  const [errores,    setErrores]    = useState([])
  const [errorMsg,   setErrorMsg]   = useState(null)
  const inputRef = useRef(null)

  // ── Descarga de plantilla ──────────────────────────────────
  async function descargarPlantilla() {
    try {
      const response = await api.get('/pensums/plantilla-csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(response.data)
      const a   = document.createElement('a')
      a.href     = url
      a.download = 'plantilla_pensum.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      setErrorMsg('No se pudo descargar la plantilla.')
    }
  }

  // ── Manejo del archivo ─────────────────────────────────────
  function validarArchivo(file) {
    if (!file) return null
    if (!['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'].includes(file.type)
        && !file.name.endsWith('.csv')) {
      return 'Solo se aceptan archivos CSV (.csv).'
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'El archivo no puede superar 2 MB.'
    }
    return null
  }

  function onSeleccion(e) {
    const file = e.target.files?.[0] ?? null
    procesarArchivo(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setArrastrado(false)
    const file = e.dataTransfer.files?.[0] ?? null
    procesarArchivo(file)
  }

  function procesarArchivo(file) {
    setEstado('idle')
    setResumen(null)
    setErrores([])
    setErrorMsg(null)
    if (!file) return
    const err = validarArchivo(file)
    if (err) { setErrorMsg(err); return }
    setArchivo(file)
  }

  function onQuitar() {
    setArchivo(null)
    setEstado('idle')
    setResumen(null)
    setErrores([])
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Enviar al backend ──────────────────────────────────────
  async function onImportar() {
    if (!archivo) return
    setEstado('procesando')
    setErrores([])
    setErrorMsg(null)
    setResumen(null)

    const form = new FormData()
    form.append('archivo', archivo)

    try {
      const { data } = await api.post(`/pensums/${idPensum}/import-csv`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResumen(data)
      setEstado('exito')
      onExito?.()
    } catch (err) {
      const status = err.response?.status
      const data   = err.response?.data

      if (status === 422 && data?.errores?.length) {
        setErrores(data.errores)
        setErrorMsg(data.message ?? 'El CSV contiene errores. Ningún curso fue importado.')
      } else if (status === 403) {
        setErrorMsg('No tienes permisos para esta acción.')
      } else {
        setErrorMsg(data?.message ?? 'Error al procesar el archivo.')
      }
      setEstado('error')
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <Card>
      {/* Cabecera */}
      <div style={es.cabecera}>
        <div>
          <h2 style={es.titulo}>Carga masiva de cursos desde CSV</h2>
          <p style={es.subtitulo}>
            Pensum destino: <strong>{nombrePensum ?? `#${idPensum}`}</strong>
          </p>
        </div>
        <Button variante="ghost" size="sm" onClick={onCerrar}>✕ Cerrar</Button>
      </div>

      {/* Paso 1: plantilla */}
      <div style={es.paso}>
        <div style={es.pasoBadge}>1</div>
        <div style={es.pasoBody}>
          <p style={es.pasoTitulo}>Descarga la plantilla CSV</p>
          <p style={es.pasoDesc}>
            La plantilla tiene <strong>3 columnas</strong> en este orden exacto:
            <code style={es.inline}> codigo_curso, nombre_curso, ciclo_semestre</code>
          </p>
          <Button variante="secondary" size="sm" onClick={descargarPlantilla}>
            ↓ Descargar plantilla CSV de ejemplo
          </Button>
        </div>
      </div>

      {/* Paso 2: zona de carga */}
      <div style={es.paso}>
        <div style={es.pasoBadge}>2</div>
        <div style={es.pasoBody}>
          <p style={es.pasoTitulo}>Sube tu CSV completado</p>

          {!archivo ? (
            <div
              style={{ ...es.dropzone, ...(arrastrado ? es.dropzoneActivo : {}) }}
              onDragOver={e => { e.preventDefault(); setArrastrado(true) }}
              onDragLeave={() => setArrastrado(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
            >
              <span style={es.dropIcono}>📄</span>
              <p style={es.dropTexto}>
                Arrastra tu CSV aquí o <span style={es.dropLink}>haz clic para seleccionar</span>
              </p>
              <p style={es.dropHint}>3 columnas: código, nombre, ciclo · Solo .csv · Máx. 2 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onSeleccion}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={es.archivoSelec}>
              <span style={es.archivoIcono}>✅</span>
              <div style={es.archivoInfo}>
                <span style={es.archivoNombre}>{archivo.name}</span>
                <span style={es.archivoSize}>
                  {(archivo.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button style={es.btnQuitar} onClick={onQuitar} title="Quitar archivo">✕</button>
            </div>
          )}

          {errorMsg && estado !== 'exito' && (
            <div style={es.alertaError}>{errorMsg}</div>
          )}
        </div>
      </div>

      {/* Paso 3: confirmar */}
      {archivo && estado !== 'exito' && (
        <div style={es.paso}>
          <div style={es.pasoBadge}>3</div>
          <div style={es.pasoBody}>
            <p style={es.pasoTitulo}>Confirmar importación</p>
            <p style={es.pasoDesc}>
              El sistema validará cada fila antes de guardar. Si hay errores,
              <strong> ningún curso se importará</strong> hasta que el CSV esté correcto.
            </p>
            <Button
              variante="primary"
              cargando={estado === 'procesando'}
              disabled={estado === 'procesando'}
              onClick={onImportar}
            >
              {estado === 'procesando' ? 'Procesando plantilla académica…' : 'Importar cursos al pensum'}
            </Button>
          </div>
        </div>
      )}

      {/* Resultado: errores de validación por fila */}
      {errores.length > 0 && (
        <div style={es.bloqueErrores}>
          <p style={es.erroresTitulo}>
            ⚠ Se encontraron {errores.length} error{errores.length !== 1 ? 'es' : ''} en el CSV:
          </p>
          <ul style={es.listaErrores}>
            {errores.map((msg, i) => (
              <li key={i} style={es.errorItem}>{msg}</li>
            ))}
          </ul>
          <p style={es.erroresHint}>
            Corrige el CSV y vuelve a subirlo. Ningún curso fue guardado.
          </p>
        </div>
      )}

      {/* Resultado: éxito */}
      {estado === 'exito' && resumen && (
        <div style={es.bloqueExito}>
          <p style={es.exitoTitulo}>✓ {resumen.message}</p>
          <div style={es.resumenGrid}>
            <div style={es.resumenItem}>
              <span style={es.resumenNum}>{resumen.resumen.filas_procesadas}</span>
              <span style={es.resumenLabel}>Filas procesadas</span>
            </div>
            <div style={es.resumenItem}>
              <span style={{ ...es.resumenNum, color: 'var(--color-primary)' }}>
                {resumen.resumen.cursos_añadidos_pensum}
              </span>
              <span style={es.resumenLabel}>Cursos añadidos al pensum</span>
            </div>
            <div style={es.resumenItem}>
              <span style={es.resumenNum}>{resumen.resumen.cursos_nuevos_en_bd}</span>
              <span style={es.resumenLabel}>Cursos nuevos en BD</span>
            </div>
            <div style={es.resumenItem}>
              <span style={es.resumenNum}>{resumen.resumen.cursos_omitidos}</span>
              <span style={es.resumenLabel}>Ya existían en el pensum</span>
            </div>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <Button variante="ghost" size="sm" onClick={onQuitar}>
              Importar otro CSV
            </Button>
            <Button variante="secondary" size="sm" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const es = {
  cabecera: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '20px', flexWrap: 'wrap', gap: '8px',
  },
  titulo:   { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' },
  subtitulo:{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 },

  paso: { display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'flex-start' },
  pasoBadge: {
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    background: 'var(--color-primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700,
  },
  pasoBody:  { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  pasoTitulo:{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
  pasoDesc:  { fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 },
  inline: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
    fontFamily: 'var(--font-mono)',
  },

  dropzone: {
    border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
    padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
    background: 'var(--color-bg)', transition: 'border-color .15s, background .15s',
  },
  dropzoneActivo: {
    borderColor: 'var(--color-primary)', background: 'var(--color-primary-subtle)',
  },
  dropIcono: { fontSize: '32px', display: 'block', marginBottom: '10px' },
  dropTexto: { fontSize: '14px', color: 'var(--color-text)', margin: '0 0 4px', fontWeight: 500 },
  dropLink:  { color: 'var(--color-primary)', textDecoration: 'underline' },
  dropHint:  { fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 },

  archivoSelec: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', background: 'var(--color-primary-subtle)',
    border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-md)',
  },
  archivoIcono: { fontSize: '18px', flexShrink: 0 },
  archivoInfo:  { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  archivoNombre:{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  archivoSize:  { fontSize: '12px', color: 'var(--color-text-muted)' },
  btnQuitar: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 2px',
    flexShrink: 0,
  },

  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13px', color: 'var(--color-error)', fontWeight: 500, marginTop: '4px',
  },

  bloqueErrores: {
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 'var(--radius-md)', padding: '14px 16px',
  },
  erroresTitulo: { fontSize: '13.5px', fontWeight: 700, color: '#92400e', margin: '0 0 10px' },
  listaErrores:  { margin: '0 0 10px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' },
  errorItem:     { fontSize: '13px', color: '#78350f' },
  erroresHint:   { fontSize: '12px', color: '#92400e', margin: 0 },

  bloqueExito: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '16px',
  },
  exitoTitulo:  { fontSize: '14px', fontWeight: 700, color: '#166534', margin: '0 0 14px' },
  resumenGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' },
  resumenItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' },
  resumenNum:   { fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' },
  resumenLabel: { fontSize: '11.5px', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.3 },
}
