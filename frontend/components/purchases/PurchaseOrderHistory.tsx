import React from 'react';

type Props = {
  events: {
    id: string;
    type: string;
    description: string;
    oldValue?: any;
    newValue?: any;
    createdBy?: string;
    createdAt: string;
  }[];
};

export function PurchaseOrderHistory({ events = [] }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 py-4">
        Sem histórico de auditoria registrado para esta ordem.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'criacao':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 ring-8 ring-white dark:ring-neutral-800">
            ➕
          </span>
        );
      case 'emissao':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 ring-8 ring-white dark:ring-neutral-800">
            ✉️
          </span>
        );
      case 'aprovacao':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 ring-8 ring-white dark:ring-neutral-800">
            ✔
          </span>
        );
      case 'recebimento':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 ring-8 ring-white dark:ring-neutral-800">
            📦
          </span>
        );
      case 'cancelamento':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 ring-8 ring-white dark:ring-neutral-800">
            ✖
          </span>
        );
      default:
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 ring-8 ring-white dark:ring-neutral-800">
            📝
          </span>
        );
    }
  };

  return (
    <div className="flow-root p-2">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200 dark:bg-neutral-700" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>{getEventIcon(event.type)}</div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                      {event.description}
                    </p>
                    {event.createdBy && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Por: {event.createdBy}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-neutral-500 dark:text-neutral-400">
                    <time dateTime={event.createdAt}>
                      {new Date(event.createdAt).toLocaleString('pt-BR')}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
