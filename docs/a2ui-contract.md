# Contrato A2UI (backend ↔ Angular)

Este documento es el contrato entre el backend de chat (NestJS + LLM + MCP) y el frontend Angular. El backend nunca envía HTML ni componentes: envía un **JSON de UI** (`uiSchema`) que Angular interpreta y renderiza con sus propios componentes.

## Dónde viaja el `uiSchema`

Cada mensaje devuelto por el chat trae esta forma:

```
POST /chat/sessions/:id/messages
Body: { "content": "<texto del usuario>" }

Response.data = {
  "id": number,
  "sessionId": number,
  "role": "ASSISTANT",
  "content": string,          // texto en lenguaje natural, siempre presente
  "uiSchema": UiComponent[] | null,  // 0, 1 o varios componentes; null si no hubo ninguno
  "createdAt": string
}
```

`content` siempre se puede mostrar tal cual (es la respuesta conversacional). **`uiSchema` es un arreglo, no un objeto único** — cuando el agente resuelve la pregunta combinando más de una tool en el mismo turno (ej. "dame un resumen de mis ahorros" dispara `get_savings_goals` y `get_monthly_summary` a la vez), cada una puede aportar su propio componente, y todos viajan juntos en el arreglo, en el orden en que se generaron. Angular debe iterar `uiSchema` y renderizar cada componente en secuencia (una tarjeta debajo de la otra), no asumir que solo hay uno. Si `uiSchema` es `null` o `[]`, no hubo ninguna interfaz generada — mostrar solo `content`.

## Cómo implementarlo en Angular (no es 1 componente Angular por cada `component`)

Los 13 valores de `component` listados abajo son **discriminadores**, no una lista de 13 clases de Angular que hay que programar una por una. Son solo la clave que Angular usa para decidir qué pintar; nada obliga a que cada uno tenga su propio componente sin relación con los demás. Si se mira la forma de los `props`, hay 3 patrones que se repiten:

- **Listas** (`AccountsList`, `SavingsGoalsList`, `TransactionsList`, `BudgetsList`, `TransfersList`): todas son `{ items: CardProps[] }` con distinto nombre de campo. Un solo componente genérico de tabla/lista, con la config de columnas como parámetro, cubre las 5.
- **Tarjetas de detalle** (`SavingsGoalCard`, `TransactionCard`, `BudgetCard`, `BudgetStatusCard`, `TransferCard`): todas son "un objeto con unos campos clave-valor". Un componente genérico de tarjeta, con la config de campos como parámetro, cubre las 5 (y de paso sirve como fila dentro del componente de lista).
- **Los 3 restantes son genuinamente distintos** por su interacción o visual: `SavingsPlanSimulator` (necesita un botón de acción por opción), `MonthlySummaryCard` y `SpendingByCategoryList` (pensados para un gráfico/resumen, no una tabla).

Con esto, el sistema de componentes real en Angular puede quedar en ~4 piezas (una tarjeta genérica, una lista genérica, el simulador de plan, y un widget de resumen/gráfica) más un **registro** que mapea cada uno de los 13 nombres de `component` a cuál pieza usar y con qué config de campos — no 13 archivos sueltos. Esto es justo lo que pide el reto: un sistema de componentes propio que el agente invoca, reutilizable, no una explosión de componentes de un solo uso.

## Componentes (`UiComponent`)

Definidos en `src/modules/chat/ui/ui-component.types.ts` del backend. Para cada `component`, esta es la forma que trae `props`:

### `AccountsList`

Se muestra cuando el usuario pide ver sus cuentas.

```json
{
  "component": "AccountsList",
  "props": {
    "accounts": [
      { "id": 22, "typeAccount": "DEBIT", "alias": "Cuenta Nómina BBVA", "currentBalance": 18200.75 }
    ]
  }
}
```

### `SavingsPlanSimulator`

Se muestra cuando el usuario pide simular un ahorro, antes de crear nada.

```json
{
  "component": "SavingsPlanSimulator",
  "props": {
    "targetAmount": 24000,
    "options": [
      { "months": 12, "monthlyContribution": 2000 },
      { "months": 18, "monthlyContribution": 1333.33 },
      { "months": 24, "monthlyContribution": 1000 }
    ]
  }
}
```

Angular pinta las 3 opciones (tipo las tarjetas "12/18/24 meses" del mockup) con un botón por opción, ej. "Crear esta meta".

### `SavingsGoalCard`

Se muestra al crear una meta o al registrar un aporte.

```json
{
  "component": "SavingsGoalCard",
  "props": {
    "id": 13,
    "name": "Vacaciones 2027",
    "targetAmount": 24000,
    "actualAmount": 500,
    "progressPercent": 2.08
  }
}
```

### `SavingsGoalsList`

Se muestra cuando el usuario pide ver sus metas existentes.

```json
{
  "component": "SavingsGoalsList",
  "props": { "goals": [ /* SavingsGoalCard.props[] */ ] }
}
```

### `TransactionCard`

Se muestra al registrar un movimiento nuevo (ingreso o gasto).

```json
{
  "component": "TransactionCard",
  "props": {
    "id": 482,
    "type": "EXPENSE",
    "amount": 150,
    "description": null,
    "date": "2026-09-13T00:00:00.000Z",
    "categoryName": "Restaurantes"
  }
}
```

### `TransactionsList`

Se muestra cuando el usuario pide ver sus movimientos.

```json
{
  "component": "TransactionsList",
  "props": { "transactions": [ /* TransactionCard.props[] */ ] }
}
```

### `MonthlySummaryCard`

Resumen de ingresos/gastos/ahorro de un mes.

```json
{
  "component": "MonthlySummaryCard",
  "props": { "month": "2026-09", "income": 22000, "expenses": 15300, "savings": 6700 }
}
```

### `SpendingByCategoryList`

Gasto agrupado por categoría (para un gráfico de barras o una lista ordenada).

```json
{
  "component": "SpendingByCategoryList",
  "props": {
    "items": [
      { "categoryName": "Restaurantes", "total": 4639.49 },
      { "categoryName": "Regalos", "total": 3491.55 }
    ]
  }
}
```

### `BudgetCard`

Se muestra al crear un presupuesto nuevo.

```json
{
  "component": "BudgetCard",
  "props": {
    "id": 16,
    "categoryName": "Alimentación",
    "limitAmount": 6000,
    "startPeriod": "2026-08-14T04:47:56.263Z",
    "endPeriod": "2026-09-13T04:47:56.263Z"
  }
}
```

### `BudgetsList`

Se muestra cuando el usuario pide ver sus presupuestos.

```json
{
  "component": "BudgetsList",
  "props": { "budgets": [ /* BudgetCard.props[] */ ] }
}
```

### `BudgetStatusCard`

Se muestra al consultar el avance de un presupuesto específico.

```json
{
  "component": "BudgetStatusCard",
  "props": {
    "id": 16,
    "categoryName": "Alimentación",
    "limitAmount": 6000,
    "spent": 3378.41,
    "remaining": 2621.59,
    "percentage": 56.31
  }
}
```

### `TransferCard`

Se muestra al realizar una transferencia real entre cuentas propias.

```json
{
  "component": "TransferCard",
  "props": {
    "id": 18,
    "fromAccountId": 22,
    "toAccountId": 24,
    "amount": 300,
    "description": "Transferencia a Ahorro Digital",
    "date": "2026-09-13T05:32:20.527Z"
  }
}
```

### `TransfersList`

Se muestra cuando el usuario pide ver su historial de transferencias.

```json
{
  "component": "TransfersList",
  "props": { "transfers": [ /* TransferCard.props[] */ ] }
}
```

## Cómo cerrar el ciclo (acción del usuario → el LLM actúa)

Cuando la persona toca un botón de acción en un componente generado (ej. "Crear esta meta" en `SavingsPlanSimulator`, "Aportar" en `SavingsGoalCard`, o "Confirmar transferencia"), **Angular no llama un endpoint nuevo**: reenvía un mensaje de chat normal a `POST /chat/sessions/:id/messages`, con un texto de confirmación que describa la acción elegida. El LLM, que todavía tiene el resultado anterior en su contexto, decide llamar la tool real y la acción se ejecuta de verdad contra la base de datos.

El backend tiene instruido al LLM para que **nunca ejecute una acción que mueva o comprometa dinero** (`create_transaction`, `create_transfer`, `create_budget`, `create_savings_goal`, `contribute_savings_goal`) en el mismo turno en que se la piden por primera vez, aunque ya tenga todos los datos: siempre resume la operación y espera una confirmación explícita antes de ejecutarla. Esto significa que, para cualquiera de estas acciones, el flujo real siempre son al menos 2 mensajes: uno donde el usuario pide la acción (el LLM responde con el resumen, `uiSchema: null`) y otro de confirmación (ahí sí ejecuta y responde con el `uiSchema` de la tarjeta resultante).

Ejemplos de texto de confirmación sugerido por acción:

| Botón en la UI | Texto de confirmación a enviar |
|---|---|
| "Crear esta meta" (opción de 12 meses, monto 24000) | `"Sí, crea la meta con el plan de 12 meses"` |
| "Aportar $500 ahora" | `"Aporta 500 a mi meta {name}"` |
| "Confirmar transferencia" | `"Sí, confirmo la transferencia"` |
| "Registrar gasto" | `"Sí, regístralo"` |

El mensaje de respuesta a esa confirmación trae el `uiSchema` actualizado con los datos reales ya persistidos, que Angular debe volver a renderizar para reflejar el resultado.

## Notas

- Los montos (`targetAmount`, `actualAmount`, `amount`, `limitAmount`, etc.) siempre llegan como `number` en pesos, ya redondeados a 2 decimales. Las fechas llegan como string ISO 8601.
- Si `uiSchema` es `null`, es una respuesta puramente conversacional (el agente respondió con texto, no generó ninguna interfaz, o está pidiendo confirmación antes de actuar) — Angular debe mostrar solo `content`.
- El contrato es aditivo: si se agrega un nuevo tipo de `component`, Angular debe tratar un `component` desconocido como "sin UI" y mostrar solo `content`, para no romper con versiones futuras del backend.
