import { AccountType, TransactionType, AlertType } from '../src/generated/prisma/enums.js';
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
  // TRANSACCIONES BANCARIAS (últimos 12 meses)
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

  await generateTransactions(juanAccounts, 12, 22); // ~276 transacciones (12 meses)
  await generateTransactions(mariaAccounts, 12, 18); // ~228 transacciones (12 meses)

  // ---------------------------------------------------
  // TRANSFERENCIAS
  // ---------------------------------------------------
  console.log('🔁 Creando transferencias...');

  const transfers: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description: string;
    date: Date;
  }[] = [];

  for (let month = 0; month < 12; month++) {
    transfers.push({
      fromAccountId: juanChecking.id,
      toAccountId: juanSavings.id,
      amount: randomAmount(2000, 6000),
      description: 'Transferencia a ahorro mensual',
      date: daysAgo(month * 30 + randomInt(1, 5)),
    });

    if (month % 2 === 0) {
      transfers.push({
        fromAccountId: juanChecking.id,
        toAccountId: juanCash.id,
        amount: randomAmount(300, 1200),
        description: 'Retiro de efectivo',
        date: daysAgo(month * 30 + randomInt(10, 20)),
      });
    }

    transfers.push({
      fromAccountId: mariaChecking.id,
      toAccountId: mariaSavings.id,
      amount: randomAmount(1500, 7500),
      description: pick(['Aportación fondo de emergencia', 'Aportación extra', 'Ahorro programado']),
      date: daysAgo(month * 30 + randomInt(1, 25)),
    });
  }

  await prisma.transfer.createMany({ data: transfers });

  // ---------------------------------------------------
  // PRESUPUESTOS
  // ---------------------------------------------------
  console.log('📊 Creando presupuestos...');

  const alimentacion = categories.find((c) => c.name === 'Alimentación')!;
  const entretenimiento = categories.find((c) => c.name === 'Entretenimiento')!;
  const restaurantes = categories.find((c) => c.name === 'Restaurantes')!;
  const ropa = categories.find((c) => c.name === 'Ropa')!;
  const transporte = categories.find((c) => c.name === 'Transporte')!;
  const servicios = categories.find((c) => c.name === 'Servicios')!;

  const budgets: {
    accountId: number;
    categoryId: number;
    limitAmount: number;
    startPeriod: Date;
    endPeriod: Date;
  }[] = [];

  function monthlyPeriod(monthsBack: number): { startPeriod: Date; endPeriod: Date } {
    const endPeriod = daysAgo(monthsBack * 30);
    const startPeriod = daysAgo(monthsBack * 30 + 30);
    return { startPeriod, endPeriod };
  }

  for (let month = 0; month < 6; month++) {
    const { startPeriod, endPeriod } = monthlyPeriod(month);

    budgets.push(
      { accountId: juanChecking.id, categoryId: alimentacion.id, limitAmount: randomAmount(5500, 6500), startPeriod, endPeriod },
      { accountId: juanCredit.id, categoryId: entretenimiento.id, limitAmount: randomAmount(1200, 1800), startPeriod, endPeriod },
      { accountId: juanCredit.id, categoryId: transporte.id, limitAmount: randomAmount(1500, 2500), startPeriod, endPeriod },
      { accountId: mariaChecking.id, categoryId: alimentacion.id, limitAmount: randomAmount(5000, 6000), startPeriod, endPeriod },
      { accountId: mariaCredit.id, categoryId: ropa.id, limitAmount: randomAmount(1800, 2500), startPeriod, endPeriod },
      { accountId: mariaCredit.id, categoryId: restaurantes.id, limitAmount: randomAmount(1500, 2200), startPeriod, endPeriod },
      { accountId: mariaChecking.id, categoryId: servicios.id, limitAmount: randomAmount(1000, 1800), startPeriod, endPeriod },
    );
  }

  await prisma.budget.createMany({ data: budgets });

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
        accountId: juanSavings.id,
        name: 'Fondo para laptop nueva',
        targetAmount: 25000,
        actualAmount: 9800,
      },
      {
        accountId: mariaSavings.id,
        name: 'Fondo de emergencia (6 meses)',
        targetAmount: 90000,
        actualAmount: 60500,
      },
      {
        accountId: mariaSavings.id,
        name: 'Remodelación cocina',
        targetAmount: 45000,
        actualAmount: 12500,
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
        accountId: juanCredit.id,
        type: AlertType.BUDGET_EXCEEDED,
        description: 'Superaste el presupuesto de Transporte hace 2 meses',
        isRead: true,
        triggeredAt: daysAgo(65),
      },
      {
        accountId: juanChecking.id,
        type: AlertType.GENERAL,
        description: 'Tu resumen mensual de finanzas ya está disponible',
        isRead: true,
        triggeredAt: daysAgo(95),
      },
      {
        accountId: juanSavings.id,
        type: AlertType.SAVINGS_GOAL,
        description: 'Nueva meta creada: "Fondo para laptop nueva"',
        isRead: true,
        triggeredAt: daysAgo(120),
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
      {
        accountId: mariaChecking.id,
        type: AlertType.LOW_BALANCE,
        description: 'Saldo bajo detectado tras pagos de servicios',
        isRead: true,
        triggeredAt: daysAgo(50),
      },
      {
        accountId: mariaSavings.id,
        type: AlertType.SAVINGS_GOAL,
        description: 'Vas al 27% de tu meta "Remodelación cocina"',
        isRead: false,
        triggeredAt: daysAgo(8),
      },
      {
        accountId: mariaCredit.id,
        type: AlertType.BUDGET_WARNING,
        description: 'Estás cerca del límite de presupuesto en Restaurantes (78%)',
        isRead: true,
        triggeredAt: daysAgo(80),
      },
    ],
  });

  // ---------------------------------------------------
  // Nota: session_agents y messages NO se siembran aquí.
  // Esas tablas se llenan orgánicamente con el uso real del chat/agente.
  // ---------------------------------------------------

  console.log('✅ Seed completado con éxito.');
  console.log('');
  console.log('🔑 Credenciales de acceso:');
  console.log(`   Usuario 1 -> userName: ${user1.userName}  |  password: ${SEED_PASSWORD}  (id: ${user1.id})`);
  console.log(`   Usuario 2 -> userName: ${user2.userName}  |  password: ${SEED_PASSWORD}  (id: ${user2.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
