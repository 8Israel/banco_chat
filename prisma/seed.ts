import { AccountType, TransactionType, MessageRole, AlertType } from '../src/generated/prisma/enums.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { parseMysqlUrl } from '../src/infrastructure/prisma/parse-mysql-url.util.js';
import { hashPassword } from '../src/common/utils/password.util.js';

const adapter = new PrismaMariaDb(parseMysqlUrl(process.env.DATABASE_URL!));
const prisma = new PrismaClient({ adapter });

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

// -----------------------------------------------------
// Seed
// -----------------------------------------------------
async function main() {
  console.log('🧹 Limpiando datos existentes...');
  await prisma.message.deleteMany();
  await prisma.sessionAgent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ---------------------------------------------------
  // CATEGORÍAS
  // ---------------------------------------------------
  console.log('📁 Creando categorías...');
  const categoryData = [
    { name: 'Salario', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Alimentación', icon: '🍔' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Entretenimiento', icon: '🎬' },
    { name: 'Salud', icon: '🏥' },
    { name: 'Educación', icon: '📚' },
    { name: 'Hogar', icon: '🏠' },
    { name: 'Ropa', icon: '👕' },
    { name: 'Servicios', icon: '💡' },
    { name: 'Restaurantes', icon: '🍽️' },
    { name: 'Viajes', icon: '✈️' },
    { name: 'Suscripciones', icon: '📺' },
    { name: 'Regalos', icon: '🎁' },
  ];

  const categories = await Promise.all(
    categoryData.map((c) => prisma.category.create({ data: c })),
  );

  const incomeCategories = categories.filter((c: any) =>
    ['Salario', 'Freelance'].includes(c.name),
  );
  const expenseCategories = categories.filter(
    (c: any) => !['Salario', 'Freelance'].includes(c.name),
  );

  // ---------------------------------------------------
  // USUARIOS
  // ---------------------------------------------------
  console.log('👤 Creando usuarios...');

  const SEED_PASSWORD = 'password123';
  const hashedPassword = await hashPassword(SEED_PASSWORD);

  const user1 = await prisma.user.create({
    data: {
      name: 'Juan Pérez',
      userName: 'jperez',
      password: hashedPassword,
      phone: '+52 81 1234 5678',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'María López',
      userName: 'mlopez',
      password: hashedPassword,
      phone: '+52 81 8765 4321',
      isActive: true,
    },
  });

  // ---------------------------------------------------
  // CUENTAS
  // ---------------------------------------------------
  console.log('🏦 Creando cuentas...');

  const juanChecking = await prisma.account.create({
    data: {
      userId: user1.id,
      typeAccount: AccountType.DEBIT,
      alias: 'Cuenta Nómina BBVA',
      last4Digits: '4821',
      currentBalance: 18500.75,
    },
  });

  const juanCredit = await prisma.account.create({
    data: {
      userId: user1.id,
      typeAccount: AccountType.CREDIT,
      alias: 'Tarjeta Oro Santander',
      last4Digits: '9012',
      currentBalance: -3450.0,
    },
  });

  const juanSavings = await prisma.account.create({
    data: {
      userId: user1.id,
      typeAccount: AccountType.SAVINGS,
      alias: 'Ahorro Digital',
      last4Digits: '3345',
      currentBalance: 42000.0,
    },
  });

  const juanCash = await prisma.account.create({
    data: {
      userId: user1.id,
      typeAccount: AccountType.CASH,
      alias: 'Efectivo',
      currentBalance: 1200.0,
    },
  });

  const mariaChecking = await prisma.account.create({
    data: {
      userId: user2.id,
      typeAccount: AccountType.DEBIT,
      alias: 'Cuenta Principal Banorte',
      last4Digits: '7710',
      currentBalance: 25300.4,
    },
  });

  const mariaCredit = await prisma.account.create({
    data: {
      userId: user2.id,
      typeAccount: AccountType.CREDIT,
      alias: 'Tarjeta Platinum HSBC',
      last4Digits: '5588',
      currentBalance: -1875.5,
    },
  });

  const mariaSavings = await prisma.account.create({
    data: {
      userId: user2.id,
      typeAccount: AccountType.SAVINGS,
      alias: 'Fondo de Emergencia',
      last4Digits: '2290',
      currentBalance: 60500.0,
    },
  });

  const juanAccounts = [juanChecking, juanCredit, juanSavings, juanCash];
  const mariaAccounts = [mariaChecking, mariaCredit, mariaSavings];

  // ---------------------------------------------------
  // TRANSACCIONES BANCARIAS (últimos 6 meses)
  // ---------------------------------------------------
  console.log('💸 Creando transacciones...');

  const expenseDescriptions: Record<string, string[]> = {
    Alimentación: ['Supermercado Soriana', 'Walmart', 'Costco', 'Mercado local'],
    Transporte: ['Gasolina', 'Uber', 'Mantenimiento auto', 'Estacionamiento'],
    Entretenimiento: ['Cine Cinépolis', 'Boletos concierto', 'Streaming'],
    Salud: ['Farmacia Guadalajara', 'Consulta médica', 'Seguro médico'],
    Educación: ['Curso en línea', 'Libros', 'Colegiatura'],
    Hogar: ['Muebles', 'Ferretería', 'Decoración'],
    Ropa: ['Zara', 'Liverpool', 'Nike Store'],
    Servicios: ['CFE', 'Telmex', 'Agua', 'Gas natural'],
    Restaurantes: ['Starbucks', 'Restaurante La Parrilla', 'Sushi Roll'],
    Viajes: ['Vuelo Aeroméxico', 'Hotel', 'Renta de auto'],
    Suscripciones: ['Netflix', 'Spotify', 'Amazon Prime', 'iCloud'],
    Regalos: ['Regalo cumpleaños', 'Regalo aniversario'],
  };

  async function generateTransactions(
    accounts: typeof juanAccounts,
    monthsBack: number,
    txPerMonth: number,
  ) {
    const txs: {
      accountId: number;
      categoryId: number;
      type: TransactionType;
      amount: number;
      description: string;
      date: Date;
    }[] = [];

    for (let month = 0; month < monthsBack; month++) {
      // Ingreso mensual (salario) en la cuenta de débito principal
      const incomeCat = pick(incomeCategories);
      txs.push({
        accountId: accounts[0].id,
        categoryId: incomeCat.id,
        type: TransactionType.INCOME,
        amount: randomAmount(15000, 28000),
        description: incomeCat.name === 'Salario' ? 'Pago de nómina quincenal' : 'Pago proyecto freelance',
        date: daysAgo(month * 30 + randomInt(0, 3)),
      });

      // Gastos variados distribuidos entre cuentas
      for (let i = 0; i < txPerMonth; i++) {
        const cat = pick(expenseCategories);
        const descOptions = expenseDescriptions[cat.name] ?? ['Gasto varios'];
        txs.push({
          accountId: pick(accounts).id,
          categoryId: cat.id,
          type: TransactionType.EXPENSE,
          amount: randomAmount(50, 3500),
          description: pick(descOptions),
          date: daysAgo(month * 30 + randomInt(0, 29)),
        });
      }
    }

    await prisma.bankTransaction.createMany({ data: txs });
  }

  await generateTransactions(juanAccounts, 6, 10); // ~66 transacciones
  await generateTransactions(mariaAccounts, 6, 8); // ~54 transacciones

  // ---------------------------------------------------
  // TRANSFERENCIAS
  // ---------------------------------------------------
  console.log('🔁 Creando transferencias...');

  await prisma.transfer.createMany({
    data: [
      {
        fromAccountId: juanChecking.id,
        toAccountId: juanSavings.id,
        amount: 5000,
        description: 'Transferencia a ahorro mensual',
        date: daysAgo(15),
      },
      {
        fromAccountId: juanChecking.id,
        toAccountId: juanCash.id,
        amount: 800,
        description: 'Retiro de efectivo',
        date: daysAgo(7),
      },
      {
        fromAccountId: mariaChecking.id,
        toAccountId: mariaSavings.id,
        amount: 7500,
        description: 'Aportación fondo de emergencia',
        date: daysAgo(20),
      },
      {
        fromAccountId: mariaChecking.id,
        toAccountId: mariaSavings.id,
        amount: 3000,
        description: 'Aportación extra',
        date: daysAgo(45),
      },
    ],
  });

  // ---------------------------------------------------
  // PRESUPUESTOS
  // ---------------------------------------------------
  console.log('📊 Creando presupuestos...');

  const alimentacion = categories.find((c) => c.name === 'Alimentación')!;
  const entretenimiento = categories.find((c) => c.name === 'Entretenimiento')!;
  const restaurantes = categories.find((c) => c.name === 'Restaurantes')!;
  const ropa = categories.find((c) => c.name === 'Ropa')!;

  const startPeriod = daysAgo(30);
  const endPeriod = new Date();

  await prisma.budget.createMany({
    data: [
      {
        accountId: juanChecking.id,
        categoryId: alimentacion.id,
        limitAmount: 6000,
        startPeriod,
        endPeriod,
      },
      {
        accountId: juanCredit.id,
        categoryId: entretenimiento.id,
        limitAmount: 1500,
        startPeriod,
        endPeriod,
      },
      {
        accountId: mariaChecking.id,
        categoryId: alimentacion.id,
        limitAmount: 5500,
        startPeriod,
        endPeriod,
      },
      {
        accountId: mariaCredit.id,
        categoryId: ropa.id,
        limitAmount: 2000,
        startPeriod,
        endPeriod,
      },
      {
        accountId: mariaCredit.id,
        categoryId: restaurantes.id,
        limitAmount: 1800,
        startPeriod,
        endPeriod,
      },
    ],
  });

  // ---------------------------------------------------
  // METAS DE AHORRO
  // ---------------------------------------------------
  console.log('🎯 Creando metas de ahorro...');

  await prisma.savingsGoal.createMany({
    data: [
      {
        accountId: juanSavings.id,
        name: 'Enganche de auto',
        targetAmount: 80000,
        actualAmount: 42000,
      },
      {
        accountId: juanSavings.id,
        name: 'Vacaciones fin de año',
        targetAmount: 15000,
        actualAmount: 6200,
      },
      {
        accountId: mariaSavings.id,
        name: 'Fondo de emergencia (6 meses)',
        targetAmount: 90000,
        actualAmount: 60500,
      },
    ],
  });

  // ---------------------------------------------------
  // ALERTAS
  // ---------------------------------------------------
  console.log('🚨 Creando alertas...');

  await prisma.alert.createMany({
    data: [
      {
        accountId: juanCredit.id,
        type: AlertType.BUDGET_WARNING,
        description: 'Estás cerca del límite de presupuesto en Entretenimiento (85%)',
        isRead: false,
        triggeredAt: daysAgo(3),
      },
      {
        accountId: juanChecking.id,
        type: AlertType.LOW_BALANCE,
        description: 'Saldo bajo detectado en tu cuenta principal',
        isRead: true,
        triggeredAt: daysAgo(10),
      },
      {
        accountId: juanSavings.id,
        type: AlertType.SAVINGS_GOAL,
        description: 'Vas al 52% de tu meta "Enganche de auto"',
        isRead: false,
        triggeredAt: daysAgo(1),
      },
      {
        accountId: mariaCredit.id,
        type: AlertType.BUDGET_EXCEEDED,
        description: 'Superaste el presupuesto de Ropa este mes',
        isRead: false,
        triggeredAt: daysAgo(2),
      },
      {
        accountId: mariaSavings.id,
        type: AlertType.GENERAL,
        description: 'Recordatorio: revisa tus movimientos de la quincena',
        isRead: true,
        triggeredAt: daysAgo(14),
      },
    ],
  });

  // ---------------------------------------------------
  // SESIONES DE AGENTE + MENSAJES (para probar LLM/MCP)
  // ---------------------------------------------------
  console.log('🤖 Creando sesiones de agente y mensajes...');

  const juanSession1 = await prisma.sessionAgent.create({
    data: {
      userId: user1.id,
      createdAt: daysAgo(5),
      finishedAt: daysAgo(5),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        sessionId: juanSession1.id,
        role: MessageRole.USER,
        content: '¿Cuánto he gastado en restaurantes este mes?',
        createdAt: daysAgo(5),
        readAt: daysAgo(5),
      },
      {
        sessionId: juanSession1.id,
        role: MessageRole.ASSISTANT,
        content: 'Voy a consultar tus transacciones de la categoría Restaurantes de este mes.',
        createdAt: daysAgo(5),
        readAt: daysAgo(5),
      },
      {
        sessionId: juanSession1.id,
        role: MessageRole.TOOL,
        content: JSON.stringify({ tool: 'get_transactions_by_category', category: 'Restaurantes', total: 1240.5 }),
        createdAt: daysAgo(5),
        readAt: daysAgo(5),
      },
      {
        sessionId: juanSession1.id,
        role: MessageRole.ASSISTANT,
        content: 'Has gastado $1,240.50 MXN en restaurantes este mes, distribuidos en 6 transacciones.',
        uiSchema: { type: 'summary_card', value: 1240.5, currency: 'MXN' },
        createdAt: daysAgo(5),
        readAt: daysAgo(5),
      },
    ],
  });

  const juanSession2 = await prisma.sessionAgent.create({
    data: {
      userId: user1.id,
      createdAt: daysAgo(1),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        sessionId: juanSession2.id,
        role: MessageRole.USER,
        content: '¿Voy bien con mi meta de ahorro para el auto?',
        createdAt: daysAgo(1),
      },
      {
        sessionId: juanSession2.id,
        role: MessageRole.ASSISTANT,
        content: 'Llevas $42,000 de $80,000, es decir 52.5% de tu meta "Enganche de auto". Vas por buen camino.',
        createdAt: daysAgo(1),
      },
    ],
  });

  const mariaSession1 = await prisma.sessionAgent.create({
    data: {
      userId: user2.id,
      createdAt: daysAgo(2),
      finishedAt: daysAgo(2),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        sessionId: mariaSession1.id,
        role: MessageRole.USER,
        content: 'Dame un resumen de mis finanzas del último mes',
        createdAt: daysAgo(2),
        readAt: daysAgo(2),
      },
      {
        sessionId: mariaSession1.id,
        role: MessageRole.ASSISTANT,
        content: 'Claro, dame un momento para revisar tus cuentas y transacciones.',
        createdAt: daysAgo(2),
        readAt: daysAgo(2),
      },
      {
        sessionId: mariaSession1.id,
        role: MessageRole.TOOL,
        content: JSON.stringify({ tool: 'get_monthly_summary', income: 22000, expenses: 15300, savings: 7500 }),
        createdAt: daysAgo(2),
        readAt: daysAgo(2),
      },
      {
        sessionId: mariaSession1.id,
        role: MessageRole.ASSISTANT,
        content: 'Este mes tuviste ingresos de $22,000, gastos de $15,300 y ahorraste $7,500. ¡Buen balance!',
        uiSchema: { type: 'balance_chart', income: 22000, expenses: 15300, savings: 7500 },
        createdAt: daysAgo(2),
        readAt: daysAgo(2),
      },
    ],
  });

  console.log('✅ Seed completado con éxito.');
  console.log(`   Usuario 1: ${user1.userName} (id: ${user1.id}) — password: ${SEED_PASSWORD}`);
  console.log(`   Usuario 2: ${user2.userName} (id: ${user2.id}) — password: ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
