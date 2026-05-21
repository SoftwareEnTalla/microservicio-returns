/**
 * Registro Prometheus minimal sin dependencias externas.
 * Expone métricas básicas en formato OpenMetrics (text/plain).
 *
 * Uso:
 *   metricsRegistry.incCounter('catalog_events_published_total', { topic: 'x' });
 *   metricsRegistry.observeHistogram('http_request_duration_seconds', value, { route: '/api' });
 */

type Labels = Record<string, string>;

interface CounterEntry {
  type: 'counter';
  help: string;
  values: Map<string, number>;
}

interface GaugeEntry {
  type: 'gauge';
  help: string;
  values: Map<string, number>;
}

interface HistogramEntry {
  type: 'histogram';
  help: string;
  buckets: number[];
  values: Map<string, { counts: number[]; sum: number; count: number }>;
}

type Entry = CounterEntry | GaugeEntry | HistogramEntry;

class MetricsRegistry {
  private readonly entries = new Map<string, Entry>();
  private readonly defaultBuckets = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
  ];

  registerCounter(name: string, help: string): void {
    if (!this.entries.has(name)) {
      this.entries.set(name, { type: 'counter', help, values: new Map() });
    }
  }

  registerGauge(name: string, help: string): void {
    if (!this.entries.has(name)) {
      this.entries.set(name, { type: 'gauge', help, values: new Map() });
    }
  }

  registerHistogram(name: string, help: string, buckets?: number[]): void {
    if (!this.entries.has(name)) {
      this.entries.set(name, {
        type: 'histogram',
        help,
        buckets: buckets ?? this.defaultBuckets,
        values: new Map(),
      });
    }
  }

  incCounter(name: string, labels: Labels = {}, value = 1): void {
    this.registerCounter(name, name);
    const entry = this.entries.get(name);
    if (!entry || entry.type !== 'counter') return;
    const key = this.serializeLabels(labels);
    entry.values.set(key, (entry.values.get(key) ?? 0) + value);
  }

  setGauge(name: string, value: number, labels: Labels = {}): void {
    this.registerGauge(name, name);
    const entry = this.entries.get(name);
    if (!entry || entry.type !== 'gauge') return;
    entry.values.set(this.serializeLabels(labels), value);
  }

  observeHistogram(name: string, value: number, labels: Labels = {}): void {
    this.registerHistogram(name, name);
    const entry = this.entries.get(name);
    if (!entry || entry.type !== 'histogram') return;
    const key = this.serializeLabels(labels);
    let bucket = entry.values.get(key);
    if (!bucket) {
      bucket = { counts: new Array(entry.buckets.length).fill(0), sum: 0, count: 0 };
      entry.values.set(key, bucket);
    }
    bucket.sum += value;
    bucket.count += 1;
    for (let i = 0; i < entry.buckets.length; i += 1) {
      if (value <= entry.buckets[i]) bucket.counts[i] += 1;
    }
  }

  async metrics(): Promise<string> {
    this.collectDefaultMetrics();
    const lines: string[] = [];
    for (const [name, entry] of this.entries.entries()) {
      lines.push(`# HELP ${name} ${entry.help}`);
      lines.push(`# TYPE ${name} ${entry.type}`);
      if (entry.type === 'counter' || entry.type === 'gauge') {
        for (const [labelKey, value] of entry.values.entries()) {
          lines.push(`${name}${this.formatLabels(labelKey)} ${value}`);
        }
      } else {
        for (const [labelKey, bucket] of entry.values.entries()) {
          let cumulative = 0;
          for (let i = 0; i < entry.buckets.length; i += 1) {
            cumulative += bucket.counts[i];
            const bucketLabels = this.mergeLabel(labelKey, 'le', String(entry.buckets[i]));
            lines.push(`${name}_bucket${this.formatLabels(bucketLabels)} ${cumulative}`);
          }
          lines.push(
            `${name}_bucket${this.formatLabels(this.mergeLabel(labelKey, 'le', '+Inf'))} ${bucket.count}`,
          );
          lines.push(`${name}_sum${this.formatLabels(labelKey)} ${bucket.sum}`);
          lines.push(`${name}_count${this.formatLabels(labelKey)} ${bucket.count}`);
        }
      }
    }
    return lines.join('\n') + '\n';
  }

  private collectDefaultMetrics(): void {
    const mem = process.memoryUsage();
    this.setGauge('process_resident_memory_bytes', mem.rss);
    this.setGauge('process_heap_bytes', mem.heapUsed);
    this.setGauge('process_uptime_seconds', process.uptime());
  }

  private serializeLabels(labels: Labels): string {
    const keys = Object.keys(labels).sort();
    return keys.map((k) => `${k}=${labels[k]}`).join('|');
  }

  private mergeLabel(labelKey: string, name: string, value: string): string {
    const fragment = `${name}=${value}`;
    return labelKey ? `${labelKey}|${fragment}` : fragment;
  }

  private formatLabels(labelKey: string): string {
    if (!labelKey) return '';
    const pairs = labelKey
      .split('|')
      .filter(Boolean)
      .map((p) => {
        const [k, ...rest] = p.split('=');
        const v = rest.join('=').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `${k}="${v}"`;
      });
    return `{${pairs.join(',')}}`;
  }
}

export const metricsRegistry = new MetricsRegistry();
metricsRegistry.registerCounter(
  'horizontal_login_events_received_total',
  'Eventos de login transversales recibidos',
);
metricsRegistry.registerCounter(
  'horizontal_http_requests_total',
  'Total de requests HTTP atendidos',
);
metricsRegistry.registerHistogram(
  'horizontal_http_request_duration_seconds',
  'Duración de requests HTTP en segundos',
);
