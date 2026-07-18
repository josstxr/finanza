# Finanza - Crédito IMSS

Página informativa y cotizador React para Crédito IMSS. Calcula el descuento mensual con los factores del archivo `CALCULO CREDITO IMSS.xlsx`, genera una cotización en PDF y prepara el mensaje de WhatsApp con los datos del cliente.

Instalación y ejecución:

```bash
npm install
npm run dev
```

Uso:
- Revisa la información general del crédito en la página principal.
- Completa el cuestionario en secuencia: nombre, apellidos, contacto, monto y plazo.
- Haz clic en "Descargar PDF" para guardar la cotización.
- Haz clic en "Enviar PDF por WhatsApp" para generar el PDF y abrir el panel nativo de compartir cuando el navegador soporte adjuntos.
- Haz clic en "Solo mensaje" para abrir WhatsApp con el texto prellenado al número capturado.

Nota: WhatsApp Web no permite adjuntar automáticamente un PDF desde un enlace `wa.me`. Para envío automático real se necesita un backend conectado a WhatsApp Business Cloud API.
