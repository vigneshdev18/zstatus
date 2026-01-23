"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  Controller,
  FormProvider,
  useFieldArray,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  HiGlobeAlt,
  HiDatabase,
  HiSearch,
  HiServer,
  HiPlus,
  HiTrash,
} from "react-icons/hi";
import { SelectOption } from "@/app/components/Select";
import FormInput from "@/app/components/FormInput";
import FormSelect from "@/app/components/FormSelect";
import PageHeader from "@/app/components/PageHeader";
import Loading from "@/app/components/Loading";
import Link from "next/link";
import Button from "@/app/components/Button/Button";
import Switch from "@/app/components/Switch/Switch";
import Checkbox from "@/app/components/Checkbox/Checkbox";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import type { Service } from "@/lib/types/api.types";

type ServiceType = "api" | "mongodb" | "elasticsearch" | "redis";

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface ServiceFormProps {
  serviceId?: string;
}

const httpMethodOptions: SelectOption[] = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "HEAD", label: "HEAD" },
  { value: "PATCH", label: "PATCH" },
];

// Dynamic validation schema based on service type
const createServiceSchema = (serviceType: ServiceType, isEditMode: boolean) => {
  const baseSchema = {
    name: yup
      .string()
      .required("Service name is required")
      .min(2, "Name must be at least 2 characters"),
    serviceType: yup
      .string()
      .oneOf(["api", "mongodb", "elasticsearch", "redis"])
      .required(),
    timeout: yup
      .number()
      .min(1000, "Minimum 1000ms")
      .max(30000, "Maximum 30000ms")
      .required("Timeout is required"),
    description: yup.string().notRequired(),
    team: yup.string().notRequired(),
    owner: yup.string().notRequired(),
    grafanaDashboardId: yup.string().notRequired(),
    groupId: yup.string().nullable().notRequired(),
    alertsEnabled: yup.boolean().required(),
    emailAlertsEnabled: yup.boolean().notRequired(),
    downtimeAlerts: yup.boolean().notRequired(),
    responseTimeAlerts: yup.boolean().notRequired(),
    httpMethod: yup.string().notRequired(),
    responseTimeWarningMs: yup.number().min(100).max(30000).notRequired(),
    responseTimeWarningAttempts: yup.number().min(1).max(10).notRequired(),
    responseTimeCriticalMs: yup.number().min(100).max(30000).notRequired(),
    responseTimeCriticalAttempts: yup.number().min(1).max(10).notRequired(),
    maxRetries: yup.number().min(0).max(5).notRequired(),
    retryDelayMs: yup.number().min(100).max(10000).notRequired(),
    connectionPoolEnabled: yup.boolean().notRequired(),
    connectionPoolSize: yup.number().min(1).max(20).notRequired(),
  };

  if (serviceType === "api") {
    return yup.object({
      ...baseSchema,
      healthCheckUrl: yup
        .string()
        .url("Must be a valid URL")
        .required("Health check URL is required"),
      requestHeaders: yup
        .string()
        .notRequired()
        .test("is-json", "Must be valid JSON", (value) => {
          if (!value) return true;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }),
      requestBody: yup.string().notRequired(),
    });
  } else if (serviceType === "mongodb") {
    return yup.object({
      ...baseSchema,
      mongoConnectionString: yup.string().test({
        name: "required-check",
        message: "MongoDB connection string is required",
        test: function (value) {
          if (this.parent.isMongoConnectionStringSet) return true;
          return !!value;
        },
      }),
      isMongoConnectionStringSet: yup.boolean().notRequired(),
      mongoDatabase: yup.string().notRequired(),
    });
  } else if (serviceType === "elasticsearch") {
    return yup.object({
      ...baseSchema,
      esConnectionString: yup.string().test({
        name: "required-check",
        message: "Elasticsearch URL is required",
        test: function (value) {
          if (this.parent.isEsConnectionStringSet) return true;
          return !!value;
        },
      }),
      isEsConnectionStringSet: yup.boolean().notRequired(),
      esIndex: yup.string().notRequired(),

      esQuery: yup
        .string()
        .notRequired()
        .test("is-json", "Must be valid JSON", (value) => {
          if (!value) return true;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }),
      esUsername: yup.string().notRequired(),
      isEsUsernameSet: yup.boolean().notRequired(),
      esPassword: yup.string().notRequired(),
      isEsPasswordSet: yup.boolean().notRequired(),
      esApiKey: yup.string().notRequired(),
      isEsApiKeySet: yup.boolean().notRequired(),
    });
  } else if (serviceType === "redis") {
    return yup.object({
      ...baseSchema,
      redisConnectionString: yup.string().test({
        name: "required-check",
        message: "Redis connection string is required",
        test: function (value) {
          if (this.parent.isRedisConnectionStringSet) return true;
          return !!value;
        },
      }),
      isRedisConnectionStringSet: yup.boolean().notRequired(),
      redisPassword: yup.string().notRequired(),
      isRedisPasswordSet: yup.boolean().notRequired(),
      redisDatabase: yup
        .number()
        .transform((value) => (Number.isNaN(value) ? null : value))
        .min(0)
        .max(15)
        .notRequired(),
      redisKeys: yup
        .array()
        .of(
          yup.object({
            value: yup.string(),
          }),
        )
        .test("unique-keys", "Duplicate keys are not allowed", function (keys) {
          if (!keys || keys.length === 0) return true;

          const keyValues = keys
            .map((k) => k.value?.trim().toLowerCase())
            .filter((v) => v && v !== "");

          const uniqueKeys = new Set(keyValues);
          return keyValues.length === uniqueKeys.size;
        }),
    });
  }

  return yup.object(baseSchema);
};

type ServiceFormData = {
  name: string;
  serviceType: ServiceType;
  timeout: number;
  checkInterval: number;
  description?: string;
  team?: string;
  owner?: string;
  grafanaDashboardId?: string;
  groupId?: string | null;
  alertsEnabled: boolean;
  emailAlertsEnabled: boolean;
  downtimeAlerts: boolean;
  responseTimeAlerts: boolean;
  httpMethod?: string;
  healthCheckUrl?: string;
  requestHeaders?: string;
  requestBody?: string;
  mongoConnectionString?: string;
  mongoDatabase?: string;
  mongoPipelines?: string; // JSON string of pipelines array
  esConnectionString?: string;
  esIndex?: string;
  esQuery?: string; // JSON string of query body
  esUsername?: string;
  esPassword?: string;
  esApiKey?: string;
  redisConnectionString?: string;
  redisPassword?: string;
  redisDatabase?: number;
  redisOperations?: string; // JSON string of operations array
  redisKeys?: { value: string; id?: string }[]; // Array of keys to test
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  connectionPoolEnabled?: boolean;
  connectionPoolSize?: number;

  // Secret flags
  isMongoConnectionStringSet?: boolean;
  isEsConnectionStringSet?: boolean;
  isEsUsernameSet?: boolean;
  isEsPasswordSet?: boolean;
  isEsApiKeySet?: boolean;
  isRedisConnectionStringSet?: boolean;
  isRedisPasswordSet?: boolean;
};

const serviceTypeOptions = [
  {
    type: "api" as const,
    label: "API / HTTP",
    Icon: HiGlobeAlt,
    color: "text-blue-400",
  },
  {
    type: "mongodb" as const,
    label: "MongoDB",
    Icon: HiDatabase,
    color: "text-green-400",
  },
  {
    type: "elasticsearch" as const,
    label: "Elasticsearch",
    Icon: HiSearch,
    color: "text-yellow-400",
  },
  {
    type: "redis" as const,
    label: "Redis",
    Icon: HiServer,
    color: "text-red-400",
  },
];

export default function ServiceForm({ serviceId }: ServiceFormProps) {
  const router = useRouter();
  const isEditMode = !!serviceId;
  const [error, setError] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("api");

  // Fetch groups
  const { data: groupsData } = useApiQuery("/api/groups", {
    refetchOnMount: "always",
  });

  const groups = groupsData?.groups || [];

  // Fetch service if editing
  const { data: serviceData, isLoading: loading } = useApiQuery(
    `/api/services/${serviceId}` as "/api/services/[id]",
    {
      enabled: isEditMode && !!serviceId,
    },
  );

  const service = serviceData?.service;

  // Create schema that updates when serviceType changes
  const schema = useMemo(
    () => createServiceSchema(serviceType, isEditMode),
    [serviceType, isEditMode],
  );

  const methods = useForm<ServiceFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "",
      serviceType: "api",
      timeout: 5000,

      checkInterval: 60,
      description: "",
      team: "",
      owner: "",
      grafanaDashboardId: "",
      groupId: null,
      alertsEnabled: true,
      emailAlertsEnabled: false,
      downtimeAlerts: true,
      responseTimeAlerts: false,
      httpMethod: "GET",
      healthCheckUrl: "",
      requestHeaders: "",
      requestBody: "",
      mongoConnectionString: "",
      mongoDatabase: "admin",
      esConnectionString: "",
      esIndex: "",
      esQuery: "",
      esUsername: "",
      esPassword: "",
      esApiKey: "",
      redisKeys: [],
      responseTimeWarningMs: 3000,
      responseTimeWarningAttempts: 3,
      responseTimeCriticalMs: 5000,
      responseTimeCriticalAttempts: 3,
      maxRetries: 2,
      retryDelayMs: 1000,
      connectionPoolEnabled: true,
      connectionPoolSize: 1,
      // Secret flags
      isMongoConnectionStringSet: false,
      isEsConnectionStringSet: false,
      isEsUsernameSet: false,
      isEsPasswordSet: false,
      isEsApiKeySet: false,
      isRedisConnectionStringSet: false,
      isRedisPasswordSet: false,
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  const watchedAlertsEnabled = watch("alertsEnabled");
  const watchedEmailAlertsEnabled = watch("emailAlertsEnabled");

  // Field array for Redis keys
  const {
    fields: redisKeyFields,
    append: appendRedisKey,
    remove: removeRedisKey,
  } = useFieldArray({
    control,
    name: "redisKeys",
  });
  // Reset form when service data loads
  useEffect(() => {
    if (service) {
      setServiceType(service.serviceType);
      reset({
        name: service.name,
        serviceType: service.serviceType,
        timeout: service.timeout,
        checkInterval: service.checkInterval,
        description: service.description || "",
        team: service.team || "",
        owner: service.owner || "",
        grafanaDashboardId: service.grafanaDashboardId || "",
        groupId: service.groupId || null,
        alertsEnabled:
          service.alertsEnabled !== undefined ? service.alertsEnabled : true,
        emailAlertsEnabled:
          service.emailAlertsEnabled !== undefined
            ? service.emailAlertsEnabled
            : false,
        downtimeAlerts:
          service.downtimeAlerts !== undefined ? service.downtimeAlerts : true,
        responseTimeAlerts:
          service.responseTimeAlerts !== undefined
            ? service.responseTimeAlerts
            : false,
        httpMethod: service.httpMethod || "GET",
        healthCheckUrl: service.healthCheckUrl || "",
        requestHeaders: service.requestHeaders
          ? JSON.stringify(service.requestHeaders, null, 2)
          : "",
        requestBody: service.requestBody || "",
        mongoConnectionString:
          service.mongoConnectionString === "********"
            ? ""
            : service.mongoConnectionString || "",
        mongoDatabase: service.mongoDatabase || "admin",
        mongoPipelines: service.mongoPipelines
          ? JSON.stringify(service.mongoPipelines, null, 2)
          : "",
        esConnectionString:
          service.esConnectionString === "********"
            ? ""
            : service.esConnectionString || "",
        esIndex: service.esIndex || "",
        esQuery: service.esQuery || "",
        esUsername:
          service.esUsername === "********" ? "" : service.esUsername || "",
        esPassword:
          service.esPassword === "********" ? "" : service.esPassword || "",
        esApiKey: service.esApiKey === "********" ? "" : service.esApiKey || "",
        redisConnectionString:
          service.redisConnectionString === "********"
            ? ""
            : service.redisConnectionString || "",
        redisPassword:
          service.redisPassword === "********"
            ? ""
            : service.redisPassword || "",
        redisDatabase: service.redisDatabase,
        redisKeys: service.redisKeys?.map((key) => ({ value: key })) || [],
        responseTimeWarningMs: service.responseTimeWarningMs || 3000,
        responseTimeWarningAttempts: service.responseTimeWarningAttempts || 3,
        responseTimeCriticalMs: service.responseTimeCriticalMs || 5000,
        responseTimeCriticalAttempts: service.responseTimeCriticalAttempts || 3,
        maxRetries: service.maxRetries ?? 2,
        retryDelayMs: service.retryDelayMs ?? 1000,
        connectionPoolEnabled: service.connectionPoolEnabled ?? true,
        connectionPoolSize: service.connectionPoolSize ?? 1,
        // Secret flags
        isMongoConnectionStringSet: service.isMongoConnectionStringSet,
        isEsConnectionStringSet: service.isEsConnectionStringSet,
        isEsUsernameSet: service.isEsUsernameSet,
        isEsPasswordSet: service.isEsPasswordSet,
        isEsApiKeySet: service.isEsApiKeySet,
        isRedisConnectionStringSet: service.isRedisConnectionStringSet,
        isRedisPasswordSet: service.isRedisPasswordSet,
      });
    }
  }, [service, reset]);

  // Mutation for create/update
  const saveService = useApiMutation({
    url: (isEditMode ? `/api/services/${serviceId}` : "/api/services") as any,
    method: isEditMode ? "PUT" : "POST",
    invalidateQueries: [["api", "/api/services"]],
    options: {
      onSuccess: (data) => {
        if (isEditMode) {
          // Explicitly invalidate the specific service query to ensure secrets flags are updated
          // eslint-disable-next-line @tanstack/query/no-unstable-deps
          // @ts-ignore - access queryClient directly via import if needed, or rely on global invalidation logic
          // Since we can't easily access queryClient here without refactoring, we rely on the list invalidation
          // and navigation to trigger re-fetch.
          // Ideally: queryClient.invalidateQueries(["api", `/api/services/${serviceId}`]);

          router.push(`/services/${serviceId}`);
        } else {
          router.push("/services");
        }
        router.refresh();
      },
      onError: (err) => {
        setError(err.message || "An error occurred");
      },
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    setError("");

    const payload: any = {
      name: data.name,
      serviceType: data.serviceType,
      timeout: data.timeout,
      checkInterval: data.checkInterval,
      groupId: data.groupId || (isEditMode ? null : undefined),
      alertsEnabled: data.alertsEnabled,
      emailAlertsEnabled: data.emailAlertsEnabled,
      downtimeAlerts: data.downtimeAlerts,
      responseTimeAlerts: data.responseTimeAlerts,
      description: data.description || (isEditMode ? null : undefined),
      team: data.team || (isEditMode ? null : undefined),
      owner: data.owner || (isEditMode ? null : undefined),
      grafanaDashboardId:
        data.grafanaDashboardId || (isEditMode ? null : undefined),
      responseTimeWarningMs:
        data.responseTimeWarningMs || (isEditMode ? null : undefined),
      responseTimeWarningAttempts:
        data.responseTimeWarningAttempts || (isEditMode ? null : undefined),
      responseTimeCriticalMs:
        data.responseTimeCriticalMs || (isEditMode ? null : undefined),
      responseTimeCriticalAttempts:
        data.responseTimeCriticalAttempts || (isEditMode ? null : undefined),
      maxRetries: data.maxRetries ?? 2,
      retryDelayMs: data.retryDelayMs ?? 1000,
      connectionPoolEnabled: data.connectionPoolEnabled ?? false,
      connectionPoolSize: data.connectionPoolSize ?? 1,
    };

    if (serviceType === "api") {
      payload.healthCheckUrl = data.healthCheckUrl;
      payload.httpMethod = data.httpMethod;
      if (data.requestHeaders) {
        try {
          payload.requestHeaders = JSON.parse(data.requestHeaders);
        } catch {
          setError("Invalid JSON in request headers");
          return;
        }
      }
      payload.requestBody = data.requestBody || undefined;
    } else if (serviceType === "mongodb") {
      payload.mongoConnectionString = data.mongoConnectionString;
      payload.mongoDatabase = data.mongoDatabase || "admin";

      // Parse pipelines if provided
      if (data.mongoPipelines) {
        try {
          payload.mongoPipelines = JSON.parse(data.mongoPipelines);
        } catch {
          setError("Invalid JSON in MongoDB pipelines");
          return;
        }
      }
    } else if (serviceType === "elasticsearch") {
      payload.esConnectionString = data.esConnectionString;
      payload.esIndex = data.esIndex || undefined;
      payload.esQuery = data.esQuery || undefined;
      payload.esUsername = data.esUsername || undefined;
      payload.esPassword = data.esPassword || undefined;
      payload.esApiKey = data.esApiKey || undefined;
    } else if (serviceType === "redis") {
      payload.redisConnectionString = data.redisConnectionString;
      payload.redisPassword = data.redisPassword || undefined;

      // Handle redisDatabase - convert empty string to undefined, otherwise parse as number
      const dbValue = data.redisDatabase as number | string | undefined | null;
      if (dbValue !== undefined && dbValue !== "" && dbValue !== null) {
        const dbNum =
          typeof dbValue === "string" ? parseInt(dbValue, 10) : dbValue;
        payload.redisDatabase = !isNaN(dbNum) ? dbNum : undefined;
      } else {
        payload.redisDatabase = undefined;
      }

      // Filter out empty keys and extract just the values
      const validKeys =
        data.redisKeys
          ?.filter((key) => key.value.trim() !== "")
          .map((key) => key.value) || [];
      payload.redisKeys = validKeys.length > 0 ? validKeys : undefined;
    }

    saveService.mutate(payload);
  };

  if (loading) {
    return <Loading />;
  }

  const backUrl = isEditMode ? `/services/${serviceId}` : "/services";
  const title = isEditMode ? "Edit Service" : "Add New Service";
  const subtitle = isEditMode
    ? "Update service configuration"
    : "Configure a new service for monitoring";
  const submitText = isSubmitting
    ? isEditMode
      ? "Saving..."
      : "Creating..."
    : isEditMode
      ? "Save Changes"
      : "Create Service";

  const groupOptions = [
    { value: "", label: "No Group (No Notifications)" },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        backLabel={isEditMode ? "Back to Service" : "Back to Services"}
      />

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Service Type Selector */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Service Type</h3>
            <div className="grid grid-cols-4 gap-4">
              {serviceTypeOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setServiceType(option.type);
                    setValue("serviceType", option.type);
                  }}
                  disabled={isEditMode}
                  className={`flex justify-center items-center gap-2 p-4 rounded-xl border-2 transition-smooth text-center ${
                    serviceType === option.type
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  } ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option.Icon className={`w-8 h-8 ${option.color}`} />
                  <div className="text-sm font-medium text-white">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
            {isEditMode && (
              <p className="text-xs text-gray-400 mt-3">
                Service type cannot be changed after creation
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-white">
                  Service Configuration
                </h3>

                <FormInput
                  name="name"
                  label="Service Name"
                  placeholder="e.g., API Gateway"
                  required
                />

                {serviceType === "api" && (
                  <>
                    <FormInput
                      name="healthCheckUrl"
                      type="url"
                      label="Health Check URL"
                      placeholder="https://api.example.com/health"
                      required
                    />

                    <FormSelect
                      name="httpMethod"
                      label="HTTP Method"
                      options={httpMethodOptions}
                      isSearchable={false}
                      instanceId="http-method-select"
                    />

                    <FormInput
                      name="requestHeaders"
                      label="Request Headers (JSON)"
                      placeholder='{"Authorization": "Bearer token"}'
                      containerClassName="font-mono text-sm"
                      as="textarea"
                      rows={3}
                    />

                    <FormInput
                      name="requestBody"
                      label="Request Body"
                      placeholder="Optional request body for POST/PUT"
                      containerClassName="font-mono text-sm"
                      as="textarea"
                      rows={3}
                    />
                  </>
                )}

                {serviceType === "mongodb" && (
                  <>
                    <div className="relative">
                      <FormInput
                        name="mongoConnectionString"
                        label="Connection String"
                        placeholder="mongodb://localhost:27017"
                        containerClassName="font-mono text-sm"
                        required={!service?.isMongoConnectionStringSet}
                      />
                      {service?.isMongoConnectionStringSet &&
                        !watch("mongoConnectionString") && (
                          <div className="absolute top-9 right-3 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Configured
                          </div>
                        )}
                    </div>

                    <FormInput
                      name="mongoDatabase"
                      label="Database"
                      placeholder="admin"
                    />

                    <div className="col-span-2">
                      <FormInput
                        name="mongoPipelines"
                        label="Aggregation Pipelines (Optional)"
                        placeholder='[{"collection": "users", "pipeline": [{"$count": "total"}]}]'
                        containerClassName="font-mono text-sm"
                        as="textarea"
                        rows={6}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        💡 Enter an array of pipeline configurations in JSON
                        format. Each pipeline should have a "collection" and
                        "pipeline" array.
                        <br />
                        Example:{" "}
                        <code className="text-purple-400">
                          [{"{"}collection: "users", pipeline: [{"{"}$count:
                          "total"{"}"}]{"}"}]
                        </code>
                      </p>
                    </div>
                  </>
                )}

                {serviceType === "elasticsearch" && (
                  <>
                    <div className="relative">
                      <FormInput
                        name="esConnectionString"
                        type="url"
                        label="Connection URL"
                        placeholder="http://localhost:9200"
                        containerClassName="font-mono text-sm"
                        required={!service?.isEsConnectionStringSet}
                      />
                      {service?.isEsConnectionStringSet &&
                        !watch("esConnectionString") && (
                          <div className="absolute top-9 right-3 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Configured
                          </div>
                        )}
                    </div>

                    <FormInput
                      name="esIndex"
                      label="Index Name (Optional)"
                      placeholder="e.g., logs-*, my-index"
                      containerClassName="font-mono text-sm"
                    />

                    <div className="col-span-2">
                      <FormInput
                        name="esQuery"
                        label="Search Query (Optional)"
                        placeholder='{"query": {"match_all": {}}}'
                        containerClassName="font-mono text-sm"
                        as="textarea"
                        rows={6}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        💡 Specify a custom search query in JSON format. If not
                        provided, cluster health will be checked instead.
                        <br />
                        Example:{" "}
                        <code className="text-purple-400">
                          {"{"}"query": {"{"}"match_all": {"{}"}
                          {"}"}
                          {"}"}
                        </code>
                      </p>
                    </div>

                    <div className="col-span-2 border-t border-white/10 pt-4 mt-2">
                      <h4 className="text-md font-semibold text-white mb-3">
                        Authentication (Optional)
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <FormInput
                            name="esUsername"
                            label="Username"
                            placeholder="elastic"
                            containerClassName="font-mono text-sm"
                          />
                          {service?.isEsUsernameSet && !watch("esUsername") && (
                            <div className="absolute top-9 right-3 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                              Configured
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <FormInput
                            name="esPassword"
                            type="password"
                            label="Password"
                            placeholder="Enter password"
                            containerClassName="font-mono text-sm"
                          />
                          {service?.isEsPasswordSet && !watch("esPassword") && (
                            <div className="absolute top-9 right-12 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                              Configured
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 my-3 text-center">
                        OR
                      </div>

                      <div className="relative">
                        <FormInput
                          name="esApiKey"
                          label="API Key"
                          placeholder="Enter API key"
                          containerClassName="font-mono text-sm"
                        />
                        {service?.isEsApiKeySet && !watch("esApiKey") && (
                          <div className="absolute top-9 right-3 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Configured
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        💡 Provide either username/password or API key for
                        authentication
                      </p>
                    </div>
                  </>
                )}

                {serviceType === "redis" && (
                  <>
                    <div className="relative">
                      <FormInput
                        name="redisConnectionString"
                        type="text"
                        label="Connection String"
                        placeholder="redis://localhost:6379"
                        containerClassName="font-mono text-sm"
                        required={!service?.isRedisConnectionStringSet}
                      />
                      {service?.isRedisConnectionStringSet &&
                        !watch("redisConnectionString") && (
                          <div className="absolute top-9 right-3 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Configured
                          </div>
                        )}
                    </div>
                    <div className="relative">
                      <FormInput
                        name="redisPassword"
                        type="password"
                        label="Password (optional)"
                        placeholder="Enter password if required"
                      />
                      {service?.isRedisPasswordSet &&
                        !watch("redisPassword") && (
                          <div className="absolute top-9 right-12 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Configured
                          </div>
                        )}
                    </div>
                    <FormInput
                      name="redisDatabase"
                      type="number"
                      label="Database Number (optional)"
                      placeholder="0"
                      min="0"
                      max="15"
                    />

                    {/* Redis Keys Management */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-300">
                          Redis Keys for Testing
                        </label>
                        <button
                          type="button"
                          onClick={() => appendRedisKey({ value: "" })}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-smooth"
                        >
                          <HiPlus className="w-4 h-4" />
                          Add Key
                        </button>
                      </div>

                      <p className="text-xs text-gray-400 mb-3">
                        💡 Specify Redis keys to test with read/write
                        operations. Response times will be tracked separately
                        for analytics.
                      </p>

                      {redisKeyFields.length > 0 ? (
                        <div className="space-y-2">
                          {redisKeyFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="flex items-center gap-2"
                            >
                              <Controller
                                name={`redisKeys.${index}.value` as const}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    value={field.value}
                                    type="text"
                                    placeholder="e.g., user:session:123, cache:products"
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                                  />
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => removeRedisKey(index)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-smooth"
                              >
                                <HiTrash className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-sm text-yellow-300">
                            ⚠️ No keys configured. A default PING command will
                            be used for health checks.
                          </p>
                        </div>
                      )}

                      {errors.redisKeys && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-red-300">
                            ⚠️{" "}
                            {(() => {
                              const error = errors.redisKeys;
                              console.log("Redis keys error:", error);

                              if (typeof error === "string") return error;
                              if (error && typeof error.message === "string")
                                return error.message;
                              if (error && (error as any).root?.message)
                                return (error as any).root.message;

                              return "Duplicate keys are not allowed";
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <FormInput
                    name="timeout"
                    type="number"
                    label="Timeout (ms)"
                    placeholder="5000"
                    required
                  />
                </div>

                <FormInput
                  name="description"
                  label="Description"
                  placeholder="Optional description of this service"
                  as="textarea"
                  rows={3}
                />
              </div>

              {/* Response Time Alerting */}
              <div className="glass rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Response Time Alerting
                  </h3>
                  <p className="text-sm text-gray-400">
                    Trigger alerts when response time exceeds thresholds
                    consecutively
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormInput
                      name="responseTimeWarningMs"
                      type="number"
                      label="Warning Threshold (ms)"
                      hideError
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Default: 3000ms
                    </p>
                  </div>

                  <div>
                    <FormInput
                      name="responseTimeWarningAttempts"
                      type="number"
                      label="Warning Attempts"
                      hideError
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Consecutive slow responses
                    </p>
                  </div>

                  <div>
                    <FormInput
                      name="responseTimeCriticalMs"
                      type="number"
                      label="Critical Threshold (ms)"
                      hideError
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Default: 5000ms
                    </p>
                  </div>

                  <div>
                    <FormInput
                      name="responseTimeCriticalAttempts"
                      type="number"
                      label="Critical Attempts"
                      hideError
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Consecutive slow responses
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> Alerts trigger only after N
                    consecutive slow responses to prevent false positives.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
              {/* Alert Settings */}
              <div className="glass rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-white">Alert Settings</h3>

                <div className="grid grid-cols-1 gap-6 flex flex-col">
                  <FormSelect
                    name="groupId"
                    label="Alert Group"
                    options={groupOptions}
                    placeholder="Select a group..."
                    instanceId="group-select"
                  />

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">Enable Alerts</h4>
                      <p className="text-xs text-gray-400">
                        Master switch for all alerts for this service
                      </p>
                    </div>
                    <Controller
                      name="alertsEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          label={field.value ? "Enabled" : "Disabled"}
                          labelPosition="left"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Email Alerts Configuration */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-white flex items-center gap-2">
                        Email Alerts
                      </h4>
                      <p className="text-xs text-gray-400">
                        Configure email notifications for this service
                      </p>
                    </div>
                    <Controller
                      name="emailAlertsEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          label={field.value ? "Enabled" : "Disabled"}
                          labelPosition="left"
                        />
                      )}
                    />
                  </div>

                  {watchedEmailAlertsEnabled && (
                    <div className="grid grid-cols-1 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg gap-2">
                        <div>
                          <h5 className="font-medium text-white text-sm">
                            Downtime Alerts
                          </h5>
                          <p className="text-xs text-gray-400">
                            Notify when service goes DOWN or comes back UP
                          </p>
                        </div>
                        <Controller
                          name="downtimeAlerts"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onChange={field.onChange}
                              size="lg"
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg gap-2">
                        <div>
                          <h5 className="font-medium text-white text-sm">
                            Response Time Alerts
                          </h5>
                          <p className="text-xs text-gray-400">
                            Notify when response time exceeds thresholds
                          </p>
                        </div>
                        <Controller
                          name="responseTimeAlerts"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onChange={field.onChange}
                              size="lg"
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="glass rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-white">
                  Advanced Settings
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <FormInput
                      name="maxRetries"
                      type="number"
                      label="Max Retries"
                      min="0"
                      max="5"
                      hideError
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Number of retry attempts on failure (default: 2)
                    </p>
                  </div>

                  <div>
                    <FormInput
                      name="retryDelayMs"
                      type="number"
                      label="Retry Delay (ms)"
                      min="100"
                      max="10000"
                      hideError
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Initial delay between retries (default: 1000ms)
                    </p>
                  </div>
                </div>

                {(serviceType === "mongodb" || serviceType === "redis") && (
                  <>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300">
                          Connection Pooling
                        </label>
                        <Controller
                          name="connectionPoolEnabled"
                          control={control}
                          render={({ field }) => (
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                field.value ? "bg-purple-600" : "bg-gray-600"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  field.value
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          )}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Reuse connections between health checks for better
                        performance
                      </p>
                    </div>

                    {watch("connectionPoolEnabled") && (
                      <div>
                        <FormInput
                          name="connectionPoolSize"
                          type="number"
                          label="Pool Size"
                          min="1"
                          max="20"
                          hideError
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Maximum number of pooled connections (default: 1)
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link
              href={backUrl}
              className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
            >
              Cancel
            </Link>
            <Button type="submit" loading={saveService.isPending}>
              {saveService.isPending
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Service"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
