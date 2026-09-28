import React, { useEffect, useRef, useState } from "react";
import { formatBRL } from "../../../utils/format/format";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTH_LABELS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

// Cores validadas para daltonismo (receita = azul da marca)
const COLORS = {
  revenue: "#006BA8",
  expense: "#EB6834",
  profit: "#1BAF7A",
};

const SERIES = [
  { key: "revenue", label: "Receita" },
  { key: "expense", label: "Despesa" },
  { key: "profit", label: "Lucro" },
];

const compactBRL = (value) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}R$ ${k.toLocaleString("pt-BR", {
      maximumFractionDigits: k >= 10 ? 0 : 1,
    })} mil`;
  }
  return `${sign}R$ ${Math.round(abs)}`;
};

// Escala "bonita" para o eixo: 4 divisões com passos redondos
const niceStep = (range) => {
  const raw = range / 4;
  if (raw <= 0) return 250;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
};

const Card = ({ title, subtitle, children, className = "" }) => (
  <section
    className={`min-w-0 rounded-2xl border border-cinza9 bg-bg1 p-4 shadow-card md:p-5 ${className}`}
  >
    <h2 className="font-ubuntu text-base font-semibold text-texto1 md:text-lg">
      {title}
    </h2>
    {subtitle && <p className="text-xs text-texto3">{subtitle}</p>}
    {children}
  </section>
);

const ReceivedCard = ({ billing }) => {
  const { total, received, open, openPercent, patients } = billing;
  const receivedPercent = total ? Math.min((received / total) * 100, 100) : 0;

  return (
    <Card
      title="Recebido x Em aberto"
      subtitle="Consultas do mês selecionado"
      className="flex flex-col"
    >
      {total === 0 ? (
        <p className="mt-6 text-sm text-texto3">
          Nenhuma consulta faturada neste mês.
        </p>
      ) : (
        <>
          <p className="mt-4 font-ubuntu text-2xl font-bold text-texto1">
            {formatBRL(received)}
            <span className="ml-1 text-sm font-normal text-texto3">
              de {formatBRL(total)}
            </span>
          </p>

          <div
            className="mt-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-cinza9"
            role="img"
            aria-label={`${Math.round(receivedPercent)}% recebido`}
          >
            {receivedPercent > 0 && (
              <div
                className="h-full rounded-full bg-primaria transition-all duration-500"
                style={{ width: `${receivedPercent}%` }}
              />
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-clara4 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-texto3">
                <span className="h-2 w-2 rounded-full bg-primaria" />
                Recebido
              </dt>
              <dd className="mt-0.5 font-semibold text-texto1">
                {Math.round(receivedPercent)}%
              </dd>
            </div>
            <div className="rounded-xl bg-clara4 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-texto3">
                <span className="h-2 w-2 rounded-full bg-cinza6" />
                Em aberto
              </dt>
              <dd className="mt-0.5 font-semibold text-texto1">
                {formatBRL(open)}{" "}
                <span className="font-normal text-texto3">
                  · {Math.round(openPercent)}%
                </span>
              </dd>
            </div>
          </dl>

          {patients && (
            <div className="mt-4 border-t border-cinza9 pt-3 lg:mt-auto">
              <p className="text-xs font-semibold uppercase tracking-wide text-texto3">
                Pacientes
              </p>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                <li className="rounded-full bg-green-50 px-2.5 py-1 text-green-700 ring-1 ring-inset ring-green-600/20">
                  {patients.paid} {patients.paid === 1 ? "pago" : "pagos"}
                </li>
                <li className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  {patients.partial} {patients.partial === 1 ? "parcial" : "parciais"}
                </li>
                <li className="rounded-full bg-slate-100 px-2.5 py-1 text-texto3 ring-1 ring-inset ring-slate-500/20">
                  {patients.open} em aberto
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

const HistoryChart = ({ history, selectedMonth, selectedYear }) => {
  const wrapperRef = useRef(null);
  const [width, setWidth] = useState(560);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(entry.contentRect.width, 260))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = 220;
  const pad = { top: 12, right: 8, bottom: 26, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const values = history.flatMap((h) => [h.revenue, h.expense, h.profit]);
  const rawMax = Math.max(0, ...values);
  const rawMin = Math.min(0, ...values);
  const step = niceStep(rawMax - rawMin);
  const max = Math.ceil(rawMax / step) * step || step;
  const min = Math.floor(rawMin / step) * step;
  const ticks = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(v);

  const y = (v) => pad.top + ((max - v) / (max - min)) * plotH;
  const band = plotW / history.length;
  const barW = Math.min(Math.max((band - 16) / 2, 6), 22);
  const center = (i) => pad.left + band * i + band / 2;

  const isSelected = (h) =>
    h.month === Number(selectedMonth) && h.year === Number(selectedYear);

  const profitPath = history
    .map((h, i) => `${i === 0 ? "M" : "L"}${center(i)},${y(h.profit)}`)
    .join(" ");

  // Barra com cantos arredondados só na ponta (lado oposto ao zero)
  const barPath = (x, value) => {
    const y0 = y(0);
    const y1 = y(value);
    const h = Math.abs(y1 - y0);
    if (h < 0.5) return "";
    const r = Math.min(4, h, barW / 2);
    if (value >= 0) {
      return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${y0} Z`;
    }
    return `M${x},${y0} V${y1 - r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 - r} V${y0} Z`;
  };

  const hoveredItem = hovered !== null ? history[hovered] : null;
  // Tooltip ao lado da coluna, para não cobrir as barras
  const TOOLTIP_W = 160;
  const tooltipLeft =
    hovered === null
      ? 0
      : center(hovered) + band / 2 + TOOLTIP_W + 4 <= width
      ? center(hovered) + band / 2 + 4
      : Math.max(center(hovered) - band / 2 - TOOLTIP_W - 4, 0);

  return (
    <Card
      title="Últimos 6 meses"
      subtitle="Receita, despesa e lucro de cada mês"
      className="lg:col-span-2"
    >
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto2">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            {s.key === "profit" ? (
              <span className="relative inline-block h-0.5 w-4 rounded" style={{ background: COLORS.profit }}>
                <span
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                  style={{ background: COLORS.profit }}
                />
              </span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[s.key] }} />
            )}
            {s.label}
          </li>
        ))}
      </ul>

      <div ref={wrapperRef} className="relative mt-2 w-full overflow-hidden">
        <svg
          width={width}
          height={height}
          className="block"
          role="img"
          aria-label="Gráfico de receita, despesa e lucro dos últimos 6 meses"
          onMouseLeave={() => setHovered(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? "#CBD5E1" : "#E2E8F0"}
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
              <text
                x={pad.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-texto3 text-[10px] md:text-[11px]"
              >
                {compactBRL(t)}
              </text>
            </g>
          ))}

          {history.map((h, i) => (
            <g key={`${h.year}-${h.month}`}>
              {hovered === i && (
                <rect
                  x={pad.left + band * i + 2}
                  y={pad.top}
                  width={band - 4}
                  height={plotH}
                  rx={8}
                  fill="#F1F6FB"
                />
              )}
              <path d={barPath(center(i) - barW - 1, h.revenue)} fill={COLORS.revenue} />
              <path d={barPath(center(i) + 1, h.expense)} fill={COLORS.expense} />
              <text
                x={center(i)}
                y={height - 8}
                textAnchor="middle"
                className={`text-[11px] ${
                  isSelected(h) ? "fill-texto1 font-bold" : "fill-texto3"
                }`}
              >
                {MONTH_LABELS[h.month - 1]}
                {h.month === 1 || i === 0 ? `/${String(h.year).slice(-2)}` : ""}
              </text>
            </g>
          ))}

          <path
            d={profitPath}
            fill="none"
            stroke={COLORS.profit}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {history.map((h, i) => (
            <circle
              key={`p-${h.year}-${h.month}`}
              cx={center(i)}
              cy={y(h.profit)}
              r={hovered === i ? 5 : 4}
              fill={COLORS.profit}
              stroke="#fff"
              strokeWidth="2"
            />
          ))}

          {/* Áreas de toque maiores que as barras */}
          {history.map((h, i) => (
            <rect
              key={`hit-${h.year}-${h.month}`}
              x={pad.left + band * i}
              y={0}
              width={band}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onClick={() => setHovered(hovered === i ? null : i)}
            />
          ))}
        </svg>

        {hoveredItem && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-cinza9 bg-bg1 px-3 py-2 text-xs shadow-dropShadow"
            style={{ left: tooltipLeft }}
          >
            <p className="mb-1 font-semibold text-texto1">
              {MONTH_NAMES[hoveredItem.month - 1]} de {hoveredItem.year}
            </p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-2 text-texto2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[s.key] }} />
                  {s.label}
                </span>
                <span className={`font-semibold ${s.key === "profit" && hoveredItem.profit < 0 ? "text-erro" : "text-texto1"}`}>
                  {formatBRL(hoveredItem[s.key])}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Mesmos dados em tabela, para leitores de tela */}
      <table className="sr-only">
        <caption>Receita, despesa e lucro por mês</caption>
        <thead>
          <tr>
            <th>Mês</th>
            {SERIES.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={`t-${h.year}-${h.month}`}>
              <td>{`${MONTH_LABELS[h.month - 1]}/${h.year}`}</td>
              {SERIES.map((s) => (
                <td key={s.key}>{formatBRL(h[s.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

const InsightsDashBoard = ({ overview, selectedMonth, selectedYear }) => {
  if (!overview) return null;
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ReceivedCard billing={overview.billing} />
      <HistoryChart
        history={overview.history}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
};

export default InsightsDashBoard;
