import { totals } from './orders.js';
import { stockOf } from './stock.js';

export const activePick = item => item.status === 'open' || item.status === 'gepakt';
export const recentFirst = (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, 'nl', { numeric: true });

export function dashboard(state) {
  const products = new Map(state.products.map(product => [product.id, product]));
  const shipped = state.sales.filter(order => order.status === 'verzonden');
  const salesByMonth = new Map();
  const articles = new Map();
  let revenue = 0;
  for (const order of shipped) {
    const month = order.shippedAt.slice(0, 7);
    const net = totals(order.lines).net;
    salesByMonth.set(month, (salesByMonth.get(month) ?? 0) + net);
    revenue += net;
    for (const line of order.lines) {
      const current = articles.get(line.productId) ?? { id: line.productId, count: 0, revenue: 0 };
      current.count += line.quantity;
      current.revenue += line.quantity * line.price;
      articles.set(line.productId, current);
    }
  }
  return {
    revenue,
    inventoryValue: state.balances.reduce((sum, row) => sum + row.physical * products.get(row.productId).purchasePrice, 0),
    openSales: state.sales.filter(order => ['concept', 'bevestigd', 'gepikt'].includes(order.status)).length,
    openPurchases: state.purchases.filter(order => order.status !== 'ontvangen').length,
    picks: state.picks.filter(activePick).length,
    low: state.products.filter(product => stockOf(state, product.id).available < product.minimum),
    months: [...salesByMonth].sort(([a], [b]) => a.localeCompare(b)).slice(-6),
    best: [...articles.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    recent: [...state.movements].sort(recentFirst).slice(0, 5),
  };
}
