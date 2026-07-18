import React, { useMemo, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const FACTORS = {
  18: 73.0946,
  24: 59.4487,
  30: 51.4355,
  36: 46.2352,
  42: 42.6382,
  48: 40.039,
  60: 36.6219
}

const TERM_OPTIONS = Object.keys(FACTORS).map(Number)

const STEPS = [
  { eyebrow: 'Paso 1', title: 'Nombre', prompt: 'Comencemos con el nombre del cliente.' },
  { eyebrow: 'Paso 2', title: 'Apellidos', prompt: 'Agrega los apellidos para identificar la cotización.' },
  { eyebrow: 'Paso 3', title: 'Contacto', prompt: 'Captura el WhatsApp y la razón social.' },
  { eyebrow: 'Paso 4', title: 'Crédito', prompt: 'Define el monto solicitado y el plazo.' },
  { eyebrow: 'Paso 5', title: 'Enviar', prompt: 'Revisa la cotización y compártela.' }
]

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  })
}

function sanitizePhone(value) {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 10) {
    return `52${digits}`
  }

  return digits
}

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function getQuoteFileName(name) {
  const cleanName = (name || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return `cotizacion-imss-${cleanName || 'cliente'}.pdf`
}

export default function QuoteForm() {
  const [activeStep, setActiveStep] = useState(0)
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    businessName: '',
    phone: '',
    requestedAmount: 20000,
    term: 24,
    notes: ''
  })

  const fullName = [form.firstName, form.paternalLastName, form.maternalLastName]
    .filter(Boolean)
    .join(' ')

  const updateField = (key, value) => {
    setStatus('')
    setForm((current) => ({ ...current, [key]: value }))
  }

  const quote = useMemo(() => {
    const amount = Number(form.requestedAmount) || 0
    const factor = FACTORS[Number(form.term)] || 0
    const monthlyPayment = roundCurrency((amount * factor) / 1000)
    const totalPayment = roundCurrency(monthlyPayment * Number(form.term))
    const financeCost = roundCurrency(totalPayment - amount)

    return {
      amount,
      factor,
      monthlyPayment,
      totalPayment,
      financeCost
    }
  }, [form.requestedAmount, form.term])

  const message = useMemo(() => {
    const fileName = getQuoteFileName(fullName)
    const lines = [
      'Cotización Crédito IMSS',
      `Nombre: ${fullName || 'Pendiente'}`,
      `Razón social: ${form.businessName || 'Pendiente'}`,
      `WhatsApp: ${form.phone || 'Pendiente'}`,
      `Monto solicitado: ${formatMoney(quote.amount)}`,
      `Plazo: ${form.term} meses`,
      `Descuento mensual estimado: ${formatMoney(quote.monthlyPayment)}`,
      `Total estimado a pagar: ${formatMoney(quote.totalPayment)}`
    ]

    if (form.notes.trim()) {
      lines.push(`Notas: ${form.notes.trim()}`)
    }

    lines.push(`PDF generado: ${fileName}`)
    lines.push('Te comparto la cotización en PDF con el detalle.')

    return lines.join('\n')
  }, [form, fullName, quote])

  const nextStep = () => {
    setActiveStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const previousStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0))
  }

  const createPDF = async () => {
    const el = document.getElementById('quote-preview')
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'pt', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    const pageHeight = pdf.internal.pageSize.getHeight()

    let heightLeft = pdfHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
    }

    return pdf
  }

  const downloadPDF = async () => {
    try {
      setStatus('Generando PDF...')
      const pdf = await createPDF()
      pdf.save(getQuoteFileName(fullName))
      setStatus('PDF descargado correctamente.')
    } catch {
      setStatus('No pude generar el PDF. Revisa la información e intenta de nuevo.')
    }
  }

  const sendWhatsAppWithPDF = async () => {
    try {
      setStatus('Generando PDF y abriendo WhatsApp...')
      const pdf = await createPDF()
      pdf.save(getQuoteFileName(fullName))
      openWhatsApp()
      setStatus('PDF descargado. WhatsApp se abrió con el mensaje; adjunta el PDF descargado al chat.')
    } catch {
      setStatus('No pude generar el PDF o abrir WhatsApp. Intenta de nuevo.')
    }
  }

  const openWhatsApp = () => {
    const phone = sanitizePhone(form.phone)
    const encodedMessage = encodeURIComponent(message)
    const url = phone
      ? `https://wa.me/${phone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <div className="step-fields">
          <div className="step-intro">
            <p>{STEPS[activeStep].prompt}</p>
          </div>
          <label>
            Nombre
            <input
              autoFocus
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              placeholder="Ej. Joshua"
            />
          </label>
        </div>
      )
    }

    if (activeStep === 1) {
      return (
        <div className="step-fields">
          <div className="step-intro">
            <p>{STEPS[activeStep].prompt}</p>
          </div>
          <label>
            Apellido paterno
            <input
              autoFocus
              value={form.paternalLastName}
              onChange={(event) => updateField('paternalLastName', event.target.value)}
              placeholder="Ej. Torres"
            />
          </label>
          <label>
            Apellido materno
            <input
              value={form.maternalLastName}
              onChange={(event) => updateField('maternalLastName', event.target.value)}
              placeholder="Ej. Castro"
            />
          </label>
        </div>
      )
    }

    if (activeStep === 2) {
      return (
        <div className="step-fields">
          <div className="step-intro">
            <p>{STEPS[activeStep].prompt}</p>
          </div>
          <label>
            WhatsApp
            <input
              autoFocus
              inputMode="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="10 dígitos o con lada"
            />
          </label>
          <label>
            Razón social
            <input
              value={form.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
              placeholder="Empresa o razón social"
            />
          </label>
        </div>
      )
    }

    if (activeStep === 3) {
      return (
        <div className="step-fields">
          <div className="step-intro">
            <p>{STEPS[activeStep].prompt}</p>
          </div>
          <label>
            Monto solicitado
            <input
              autoFocus
              type="number"
              min="0"
              step="100"
              value={form.requestedAmount}
              onChange={(event) => updateField('requestedAmount', event.target.value)}
            />
          </label>
          <fieldset className="term-options">
            <legend>Plazo</legend>
            <div>
              {TERM_OPTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  className={Number(form.term) === term ? 'selected' : ''}
                  onClick={() => updateField('term', term)}
                >
                  {term}
                  <span>meses</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Notas
            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Observaciones, vigencia o documentos pendientes"
            />
          </label>
        </div>
      )
    }

    return (
      <div className="finish-panel">
        <div className="step-intro">
          <p>{STEPS[activeStep].prompt}</p>
        </div>
        <div>
          <span>Descuento mensual estimado</span>
          <strong>{formatMoney(quote.monthlyPayment)}</strong>
        </div>
        <p>
          Cotización preparada para {fullName || 'el cliente'} a {form.term} meses.
        </p>
        <button type="button" onClick={sendWhatsAppWithPDF}>
          Descargar PDF y abrir WhatsApp
        </button>
      </div>
    )
  }

  return (
    <div className="advisor-shell">
      <section className="intro-panel">
        <div>
          <span>Crédito IMSS</span>
          <h2>Cotización ejecutiva en cinco pasos</h2>
        </div>
        <p>
          Captura solo lo necesario, revisa el descuento estimado y entrega un PDF
          formal con mensaje listo para WhatsApp.
        </p>
      </section>

      <div className="workflow-grid">
        <aside className="step-rail" aria-label="Progreso de cotización">
          <div className="rail-summary">
            <span>Avance</span>
            <strong>{activeStep + 1} de {STEPS.length}</strong>
          </div>
          <nav>
            {STEPS.map((step, index) => (
              <button
                key={step.title}
                type="button"
                className={index === activeStep ? 'active' : ''}
                onClick={() => setActiveStep(index)}
              >
                <span>{index + 1}</span>
                <strong>{step.title}</strong>
              </button>
            ))}
          </nav>
          <div className="rail-note">
            <span>Entrega</span>
            <p>PDF descargable con cálculo, monto, plazo y datos del cliente.</p>
          </div>
        </aside>

        <section className="form-panel" aria-label="Cuestionario de cotización">
          <div className="panel-heading">
            <div>
              <span>{STEPS[activeStep].eyebrow}</span>
              <strong>{STEPS[activeStep].title}</strong>
            </div>
            <small>{Math.round(((activeStep + 1) / STEPS.length) * 100)}%</small>
          </div>

          {renderStep()}

          <div className="wizard-actions">
            <button type="button" className="ghost-action" onClick={previousStep} disabled={activeStep === 0}>
              Atrás
            </button>
            {activeStep < STEPS.length - 1 ? (
              <button type="button" className="primary-action" onClick={nextStep}>
                Continuar
              </button>
            ) : (
              <button type="button" className="primary-action" onClick={sendWhatsAppWithPDF}>
                Descargar PDF y abrir WhatsApp
              </button>
            )}
          </div>
        </section>

        <aside className="preview">
          <div className="quote-snapshot">
            <div>
              <span>Descuento mensual</span>
              <strong>{formatMoney(quote.monthlyPayment)}</strong>
            </div>
            <div>
              <span>Monto</span>
              <strong>{formatMoney(quote.amount)}</strong>
            </div>
            <div>
              <span>Plazo</span>
              <strong>{form.term} meses</strong>
            </div>
          </div>

          <div id="quote-preview" className="preview-box">
            <div className="quote-header">
              <div>
                <span>Cotización</span>
                <h2>Crédito IMSS</h2>
              </div>
              <time>{new Date().toLocaleDateString('es-MX')}</time>
            </div>

            <div className="client-block">
              <div>
                <span>Nombre</span>
                <strong>{fullName || '-'}</strong>
              </div>
              <div>
                <span>Razón social</span>
                <strong>{form.businessName || '-'}</strong>
              </div>
              <div>
                <span>WhatsApp</span>
                <strong>{form.phone || '-'}</strong>
              </div>
            </div>

            <table className="quote-table">
              <tbody>
                <tr>
                  <th>Monto solicitado</th>
                  <td>{formatMoney(quote.amount)}</td>
                </tr>
                <tr>
                  <th>Plazo</th>
                  <td>{form.term} meses</td>
                </tr>
                <tr>
                  <th>Factor</th>
                  <td>{quote.factor.toFixed(4)}</td>
                </tr>
                <tr>
                  <th>Descuento mensual estimado</th>
                  <td>{formatMoney(quote.monthlyPayment)}</td>
                </tr>
                <tr>
                  <th>Total estimado a pagar</th>
                  <td>{formatMoney(quote.totalPayment)}</td>
                </tr>
                <tr>
                  <th>Costo financiero estimado</th>
                  <td>{formatMoney(quote.financeCost)}</td>
                </tr>
              </tbody>
            </table>

            {form.notes.trim() ? (
              <div className="notes-block">
                <span>Notas</span>
                <p>{form.notes.trim()}</p>
              </div>
            ) : null}

            <p className="quote-footnote">
              Cálculo estimado con factor por cada $1,000 de monto solicitado.
            </p>
          </div>

          <div className="preview-actions">
            <button type="button" className="primary-action" onClick={sendWhatsAppWithPDF}>
              Descargar PDF y abrir WhatsApp
            </button>
            <button type="button" className="ghost-action" onClick={downloadPDF}>
              Descargar PDF
            </button>
            <button type="button" className="ghost-action" onClick={openWhatsApp}>
              Solo mensaje
            </button>
          </div>

          {status ? <p className="status-message">{status}</p> : null}
        </aside>
      </div>
    </div>
  )
}
