// Observability tool link generators

interface LinkGeneratorParams {
  serviceName: string;
  startTime: Date;
  endTime?: Date;
  dashboardId?: string;
}

// Generate Grafana dashboard link with time range
export function generateGrafanaLink(
  baseUrl: string,
  params: LinkGeneratorParams
): string | null {
  if (!baseUrl) return null;

  const from = new Date(params.startTime).getTime();
  const to = params.endTime ? new Date(params.endTime).getTime() : Date.now();

  // Clean base URL
  const cleanUrl = baseUrl.replace(/\/$/, "");

  if (params.dashboardId) {
    // Link to specific dashboard with time range and service filter
    return `${cleanUrl}/d/${
      params.dashboardId
    }?from=${from}&to=${to}&var-service=${encodeURIComponent(
      params.serviceName
    )}`;
  } else {
    // Link to explore with time range
    return `${cleanUrl}/explore?left={"range":{"from":"${from}","to":"${to}"},"queries":[{"expr":"","refId":"A"}]}`;
  }
}

// Generate Kibana discover link with time range and service filter
export function generateKibanaLink(
  baseUrl: string,
  params: LinkGeneratorParams,
  indexPattern: string = "logs-*"
): string | null {
  if (!baseUrl) return null;

  const from = new Date(params.startTime).toISOString();
  const to = params.endTime
    ? new Date(params.endTime).toISOString()
    : new Date().toISOString();

  // Clean base URL
  const cleanUrl = baseUrl.replace(/\/$/, "");

  // Create Kibana discover query
  const query = {
    query: `service.name:"${params.serviceName}"`,
    language: "kuery",
  };

  const timeFilter = {
    from: from,
    to: to,
    mode: "absolute",
  };

  // Encode the state for Kibana URL
  const appState = encodeURIComponent(
    JSON.stringify({
      query: query,
      filters: [],
    })
  );

  const globalState = encodeURIComponent(
    JSON.stringify({
      time: timeFilter,
    })
  );

  return `${cleanUrl}/app/discover#/?_g=${globalState}&_a=${appState}`;
}

// Generate Prometheus query link
export function generatePrometheusLink(
  baseUrl: string,
  params: LinkGeneratorParams,
  metric: string = "up"
): string | null {
  if (!baseUrl) return null;

  const from = new Date(params.startTime).getTime() / 1000; // Prometheus uses seconds
  const to = params.endTime
    ? new Date(params.endTime).getTime() / 1000
    : Date.now() / 1000;

  // Clean base URL
  const cleanUrl = baseUrl.replace(/\/$/, "");

  // Build PromQL query
  const query = `${metric}{service="${params.serviceName}"}`;

  return `${cleanUrl}/graph?g0.expr=${encodeURIComponent(
    query
  )}&g0.range_input=${Math.round(to - from)}s&g0.end_input=${Math.round(to)}`;
}

// Generate Jaeger trace link
export function generateJaegerLink(
  baseUrl: string,
  params: LinkGeneratorParams
): string | null {
  if (!baseUrl) return null;

  const start = new Date(params.startTime).getTime() * 1000; // Jaeger uses microseconds
  const end = params.endTime
    ? new Date(params.endTime).getTime() * 1000
    : Date.now() * 1000;

  // Clean base URL
  const cleanUrl = baseUrl.replace(/\/$/, "");

  return `${cleanUrl}/search?service=${encodeURIComponent(
    params.serviceName
  )}&start=${start}&end=${end}`;
}

// Get all available observability links for an incident
export function getObservabilityLinks(params: LinkGeneratorParams) {
  const links: { type: string; label: string; url: string | null }[] = [];

  // Grafana
  const grafanaUrl = process.env.GRAFANA_URL;
  if (grafanaUrl) {
    links.push({
      type: "grafana",
      label: "View in Grafana",
      url: generateGrafanaLink(grafanaUrl, params),
    });
  }

  // Kibana
  const kibanaUrl = process.env.KIBANA_URL;
  if (kibanaUrl) {
    links.push({
      type: "kibana",
      label: "View Logs in Kibana",
      url: generateKibanaLink(kibanaUrl, params),
    });
  }

  // Prometheus
  const prometheusUrl = process.env.PROMETHEUS_URL;
  if (prometheusUrl) {
    links.push({
      type: "prometheus",
      label: "View Metrics in Prometheus",
      url: generatePrometheusLink(prometheusUrl, params),
    });
  }

  // Jaeger
  const jaegerUrl = process.env.JAEGER_URL;
  if (jaegerUrl) {
    links.push({
      type: "jaeger",
      label: "View Traces in Jaeger",
      url: generateJaegerLink(jaegerUrl, params),
    });
  }

  return links.filter((link) => link.url !== null);
}
