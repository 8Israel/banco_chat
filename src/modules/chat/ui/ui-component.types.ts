/**
 * Contrato A2UI: lo que el agente puede pedirle a un frontend que renderice.
 * Viaja en Message.uiSchema (ver chat.service.ts) y está documentado para el
 * equipo de frontend en docs/a2ui-contract.md — cualquier componente nuevo
 * se agrega acá primero y se refleja ahí.
 */

export interface AccountCardProps {
    id: number;
    typeAccount: 'DEBIT' | 'CREDIT' | 'CASH' | 'SAVINGS';
    alias: string | null;
    currentBalance: number;
}

export interface SavingsPlanOption {
    months: number;
    monthlyContribution: number;
}

export interface SavingsGoalCardProps {
    id: number;
    name: string;
    targetAmount: number;
    actualAmount: number;
    progressPercent: number;
}

export interface TransactionCardProps {
    id: number;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string | null;
    date: string;
    categoryName: string;
}

export interface MonthlySummaryCardProps {
    month: string;
    income: number;
    expenses: number;
    savings: number;
}

export interface SpendingByCategoryItem {
    categoryName: string;
    total: number;
}

export interface BudgetCardProps {
    id: number;
    categoryName: string;
    limitAmount: number;
    startPeriod: string;
    endPeriod: string;
}

export interface BudgetStatusCardProps {
    id: number;
    categoryName: string;
    limitAmount: number;
    spent: number;
    remaining: number;
    percentage: number;
}

export interface TransferCardProps {
    id: number;
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description: string | null;
    date: string;
}

export type UiComponent =
    | { component: 'AccountCard'; props: AccountCardProps }
    | { component: 'AccountsList'; props: { accounts: AccountCardProps[] } }
    | { component: 'SavingsPlanSimulator'; props: { targetAmount: number; options: SavingsPlanOption[] } }
    | { component: 'SavingsGoalCard'; props: SavingsGoalCardProps }
    | { component: 'SavingsGoalsList'; props: { goals: SavingsGoalCardProps[] } }
    | { component: 'TransactionCard'; props: TransactionCardProps }
    | { component: 'TransactionsList'; props: { transactions: TransactionCardProps[] } }
    | { component: 'MonthlySummaryCard'; props: MonthlySummaryCardProps }
    | { component: 'SpendingByCategoryList'; props: { items: SpendingByCategoryItem[] } }
    | { component: 'BudgetCard'; props: BudgetCardProps }
    | { component: 'BudgetsList'; props: { budgets: BudgetCardProps[] } }
    | { component: 'BudgetStatusCard'; props: BudgetStatusCardProps }
    | { component: 'TransferCard'; props: TransferCardProps }
    | { component: 'TransfersList'; props: { transfers: TransferCardProps[] } };
