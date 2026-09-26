# Parte Teorica

## ¿Qué pasa en el event loop de Node.js si ejecutas una operación intensiva en CPU dentro de un endpoint, como generar un PDF? ¿Cómo lo resolverías?

Pues el hilo principal se bloquea, ya que Node.js ejecuta el código JavaScript en un solo hilo. Al generar un PDF, si tiene una carga pesada, puede ralentizar otros procesos porque estos tienen que esperar a que termine la generación. Lo que yo utilizaría es un worker, ya que permite crear un nuevo hilo con su propia instancia de V8 y su propio event loop. Cuando termina de ejecutarse, le devuelve el resultado al hilo principal, sin detener los demás procesos si es necesario.

## 2. Diferencia entre middleware, guard, interceptor, pipe y exception filter en NestJS, y en qué orden se ejecutan

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

## 3. Tu servicio recibe un JWT emitido por otro sistema. ¿Qué verificas antes de confiar en él y qué errores comunes se cometen?

Se verifica primero que la firma sea válida usando una clave confiable del sistema emisor y que esté usando el algoritmo que esperamos. Luego verificamos quién es el emisor, a qué servicio va dirigido y, obviamente, si está vencido o sigue vigente. También se puede revisar que todavía no sea válido, usando `nbf`, si el token lo trae.

Un error común puede ser solamente revisar que la firma sea confiable o solamente si está vencido. Otro error es aceptar un token que sí es válido, pero fue emitido para otro servicio. También se puede cometer el error de solo decodificar el JWT y confiar en los datos sin verificar su firma, o aceptar cualquier algoritmo que venga indicado en el token.

## 4. ¿Cómo implementarías un token de un solo uso que funcione con varias réplicas del servicio?

Guardaría el estado del token en un lugar que compartan todas las réplicas, por ejemplo una base de datos o Redis. Al usarlo, intentaría marcarlo como usado solamente si todavía está disponible y no venció, todo en una sola operación atómica.

De esa forma, si dos peticiones llegan al mismo tiempo, solamente una puede ganar y usar el token; a las demás las rechazo. No lo guardaría únicamente en la memoria de cada servidor, porque cada réplica tendría su propia copia y se podría reutilizar el token.

## 5. El core procesó un pago, pero tu servicio recibió un timeout y no sabe el resultado. ¿Qué haces?

No marcaría el pago como fallido ni volvería a cobrar de inmediato. Lo dejaría pendiente o con estado desconocido y consultaría al core usando la referencia que guardé antes de enviar el pago. Cuando tenga una confirmación, actualizo el estado.

Si necesito reintentar, usaría la misma clave de idempotencia y los mismos datos, pero solamente si el core garantiza que así no duplica el cobro. Si todavía no puedo saber qué pasó, lo dejo para conciliación y no genero otro pago hasta resolver el resultado del anterior.

## 6. ¿Cómo generas un enlace público a un comprobante de pago para que no se pueda adivinar ni reutilizar indefinidamente?

Generaría un código aleatorio difícil de adivinar, usando una forma segura de generarlo, por ejemplo un generador criptográfico, y guardaría a qué comprobante da acceso y cuándo vence. Cada vez que alguien abre el enlace, el servicio comprueba que siga vigente y entrega solamente ese comprobante.

El archivo no quedaría público por otra ruta. Si después necesitan verlo de nuevo, generaría un enlace nuevo.

## 7. Envías comprobantes por SMS mediante una cola (RabbitMQ u otra) con entrega "al menos una vez". ¿Cómo evitas que el cliente reciba el mismo SMS dos veces?

Le daría un identificador fijo a cada SMS que quiero mandar. Si RabbitMQ entrega el mismo mensaje otra vez, reviso en una base de datos compartida si ese envío ya quedó registrado y no lo repito.

También tendría cuidado con el caso en que el proveedor aceptó el SMS pero se perdió su respuesta. Para reintentar sin duplicar, necesitaría que el proveedor reconozca ese mismo identificador o consultaría qué pasó antes de volver a enviar el SMS.

## 8. ¿Qué debes considerar al ejecutar un servicio Node.js en OpenShift: usuario, probes, ConfigMaps y Secrets?

Revisaría que la aplicación pueda correr sin root ni depender de un usuario fijo, porque OpenShift puede asignarle otro usuario. Pondría una comprobación para saber si está lista para recibir tráfico y otra para detectar si se quedó trabada y hay que reiniciarla. Si la aplicación tarda mucho en iniciar, también usaría una comprobación de inicio para que no la reinicie antes de tiempo.

La configuración común la pasaría por ConfigMaps, y las contraseñas o tokens por Secrets, sin meterlos en la imagen ni mostrarlos en logs.
