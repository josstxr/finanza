# Finanza - Crédito IMSS

Cotizador React para Crédito IMSS. Calcula el descuento mensual con los factores del archivo `CALCULO CREDITO IMSS.xlsx`, genera una cotización en PDF y prepara el mensaje de WhatsApp con los datos del cliente.

Instalación y ejecución:

```bash
npm install
npm run dev
```

Uso:
- Rellena nombre, razón social, WhatsApp, monto solicitado y plazo.
- Haz clic en "Descargar PDF" para guardar la cotización.
- Haz clic en "Enviar PDF por WhatsApp" para generar el PDF y abrir el panel nativo de compartir cuando el navegador soporte adjuntos.
- Haz clic en "Solo mensaje" para abrir WhatsApp con el texto prellenado al número capturado.

Nota: WhatsApp Web no permite adjuntar automáticamente un PDF desde un enlace `wa.me`. Para envío automático real se necesita un backend conectado a WhatsApp Business Cloud API.
