import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCards({ data }: any) {
  if (!data) return null;

  const formatRp = (n: number) =>
    Number(n || 0).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });

  const totalIncomes = Number(data.summary?.total_incomes || 0);
  const totalExpenses = Number(data.summary?.total_expenses || 0);
  const incomeCash = Number(data.summary?.income_by_method?.cash || 0);
  const incomeQris = Number(data.summary?.income_by_method?.qris || 0);
  const expenseCash = Number(data.summary?.expense_by_method?.cash || 0);
  const expenseQris = Number(data.summary?.expense_by_method?.qris || 0);

  // Perhitungan saldo akhir dengan breakdown yang benar
  const endingBalance = totalIncomes - totalExpenses;
  const endingCash = incomeCash - expenseCash;
  const endingQris = incomeQris - expenseQris;

  const getBalanceColor = (amount: number) =>
    amount >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Card 1: Total Pemasukan */}
      <Card className="border-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-green-700">
            Total Pemasukan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">
            {formatRp(totalIncomes)}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Cash</span>
              <span className="font-medium">{formatRp(incomeCash)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">QRIS</span>
              <span className="font-medium">{formatRp(incomeQris)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Pengeluaran */}
      <Card className="border-red-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-red-700">
            Total Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">
            {formatRp(totalExpenses)}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Cash</span>
              <span className="font-medium">{formatRp(expenseCash)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">QRIS</span>
              <span className="font-medium">{formatRp(expenseQris)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Saldo Akhir */}
      <Card className="border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-blue-700">
            Saldo Akhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${getBalanceColor(endingBalance)}`}>
            {formatRp(endingBalance)}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Cash</span>
              <span className={`font-medium ${getBalanceColor(endingCash)}`}>
                {formatRp(endingCash)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">QRIS</span>
              <span className={`font-medium ${getBalanceColor(endingQris)}`}>
                {formatRp(endingQris)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
