'use client';

import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import { formatMoney, formatPercentage } from '@/lib/format/money';

import {
  useCommercialIndicators,
  useDashboard,
  useFinancialIndicators,
} from '../api';
import { PeriodFields, usePeriod } from './period-fields';
import { RankTable } from './rank-table';
import { StatTile } from './stat-tile';

const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
const sectionTitle = 'font-heading text-lg font-semibold';

// Lo que necesita atención hoy: no depende del período.
function TodaySection() {
  const board = useDashboard().data;
  if (!board) return null;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="today-title">
      <h2 id="today-title" className={sectionTitle}>
        Hoy
      </h2>
      <div className={grid}>
        <StatTile
          label="Solicitudes por cotizar"
          value={board.pending_requests}
          href="/por-cotizar"
        />
        <StatTile
          label="Cotizaciones en borrador"
          value={board.quotes_draft}
          href="/cotizaciones?status=draft"
        />
        <StatTile
          label="Enviadas vigentes"
          value={board.quotes_sent}
          href="/cotizaciones?status=sent"
        />
        <StatTile
          label="Enviadas vencidas"
          value={board.quotes_expired}
          href="/cotizaciones?status=expired"
          attention={board.quotes_expired > 0}
        />
        <StatTile
          label="Seguimientos vencidos"
          value={board.follow_ups_red}
          hint={`${board.follow_ups_yellow} para hoy o mañana`}
          href="/seguimientos"
          attention={board.follow_ups_red > 0}
        />
        <StatTile
          label="Reservas por solicitar"
          value={board.bookings_to_request}
          href="/reservas"
          attention={board.bookings_to_request > 0}
        />
        <StatTile label="Viajes en 30 días" value={board.trips_next_30_days} />
        <StatTile
          label="Por cobrar a clientes"
          value={formatMoney(board.receivable)}
          href="/ventas?status=partial"
        />
      </div>
    </section>
  );
}

export function DashboardScreen() {
  const canViewFinance = useHasPermission('finance.view');
  const [period, setPeriod] = usePeriod();
  const commercial = useCommercialIndicators(period).data;
  const financial = useFinancialIndicators(period, canViewFinance).data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Reportes / 01"
        title="Dashboard"
        description="Cómo va la agencia: lo pendiente de hoy y los indicadores del período."
      />
      <TodaySection />
      <div className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Indicadores del período</h2>
        <PeriodFields
          period={period}
          onChange={(patch) => void setPeriod(patch)}
        />
      </div>
      {commercial && (
        <section
          className="flex flex-col gap-4"
          aria-label="Indicadores comerciales"
        >
          <div className={grid}>
            <StatTile
              label="Solicitudes recibidas"
              value={commercial.requests_received}
            />
            <StatTile
              label="Cotizaciones creadas"
              value={commercial.quotes_created}
            />
            <StatTile
              label="Conversión"
              value={
                commercial.conversion_percent
                  ? formatPercentage(commercial.conversion_percent)
                  : '—'
              }
              hint={`${commercial.quotes_accepted} aceptadas de ${
                commercial.quotes_accepted + commercial.quotes_rejected
              } decididas`}
            />
            <StatTile label="Clientes nuevos" value={commercial.new_clients} />
            <StatTile label="Ventas" value={commercial.sales_count} />
            <StatTile
              label="Total vendido"
              value={formatMoney(commercial.sales_amount)}
            />
            <StatTile
              label="Ticket promedio"
              value={
                commercial.average_ticket === null
                  ? '—'
                  : formatMoney(commercial.average_ticket)
              }
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <RankTable
              title="Destinos más vendidos"
              rows={commercial.top_destinations}
              measure="amount"
              countLabel="Ventas"
            />
            <RankTable
              title="Ventas por asesor"
              rows={commercial.sales_by_advisor}
              measure="amount"
              countLabel="Ventas"
            />
            <RankTable
              title="Servicios vendidos por tipo"
              rows={commercial.sales_by_service_type}
              measure="count"
              countLabel="Servicios"
            />
          </div>
        </section>
      )}
      {financial && (
        <section
          className="flex flex-col gap-3"
          aria-labelledby="financial-title"
        >
          <h2 id="financial-title" className={sectionTitle}>
            Indicadores financieros
          </h2>
          <div className={grid}>
            <StatTile
              label="Ganancia de lo vendido"
              value={formatMoney(financial.estimated_profit)}
              hint={
                financial.margin_percent
                  ? `${formatPercentage(financial.margin_percent)} de margen`
                  : undefined
              }
            />
            <StatTile
              label="Ingresos (caja)"
              value={formatMoney(financial.income)}
            />
            <StatTile
              label="Egresos (caja)"
              value={formatMoney(financial.expenses)}
            />
            <StatTile
              label="Resultado de caja"
              value={formatMoney(financial.net)}
              attention={financial.net < 0}
              href="/finanzas"
            />
            <StatTile
              label="Por cobrar"
              value={formatMoney(financial.receivable)}
            />
            <StatTile
              label="Por pagar a proveedores"
              value={formatMoney(financial.payable)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
