import React from 'react'
import QuoteForm from './QuoteForm'

export default function App() {
  return (
    <div className="app">
      <header>
        <span>Cotizador financiero</span>
        <h1>Crédito IMSS</h1>
      </header>
      <main>
        <QuoteForm />
      </main>
    </div>
  )
}
