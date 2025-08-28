# Instrucciones para Túnel Temporal de Cloudflare

## Configuración Actual
Estamos usando **TryCloudflare** para crear túneles temporales que generan una URL aleatoria cada vez que se reinicia la máquina.

## Proceso para Generar Nuevo Túnel

### 1. Ejecutar el Túnel
En la terminal, desde el directorio del proyecto:
```bash
./cloudflared.exe tunnel --url http://localhost:3000
```

### 2. Obtener la Nueva URL
El comando mostrará algo como:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://NOMBRE-ALEATORIO.trycloudflare.com                                                |
+--------------------------------------------------------------------------------------------+
```

### 3. Actualizar el Archivo .env.local
Cambiar la línea:
```
NGROK_URL=https://URL-ANTERIOR.trycloudflare.com
```
Por:
```
NGROK_URL=https://NUEVA-URL.trycloudflare.com
```

### 4. Verificar que Funciona
```bash
curl -I https://NUEVA-URL.trycloudflare.com
```
Debe devolver `HTTP/1.1 200 OK`

## Notas Importantes
- El túnel es temporal y se pierde al reiniciar la máquina
- Cada vez genera una URL diferente y aleatoria
- No requiere dominio propio ni configuración permanente
- Ideal para desarrollo y pruebas

## URL Actual
**Última URL generada:** https://fight-labs-expansys-specialties.trycloudflare.com
**Fecha:** 26 de agosto de 2025

---
*Recuerda actualizar este archivo cada vez que generes una nueva URL*