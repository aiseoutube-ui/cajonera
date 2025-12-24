
# La Cajonera - Despliegue y Configuración

## 1. Google Apps Script (Backend)
1. Crea un **Google Sheet** con dos hojas: `PRODUCTOS` y `PEDIDOS`.
2. Llena la hoja `PRODUCTOS` con algunos datos de prueba.
3. Ve a `Extensiones > Apps Script`.
4. Pega el contenido de `backend/Code.gs`.
5. Reemplaza `SPREADSHEET_ID` y `FOLDER_ID` (ID de una carpeta en Drive donde se guardarán los vouchers).
6. Haz clic en **Implementar > Nueva implementación**.
7. Selecciona **Aplicación web**.
8. Ejecutar como: `Yo`. Quién tiene acceso: `Cualquiera`.
9. Copia la URL generada.

## 2. Frontend
1. En el archivo `constants.tsx`, reemplaza `API_URL` con la URL que copiaste de Apps Script.
2. Reemplaza `ADMIN_PHONE` con tu número de WhatsApp (formato internacional sin el +).
3. Reemplaza `YAPE_NUMBER` con el número real de tu Yape.

## 3. Consideraciones UX
- La app funciona como PWA. Los usuarios pueden "Añadir a la pantalla de inicio".
- No requiere contraseñas, lo que maximiza la conversión en entornos de confianza (comunidades de WhatsApp).
- Las imágenes se comprimen en el cliente antes de subir, minimizando el consumo de megas.
