# Referencia de la API (backend → Angular)

Todos los endpoints (excepto `POST /auth/login`) requieren el header:

```
Authorization: Bearer <accessToken>
```

El `accessToken` se obtiene en el login y se guarda por el tiempo que indique `JWT_EXPIRES_IN`.

## Formato de respuesta (todas las rutas)

Toda respuesta exitosa tiene esta envoltura:

```json
{
  "success": true,
  "msg": "Mensaje descriptivo de la acción",
  "errorCode": null,
  "data": /* lo específico de cada endpoint, documentado abajo */
}
```

Toda respuesta de error tiene esta forma (con status HTTP 400/401/403/404/409/500 según el caso):

```json
{
  "success": false,
  "msg": "Cuenta no encontrada",
  "errorCode": "ACCOUNT_NOT_FOUND",
  "data": {}
}
```

Los `errorCode` posibles están en `src/common/errors/error-codes.constat.ts` (ej. `VALIDATION_ERROR`, `ACCOUNT_NOT_FOUND`, `INSUFFICIENT_BALANCE`, `UNAUTHORIZED`, etc.). En todos los endpoints, si el recurso pedido pertenece a otro usuario, responde **404** (no 403) para no confirmar que existe.

Debajo, `data` es siempre lo que se documenta en cada endpoint.

---

## Auth

### `POST /auth/login` — público, no requiere token

Body:
```json
{ "userName": "jperez", "password": "password123" }
```

`data`:
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": 7, "name": "Juan Pérez", "userName": "jperez" }
}
```

### `GET /auth/me`

`data`:
```json
{
  "id": 7,
  "name": "Juan Pérez",
  "userName": "jperez",
  "phone": "+52 81 1234 5678",
  "isActive": true,
  "createdAt": "2026-09-13T04:47:56.150Z"
}
```

---

## Cuentas (`accounts`)

### `GET /accounts`

`data`: arreglo de cuentas del usuario autenticado.
```json
[
  {
    "id": 22,
    "userId": 7,
    "typeAccount": "DEBIT",
    "alias": "Cuenta Nómina BBVA",
    "last4Digits": "4821",
    "currentBalance": "18050.75",
    "isActive": true,
    "createdAt": "2026-09-13T04:47:56.187Z"
  }
]
```
`typeAccount` es uno de: `DEBIT`, `CREDIT`, `CASH`, `SAVINGS`.

### `GET /accounts/:id`

`data`: un objeto con la misma forma de arriba. 404 (`ACCOUNT_NOT_FOUND`) si no existe o no es del usuario.

### `PATCH /accounts/:id`

Body (todos opcionales):
```json
{ "alias": "Mi cuenta nueva", "isActive": false }
```
`data`: la cuenta actualizada.

---

## Categorías (`categories`)

### `GET /categories`

Catálogo global (no depende del usuario). `data`:
```json
[
  { "id": 32, "name": "Alimentación", "icon": "🍔", "createdAt": "2026-09-13T04:47:56.078Z" }
]
```

---

## Transacciones (`transactions`)

### `GET /accounts/:accountId/transactions`

Query params (todos opcionales): `from`, `to` (fechas ISO), `categoryId` (number), `type` (`INCOME`|`EXPENSE`), `page` (default 1), `limit` (default 20).

`data`:
```json
[
  {
    "id": 482,
    "accountId": 22,
    "categoryId": 32,
    "type": "EXPENSE",
    "amount": "150",
    "description": "Restaurante",
    "date": "2026-09-13T00:00:00.000Z",
    "createdAt": "2026-09-13T05:35:53.184Z"
  }
]
```

### `POST /accounts/:accountId/transactions`

Body:
```json
{
  "categoryId": 32,
  "type": "EXPENSE",
  "amount": 150,
  "description": "Restaurante",
  "date": "2026-09-13"
}
```
`description` y `date` son opcionales (`date` default: ahora). `data`: la transacción creada (misma forma de arriba). **Efecto secundario**: actualiza `currentBalance` de la cuenta (+monto si `INCOME`, −monto si `EXPENSE`).

### `GET /accounts/:accountId/transactions/summary?month=YYYY-MM`

`data`:
```json
{ "month": "2026-09", "income": 22000, "expenses": 15300, "savings": 6700 }
```

### `GET /accounts/:accountId/transactions/spending-by-category?from=&to=`

`from`/`to` opcionales (ISO). `data`:
```json
[
  { "categoryId": 32, "categoryName": "Restaurantes", "total": 4639.49 }
]
```

### `GET /transactions/:id`

`data`: una transacción (misma forma que en la lista). 404 (`TRANSACTION_NOT_FOUND`) si no es del usuario.

---

## Transferencias (`transfers`)

### `POST /transfers`

Body:
```json
{ "fromAccountId": 22, "toAccountId": 24, "amount": 300, "description": "Ahorro mensual" }
```
`description` opcional. `data`: la transferencia creada. **Efecto secundario**: descuenta de `fromAccountId` y abona a `toAccountId` (ambas del mismo usuario), en una sola operación atómica. 400 (`INSUFFICIENT_BALANCE`) si no alcanza el saldo.
```json
{
  "id": 18,
  "fromAccountId": 22,
  "toAccountId": 24,
  "amount": "300",
  "description": "Ahorro mensual",
  "date": "2026-09-13T05:32:20.527Z",
  "createdAt": "2026-09-13T05:32:20.531Z"
}
```

### `GET /transfers`

`data`: arreglo de todas las transferencias donde el usuario es origen o destino (misma forma de arriba).

### `GET /transfers/:id`

`data`: una transferencia. 404 (`TRANSFER_NOT_FOUND`) si ninguna de las 2 cuentas es del usuario.

---

## Presupuestos (`budgets`)

### `GET /accounts/:accountId/budgets`

`data`:
```json
[
  {
    "id": 16,
    "accountId": 22,
    "categoryId": 32,
    "limitAmount": "6000",
    "startPeriod": "2026-08-14T04:47:56.263Z",
    "endPeriod": "2026-09-13T04:47:56.263Z",
    "createdAt": "2026-09-13T04:47:56.264Z"
  }
]
```

### `POST /accounts/:accountId/budgets`

Body:
```json
{ "categoryId": 32, "limitAmount": 6000, "startPeriod": "2026-08-14", "endPeriod": "2026-09-13" }
```
`data`: el presupuesto creado (misma forma de arriba).

### `PATCH /budgets/:id`

Body: cualquiera de los 4 campos de arriba, todos opcionales. `data`: el presupuesto actualizado.

### `DELETE /budgets/:id`

`data`: el presupuesto eliminado.

### `GET /budgets/:id/status`

`data`:
```json
{ "limitAmount": 6000, "spent": 3378.41, "remaining": 2621.59, "percentage": 56.31 }
```

---

## Metas de ahorro (`savings-goals`)

### `GET /accounts/:accountId/savings-goals`

`data`:
```json
[
  {
    "id": 13,
    "accountId": 24,
    "name": "Vacaciones 2027",
    "targetAmount": "24000",
    "actualAmount": "500",
    "createdAt": "2026-09-13T05:14:48.638Z"
  }
]
```

### `POST /accounts/:accountId/savings-goals`

Body:
```json
{ "name": "Vacaciones 2027", "targetAmount": 24000 }
```
`data`: la meta creada (misma forma de arriba, `actualAmount` empieza en 0).

### `PATCH /savings-goals/:id`

Body: `name` y/o `targetAmount`, ambos opcionales. `data`: la meta actualizada.

### `POST /savings-goals/:id/contribute`

Body:
```json
{ "amount": 500 }
```
`data`: la meta con `actualAmount` incrementado.

---

## Chat (LLM + MCP + A2UI)

### `POST /chat/sessions`

Sin body. `data`:
```json
{ "id": 20, "userId": 7, "createdAt": "2026-09-13T06:17:26.000Z", "finishedAt": null }
```

### `GET /chat/sessions`

`data`: arreglo de sesiones del usuario (misma forma de arriba), más recientes primero.

### `GET /chat/sessions/:id/messages`

`data`: arreglo de todos los mensajes de la sesión, en orden cronológico:
```json
[
  {
    "id": 91,
    "sessionId": 17,
    "role": "USER",
    "content": "Quiero ahorrar 24000 pesos en 12 meses",
    "toolData": null,
    "uiSchema": null,
    "createdAt": "...",
    "readAt": null
  },
  {
    "id": 92,
    "sessionId": 17,
    "role": "ASSISTANT",
    "content": "Estas son las opciones...",
    "toolData": null,
    "uiSchema": [ { "component": "SavingsPlanSimulator", "props": { "...": "..." } } ],
    "createdAt": "...",
    "readAt": null
  }
]
```
`role` es `USER`, `ASSISTANT`, o `TOOL` (los mensajes `TOOL` son bookkeeping interno del backend hacia el LLM — Angular normalmente solo necesita mostrar `USER` y `ASSISTANT`). `toolData` es siempre irrelevante para el frontend. `uiSchema` es la parte importante: ver `docs/a2ui-contract.md` para la lista completa de los 13 componentes posibles y cómo renderizarlos.

### `POST /chat/sessions/:id/messages` — el endpoint principal del chat

Body:
```json
{ "content": "Quiero ahorrar 24000 pesos en 12 meses" }
```
`data`: **un solo mensaje**, el del rol `ASSISTANT` con la respuesta final del turno (no el mensaje del usuario, ese ya se guardó solo):
```json
{
  "id": 92,
  "sessionId": 17,
  "role": "ASSISTANT",
  "content": "Estas son las opciones para llegar a $24,000: ...",
  "toolData": null,
  "uiSchema": [
    { "component": "SavingsPlanSimulator", "props": { "targetAmount": 24000, "options": [...] } }
  ],
  "createdAt": "2026-09-13T05:14:29.244Z",
  "readAt": null
}
```

`uiSchema` es `UiComponent[]` (arreglo) o `null` — puede traer 0, 1 o varios componentes en el mismo mensaje, si el agente combinó varias herramientas para responder. Ver `docs/a2ui-contract.md` para el detalle de cada componente y cómo cerrar el ciclo cuando el usuario interactúa con uno de ellos (no hay un endpoint de "acciones" aparte: se reenvía otro mensaje de confirmación a este mismo endpoint).
