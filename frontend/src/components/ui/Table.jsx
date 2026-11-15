import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Design-system Table primitives
 *
 * <Table>              – outer scroll container
 * <Table.Head>         – <thead> wrapper
 * <Table.HeadCell>     – <th> with optional sort control
 * <Table.Body>         – <tbody> wrapper
 * <Table.Row>          – <tr> with hover / selected styles
 * <Table.Cell>         – <td>
 */

function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

Table.Head = function TableHead({ children }) {
  return (
    <thead className="border-b border-vx-border">
      {children}
    </thead>
  );
};

Table.HeadCell = function TableHeadCell({
  children,
  sortable = false,
  sortDir,          // 'asc' | 'desc' | null
  onSort,
  align = 'left',
  className = '',
}) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];

  return (
    <th
      className={
        `px-4 py-3 text-[10px] font-semibold text-vx-muted uppercase tracking-widest ` +
        `${alignClass} select-none whitespace-nowrap ` +
        (sortable ? 'cursor-pointer hover:text-vx-sub transition-colors ' : '') +
        className
      }
      onClick={sortable ? onSort : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="flex flex-col opacity-50">
            <ChevronUp
              className={`w-2.5 h-2.5 -mb-0.5 ${sortDir === 'asc' ? 'opacity-100 text-vx-accent' : ''}`}
            />
            <ChevronDown
              className={`w-2.5 h-2.5 ${sortDir === 'desc' ? 'opacity-100 text-vx-accent' : ''}`}
            />
          </span>
        )}
      </span>
    </th>
  );
};

Table.Body = function TableBody({ children }) {
  return <tbody>{children}</tbody>;
};

Table.Row = function TableRow({
  children,
  selected = false,
  onClick,
  className = '',
}) {
  return (
    <tr
      onClick={onClick}
      className={
        'border-b border-vx-border/50 transition-colors duration-100 ' +
        (selected
          ? 'bg-vx-accent-s '
          : 'hover:bg-vx-secondary/40 ') +
        (onClick ? 'cursor-pointer ' : '') +
        className
      }
    >
      {children}
    </tr>
  );
};

Table.Cell = function TableCell({
  children,
  align = 'left',
  mono = false,
  className = '',
}) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  return (
    <td
      className={
        `px-4 py-3 text-sm text-vx-text whitespace-nowrap ${alignClass} ` +
        (mono ? 'font-mono text-vx-sub ' : '') +
        className
      }
    >
      {children}
    </td>
  );
};

export default Table;

