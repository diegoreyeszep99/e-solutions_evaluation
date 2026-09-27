# Parte Teórica

**1. ¿Qué pasa en el event loop de Node.js si ejecutas una operación intensiva en CPU dentro de un endpoint, como generar un PDF? ¿Cómo lo resolverías?**

Pues el hilo principal se bloquea, ya que Node.js ejecuta el código JavaScript en un solo hilo. Al generar un PDF, si tiene una carga pesada, puede ralentizar otros procesos porque estos tienen que esperar a que termine la generación. Lo que yo utilizaría es un worker, ya que permite crear un nuevo hilo con su propia instancia de V8 y su propio event loop. Cuando termina de ejecutarse, le devuelve el resultado al hilo principal, sin detener los demás procesos si es necesario.

**2. Diferencia entre middleware, guard, interceptor, pipe y exception filter en NestJS, y en qué orden se ejecutan**

- El middleware sirve para revisar una petición antes de que llegue al controlador. Puede ayudar para registrar logs, revisar cookies o tokens, e incluso modificar la petición, por ejemplo agregando un `traceId`. Se ejecuta antes de que NestJS conozca qué handler específico va a utilizar, por lo que no tiene acceso a sus metadatos.
- El guard, como lo dice la palabra, es un guardia encargado de aceptar o rechazar la petición. Puede comprobar si el usuario inició sesión o si tiene permisos para revisar información, por ejemplo cuando manejamos roles como administrador o usuario normal. Si no cumple alguna condición, bloquea la petición y devuelve un error.
- El interceptor intercepta toda la llamada: puede ejecutar lógica antes de que llegue al controlador y también después de que este responda. Por ejemplo, puede medir el tiempo de ejecución, transformar la respuesta o capturar errores.
- El pipe sirve para validar la estructura y los tipos de datos que están entrando, y también puede transformar la data. Por ejemplo, puede convertir un número que llega como `string` a tipo `number`.
- El exception filter sirve para manejar excepciones no capturadas dentro de la aplicación. Esto ayuda a devolver una respuesta de error consistente y evita exponer información sensible del error original.

El orden de ejecución normalmente es:

1. Request entrante.
2. Middleware.
3. Guards.
4. Interceptors antes del controlador.
5. Pipes.
6. Controlador y servicios.
7. Interceptors después del controlador, en orden inverso.
8. Exception filters, solamente si ocurre una excepción no capturada.
9. Response.

**3. Tu servicio recibe un JWT emitido por otro sistema. ¿Qué verificas antes de confiar en él y qué errores comunes se cometen?**

Se verifica primero que la firma sea válida usando una clave confiable del sistema emisor y que esté usando el algoritmo que esperamos. Luego verificamos quién es el emisor, a qué servicio va dirigido y, obviamente, si está vencido o sigue vigente. También se puede revisar que todavía no sea válido, usando `nbf`, si el token lo trae.

Un error común puede ser solamente revisar que la firma sea confiable o solamente si está vencido. Otro error es aceptar un token que sí es válido, pero fue emitido para otro servicio. También se puede cometer el error de solo decodificar el JWT y confiar en los datos sin verificar su firma, o aceptar cualquier algoritmo que venga indicado en el token.

**4. ¿Cómo implementarías un token de un solo uso que funcione con varias réplicas del servicio?**

Guardaría el estado del token en un lugar que compartan todas las réplicas, por ejemplo una base de datos o Redis. Al usarlo, intentaría marcarlo como usado solamente si todavía está disponible y no venció, todo en una sola operación atómica.

De esa forma, si dos peticiones llegan al mismo tiempo, solamente una puede ganar y usar el token; a las demás las rechazo. No lo guardaría únicamente en la memoria de cada servidor, porque cada réplica tendría su propia copia y se podría reutilizar el token.

**5. El core procesó un pago, pero tu servicio recibió un timeout y no sabe el resultado. ¿Qué haces?**

No marcaría el pago como fallido ni volvería a cobrar de inmediato. Lo dejaría pendiente o con estado desconocido y consultaría al core usando la referencia que guardé antes de enviar el pago. Cuando tenga una confirmación, actualizo el estado.

Si necesito reintentar, usaría la misma clave de idempotencia y los mismos datos, pero solamente si el core garantiza que así no duplica el cobro. Si todavía no puedo saber qué pasó, lo dejo para conciliación y no genero otro pago hasta resolver el resultado del anterior.

**6. ¿Cómo generas un enlace público a un comprobante de pago para que no se pueda adivinar ni reutilizar indefinidamente?**

Generaría un código aleatorio difícil de adivinar, usando una forma segura de generarlo, por ejemplo un generador criptográfico, y guardaría a qué comprobante da acceso y cuándo vence. Cada vez que alguien abre el enlace, el servicio comprueba que siga vigente y entrega solamente ese comprobante.

El archivo no quedaría público por otra ruta. Si después necesitan verlo de nuevo, generaría un enlace nuevo.

**7. Envías comprobantes por SMS mediante una cola (RabbitMQ u otra) con entrega "al menos una vez". ¿Cómo evitas que el cliente reciba el mismo SMS dos veces?**

Le daría un identificador fijo a cada SMS que quiero mandar. Si RabbitMQ entrega el mismo mensaje otra vez, reviso en una base de datos compartida si ese envío ya quedó registrado y no lo repito.

También tendría cuidado con el caso en que el proveedor aceptó el SMS pero se perdió su respuesta. Para reintentar sin duplicar, necesitaría que el proveedor reconozca ese mismo identificador o consultaría qué pasó antes de volver a enviar el SMS.

**8. ¿Qué debes considerar al ejecutar un servicio Node.js en OpenShift: usuario, probes, ConfigMaps y Secrets?**

Revisaría que la aplicación pueda correr sin root ni depender de un usuario fijo, porque OpenShift puede asignarle otro usuario. Pondría una comprobación para saber si está lista para recibir tráfico y otra para detectar si se quedó trabada y hay que reiniciarla. Si la aplicación tarda mucho en iniciar, también usaría una comprobación de inicio para que no la reinicie antes de tiempo.

La configuración común la pasaría por ConfigMaps, y las contraseñas o tokens por Secrets, sin meterlos en la imagen ni mostrarlos en logs.

# Integration Payment Service

Servicio mínimo en NestJS que valida acceso de integraciones y evita crear pagos duplicados. El estado se guarda en memoria para mantener el ejercicio enfocado en seguridad, concurrencia e idempotencia.

## Requisitos

- Node.js 20 o superior.
- npm.

## Configuración

```bash
npm install
cp .env.example .env
```

Variables disponibles:

| Variable | Descripción |
| --- | --- |
| `INTEGRATION_JWT_SECRET` | Clave compartida usada para verificar JWT con HS256. |
| `INTEGRATION_JWT_ISSUER` | Emisor exacto permitido en `iss`. |
| `INTEGRATION_JWT_AUDIENCE` | Audiencia exacta permitida en `aud`. |
| `CORE_DELAY_MS` | Demora del core simulado en milisegundos. |
| `PORT` | Puerto HTTP; por defecto `3000`. |

Iniciar el servicio:

```bash
npm run start:dev
```

## Flujo de autenticación

Generar un JWT externo válido usando la configuración de `.env`:

```bash
npm run token:generate
```

Intercambiarlo por un token de integración opaco, válido durante 60 minutos:

```bash
curl -X POST http://localhost:3000/auth/login-integration \
  -H "Content-Type: application/json" \
  -d '{"jwt":"<external-jwt>"}'
```

El JWT se acepta únicamente si tiene firma válida con la clave configurada, algoritmo HS256, `exp` vigente y valores exactos para `iss` y `aud`.

Consumir el token de integración:

```bash
curl -i -X POST http://localhost:3000/auth/redeem \
  -H "Content-Type: application/json" \
  -d '{"integrationToken":"<opaque-token>"}'
```

El primer consumo responde `204 No Content`. Un token desconocido, vencido o consumido responde `401 Unauthorized` sin revelar cuál condición falló. El servicio guarda solamente el hash SHA-256 del token, no el valor entregado al cliente.

## Crear pagos

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment-123" \
  -d '{"amountInMinorUnits":1250,"currency":"GTQ"}'
```

`amountInMinorUnits` es un entero positivo expresado en centavos de quetzal y `currency` acepta únicamente el código ISO 4217 `GTQ`.

El registro idempotente se crea antes de esperar al core. Dos solicitudes simultáneas con la misma llave y los mismos datos comparten la misma promesa, por lo que el core se ejecuta una sola vez y ambas reciben el mismo resultado. Reutilizar una llave con datos diferentes responde `409 Conflict`.

Los flujos de autenticación y pagos son independientes porque la consigna no establece que el consumo de un token autorice la creación de pagos.

## Errores

Todas las respuestas de error usan la misma estructura y omiten mensajes internos o stack traces:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "amountInMinorUnits",
      "message": "amountInMinorUnits must not be less than 1"
    }
  ],
  "path": "/payments",
  "timestamp": "2026-09-26T12:00:00.000Z"
}
```

## Pruebas

```bash
npm run test:unit
npm run test:e2e
npm run typecheck
npm run build
```

Las pruebas unitarias cubren JWT válido, vencido y con firma incorrecta. La prueba con Supertest envía dos pagos simultáneos con la misma llave y comprueba que el core se invoca una sola vez.

## Varias réplicas

La memoria local no sirve como autoridad cuando existen varias réplicas: cada proceso tendría tokens y registros idempotentes diferentes.

Para el token de un solo uso guardaría su hash en Redis con TTL de 60 minutos. El consumo usaría `GETDEL` o un script Lua equivalente, de modo que leer y eliminar sean una única operación atómica. Sólo una réplica podría obtener el registro; las demás recibirían el mismo rechazo genérico.

Para idempotencia usaría Redis o una base de datos compartida con un registro que contenga la llave, el hash canónico de la solicitud, el estado (`processing`, `completed` o `unknown`) y la respuesta final. Una restricción única o `SET NX` decidiría atómicamente qué réplica inicia el pago. Las demás esperarían o consultarían ese registro y devolverían la respuesta almacenada, sin llamar otra vez al core.

También enviaría la misma llave de idempotencia al core. Si el core procesa el pago pero la respuesta se pierde, el registro permanece `unknown` hasta consultar o conciliar el resultado; no se crea un segundo pago. Finalmente, aplicaría una política explícita de retención y limpieza, métricas para registros atascados y cifrado o controles de acceso sobre el almacenamiento compartido.
