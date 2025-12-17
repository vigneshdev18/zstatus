"use client";

import { useState } from "react";

interface TimelineEvent {
  id: string;
  type: "failure" | "recovery" | "cascade";
  serviceName: string;
  timestamp: Date;
  message: string;
  isRootCause?: boolean;
}

interface IncidentTimelineProps {
  incident: {
    id: string;
    serviceName: string;
    startTime: Date;
    endTime?: Date;
    isCorrelated?: boolean;
    rootCauseServiceId?: string;
    impactedServiceIds?: string[];
  };
  correlatedIncidents?: Array<{
    id: string;
    serviceName: string;
    startTime: Date;
    endTime?: Date;
    rootCauseServiceId?: string;
  }>;
}

export default function IncidentTimeline({
  incident,
  correlatedIncidents = [],
}: IncidentTimelineProps) {
  const [expanded, setExpanded] = useState(true);

  // Build timeline events
  const events: TimelineEvent[] = [];

  // Add primary incident start
  const isRootCause =
    incident.rootCauseServiceId === incident.id || !incident.rootCauseServiceId;
  events.push({
    id: `${incident.id}-start`,
    type: "failure",
    serviceName: incident.serviceName,
    timestamp: incident.startTime,
    message: isRootCause
      ? `${incident.serviceName} failed (root cause)`
      : `${incident.serviceName} failed`,
    isRootCause,
  });

  // Add correlated incidents
  correlatedIncidents.forEach((corr) => {
    const isCascade = corr.rootCauseServiceId !== corr.id;
    events.push({
      id: `${corr.id}-start`,
      type: isCascade ? "cascade" : "failure",
      serviceName: corr.serviceName,
      timestamp: corr.startTime,
      message: isCascade
        ? `${corr.serviceName} affected by upstream failure`
        : `${corr.serviceName} failed`,
    });

    if (corr.endTime) {
      events.push({
        id: `${corr.id}-end`,
        type: "recovery",
        serviceName: corr.serviceName,
        timestamp: corr.endTime,
        message: `${corr.serviceName} recovered`,
      });
    }
  });

  // Add primary incident end
  if (incident.endTime) {
    events.push({
      id: `${incident.id}-end`,
      type: "recovery",
      serviceName: incident.serviceName,
      timestamp: incident.endTime,
      message: `${incident.serviceName} recovered`,
    });
  }

  // Sort by timestamp
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "failure":
        return "🔴";
      case "cascade":
        return "⚠️";
      case "recovery":
        return "✅";
    }
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "failure":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      case "cascade":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "recovery":
        return "border-green-500 bg-green-50 dark:bg-green-900/20";
    }
  };

  if (events.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Incident Timeline
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                  <span className="text-xl">{getEventIcon(event.type)}</span>
                </div>

                {/* Event card */}
                <div
                  className={`flex-1 p-4 rounded-lg border-l-4 ${getEventColor(
                    event.type
                  )}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.message}
                        {event.isRootCause && (
                          <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">
                            Root Cause
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {index === 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        T+0
                      </span>
                    )}
                    {index > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        T+
                        {Math.round(
                          (event.timestamp.getTime() -
                            events[0].timestamp.getTime()) /
                            1000
                        )}
                        s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!expanded && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {events.length} events from{" "}
          {new Date(events[0].timestamp).toLocaleString()} to{" "}
          {new Date(events[events.length - 1].timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
