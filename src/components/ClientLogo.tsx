import React, { useState } from 'react';

interface ClientMeta {
  domain?: string;
  initials: string;
  bgColor: string;
  textColor: string;
  sector: string;
}

const CLIENT_META: Record<string, ClientMeta> = {
  'Puerto de Arica': {
    domain: 'puertoarica.cl',
    initials: 'PA',
    bgColor: 'bg-sky-600',
    textColor: 'text-white',
    sector: 'Portuario / Logística',
  },
  'Positron Pharma': {
    domain: 'positronpharma.cl',
    initials: 'PP',
    bgColor: 'bg-indigo-600',
    textColor: 'text-white',
    sector: 'Salud / Radiofármacos',
  },
  'POSITRON MED': {
    domain: 'positronpharma.cl',
    initials: 'PM',
    bgColor: 'bg-violet-600',
    textColor: 'text-white',
    sector: 'Medicina Nuclear',
  },
  'Muni PAC': {
    domain: 'pedroaguirrecerda.cl',
    initials: 'PAC',
    bgColor: 'bg-emerald-600',
    textColor: 'text-white',
    sector: 'Sector Público Municipal',
  },
  'EDIFICIO SNAP': {
    initials: 'SN',
    bgColor: 'bg-amber-600',
    textColor: 'text-white',
    sector: 'Inmobiliario Corporativo',
  },
  'MASSIVA': {
    domain: 'massiva.cl',
    initials: 'MS',
    bgColor: 'bg-rose-600',
    textColor: 'text-white',
    sector: 'Integración / Telecom',
  },
  'EFE': {
    domain: 'efe.cl',
    initials: 'EFE',
    bgColor: 'bg-blue-700',
    textColor: 'text-white',
    sector: 'Transporte Ferroviario',
  },
  'INN': {
    domain: 'inn.cl',
    initials: 'INN',
    bgColor: 'bg-red-700',
    textColor: 'text-white',
    sector: 'Normalización / Público',
  },
  'FAYMEX': {
    initials: 'FX',
    bgColor: 'bg-teal-600',
    textColor: 'text-white',
    sector: 'Industrial / Manufactura',
  },
  'Hermanos Maristas': {
    domain: 'maristas.cl',
    initials: 'HM',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    sector: 'Educación',
  },
  'Pluss chile': {
    domain: 'pluss.cl',
    initials: 'PC',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    sector: 'Transporte Interurbano',
  },
  'BCI Seguros': {
    domain: 'bciseguros.cl',
    initials: 'BCI',
    bgColor: 'bg-emerald-700',
    textColor: 'text-white',
    sector: 'Banca y Seguros',
  },
  'Supermercado Eltit': {
    domain: 'eltit.cl',
    initials: 'EL',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    sector: 'Retail / Supermercados',
  },
  'GESPANIA': {
    initials: 'GS',
    bgColor: 'bg-cyan-700',
    textColor: 'text-white',
    sector: 'Corporativo',
  },
  'Lab One': {
    initials: 'L1',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    sector: 'Laboratorio Clínico',
  },
  'MDC HEALTH': {
    initials: 'MD',
    bgColor: 'bg-teal-700',
    textColor: 'text-white',
    sector: 'Salud',
  },
  'Avance Chile': {
    initials: 'AC',
    bgColor: 'bg-slate-700',
    textColor: 'text-white',
    sector: 'Servicios',
  },
  'Datasystems': {
    initials: 'DS',
    bgColor: 'bg-blue-800',
    textColor: 'text-white',
    sector: 'TI & Sistemas',
  },
  'FOSKO': {
    initials: 'FK',
    bgColor: 'bg-zinc-700',
    textColor: 'text-white',
    sector: 'Industrial',
  },
  'EPA / Johan Márquez': {
    initials: 'EPA',
    bgColor: 'bg-sky-700',
    textColor: 'text-white',
    sector: 'Infraestructura / DC',
  },
  'Logística Transporte y Servicios': {
    initials: 'LT',
    bgColor: 'bg-amber-700',
    textColor: 'text-white',
    sector: 'Logística',
  },
};

const VENDOR_DOMAINS: Record<string, string> = {
  Lenovo: 'lenovo.com',
  'Lenovo / ASC Parts': 'lenovo.com',
  'Asus / Lenovo': 'lenovo.com',
  Fortinet: 'fortinet.com',
  Huawei: 'huawei.com',
  Cisco: 'cisco.com',
  Dell: 'dell.com',
  Microsoft: 'microsoft.com',
  Ubiquiti: 'ui.com',
  Zebra: 'zebra.com',
  Kaspersky: 'kaspersky.com',
  Kensington: 'kensington.com',
  'Brother / HP': 'hp.com',
  'Brother alt': 'brother.com',
  'Epson / HP': 'epson.com',
  'OEM / Xiaomi': 'mi.com',
  Defontana: 'defontana.com',
  TECNOVOA: 'tecnovoa.cl',
};

export const ClientLogo: React.FC<{
  client: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ client, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const meta = CLIENT_META[client] || {
    initials: client
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase(),
    bgColor: 'bg-[#2A5FFF]',
    textColor: 'text-white',
    sector: 'Corporativo B2B',
  };

  const sizeClasses =
    size === 'sm'
      ? 'w-6 h-6 text-[9px] rounded-md'
      : size === 'lg'
      ? 'w-9 h-9 text-xs rounded-xl'
      : 'w-7 h-7 text-[10px] rounded-lg';

  const faviconUrl = meta.domain
    ? `https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64`
    : null;

  return (
    <div
      className={`relative shrink-0 inline-flex items-center justify-center font-mono font-bold shadow-sm border border-black/10 dark:border-white/10 overflow-hidden ${sizeClasses} ${
        faviconUrl && !imgError ? 'bg-white' : `${meta.bgColor} ${meta.textColor}`
      }`}
      title={`${client} · ${meta.sector}`}
    >
      {faviconUrl && !imgError ? (
        <img
          src={faviconUrl}
          alt={client}
          onError={() => setImgError(true)}
          className="w-4/5 h-4/5 object-contain"
        />
      ) : (
        <span>{meta.initials}</span>
      )}
    </div>
  );
};

export const VendorBadge: React.FC<{ brand: string }> = ({ brand }) => {
  const [imgError, setImgError] = useState(false);
  const domain = VENDOR_DOMAINS[brand];
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-[#101D38] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700">
      {faviconUrl && !imgError && (
        <img
          src={faviconUrl}
          alt={brand}
          onError={() => setImgError(true)}
          className="w-3 h-3 object-contain rounded-sm bg-white p-[1px]"
        />
      )}
      <span className="truncate max-w-[115px]">{brand}</span>
    </span>
  );
};

export default ClientLogo;

