"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { HiGlobeAlt, HiDatabase, HiSearch } from "react-icons/hi";
import Select, { SelectOption } from "@/app/components/Select";
import FormInput from "@/app/components/FormInput";
import PageHeader from "@/app/components/PageHeader";
import Loading from "@/app/components/Loading";
import Link from "next/link";
import Button from "@/app/components/Button/Button";
import Switch from "@/app/components/Switch/Switch";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";

type ServiceType = "api" | "mongodb" | "elasticsearch";

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface Service {
  id: string;
  name: string;
  serviceType: ServiceType;
  timeout: number;
  checkInterval: number;
  healthCheckUrl?: string;
  httpMethod?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  mongoConnectionString?: string;
  mongoDatabase?: string;
  esConnectionString?: string;
  groupId?: string;
  alertsEnabled?: boolean;
  description?: string;
  team?: string;
  owner?: string;
  grafanaDashboardId?: string;
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;
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
const createServiceSchema = (serviceType: ServiceType) => {
  const baseSchema = {
    name: yup
      .string()
      .required("Service name is required")
      .min(2, "Name must be at least 2 characters"),
    serviceType: yup
      .string()
      .oneOf(["api", "mongodb", "elasticsearch"])
      .required(),
    timeout: yup
      .number()
      .min(1000, "Minimum 1000ms")
      .max(30000, "Maximum 30000ms")
      .required("Timeout is required"),
    checkInterval: yup
      .number()
      .min(30, "Minimum 30s")
      .max(3600, "Maximum 3600s")
      .required("Check interval is required"),
    description: yup.string().optional(),
    team: yup.string().optional(),
    owner: yup.string().optional(),
    grafanaDashboardId: yup.string().optional(),
    groupId: yup.string().nullable().optional(),
    alertsEnabled: yup.boolean().required(),
    httpMethod: yup.string().optional(),
    responseTimeWarningMs: yup.number().min(100).max(30000).optional(),
    responseTimeWarningAttempts: yup.number().min(1).max(10).optional(),
    responseTimeCriticalMs: yup.number().min(100).max(30000).optional(),
    responseTimeCriticalAttempts: yup.number().min(1).max(10).optional(),
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
        .optional()
        .test("is-json", "Must be valid JSON", (value) => {
          if (!value) return true;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }),
      requestBody: yup.string().optional(),
    });
  } else if (serviceType === "mongodb") {
    return yup.object({
      ...baseSchema,
      mongoConnectionString: yup
        .string()
        .required("MongoDB connection string is required"),
      mongoDatabase: yup.string().optional(),
    });
  } else if (serviceType === "elasticsearch") {
    return yup.object({
      ...baseSchema,
      esConnectionString: yup
        .string()
        .url("Must be a valid URL")
        .required("Elasticsearch URL is required"),
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
  httpMethod?: string;
  healthCheckUrl?: string;
  requestHeaders?: string;
  requestBody?: string;
  mongoConnectionString?: string;
  mongoDatabase?: string;
  esConnectionString?: string;
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;
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
];

export default function ServiceForm({ serviceId }: ServiceFormProps) {
  const router = useRouter();
  const isEditMode = !!serviceId;
  const [error, setError] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("api");

  // Fetch groups
  const { data: groupsData } = useApiQuery<{ groups: Group[] }>("/api/groups");
  const groups = groupsData?.groups || [];

  // Fetch service if editing
  const { data: serviceData, isLoading: loading } = useApiQuery<{
    service: Service;
  }>(`/api/services/${serviceId}`, {
    enabled: isEditMode && !!serviceId,
  });

  const service = serviceData?.service;

  const methods = useForm<ServiceFormData>({
    resolver: yupResolver(createServiceSchema(serviceType)),
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
      httpMethod: "GET",
      healthCheckUrl: "",
      requestHeaders: "",
      requestBody: "",
      mongoConnectionString: "",
      mongoDatabase: "admin",
      esConnectionString: "",
      responseTimeWarningMs: 3000,
      responseTimeWarningAttempts: 3,
      responseTimeCriticalMs: 5000,
      responseTimeCriticalAttempts: 3,
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const watchedGroupId = watch("groupId");
  const watchedAlertsEnabled = watch("alertsEnabled");

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
        httpMethod: service.httpMethod || "GET",
        healthCheckUrl: service.healthCheckUrl || "",
        requestHeaders: service.requestHeaders
          ? JSON.stringify(service.requestHeaders, null, 2)
          : "",
        requestBody: service.requestBody || "",
        mongoConnectionString: service.mongoConnectionString || "",
        mongoDatabase: service.mongoDatabase || "admin",
        esConnectionString: service.esConnectionString || "",
        responseTimeWarningMs: service.responseTimeWarningMs || 3000,
        responseTimeWarningAttempts: service.responseTimeWarningAttempts || 3,
        responseTimeCriticalMs: service.responseTimeCriticalMs || 5000,
        responseTimeCriticalAttempts: service.responseTimeCriticalAttempts || 3,
      });
    }
  }, [service, reset]);

  // Mutation for create/update
  const saveService = useApiMutation<Service, any>({
    url: isEditMode ? `/api/services/${serviceId}` : "/api/services",
    method: isEditMode ? "PUT" : "POST",
    invalidateQueries: [["api", "/api/services"]],
    options: {
      onSuccess: (data) => {
        if (isEditMode) {
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
    } else if (serviceType === "elasticsearch") {
      payload.esConnectionString = data.esConnectionString;
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

  const selectedGroupOption = watchedGroupId
    ? groupOptions.find((opt) => opt.value === watchedGroupId) || null
    : null;

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
            <div className="grid grid-cols-3 gap-4">
              {serviceTypeOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setServiceType(option.type)}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        HTTP Method
                      </label>
                      <Controller
                        name="httpMethod"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={
                              httpMethodOptions.find(
                                (opt) => opt.value === field.value
                              ) || httpMethodOptions[0]
                            }
                            onChange={(option) =>
                              field.onChange((option as SelectOption).value)
                            }
                            options={httpMethodOptions}
                            isSearchable={false}
                            instanceId="http-method-select"
                          />
                        )}
                      />
                    </div>

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
                    <FormInput
                      name="mongoConnectionString"
                      label="Connection String"
                      placeholder="mongodb://localhost:27017"
                      containerClassName="font-mono text-sm"
                      required
                    />

                    <FormInput
                      name="mongoDatabase"
                      label="Database"
                      placeholder="admin"
                    />
                  </>
                )}

                {serviceType === "elasticsearch" && (
                  <FormInput
                    name="esConnectionString"
                    type="url"
                    label="Connection URL"
                    placeholder="http://localhost:9200"
                    containerClassName="font-mono text-sm"
                    required
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    name="timeout"
                    type="number"
                    label="Timeout (ms)"
                  />

                  <FormInput
                    name="checkInterval"
                    type="number"
                    label="Check Interval (s)"
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

            {/* Right Column - Ownership */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Ownership</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Group (Optional)
                  </label>
                  <Controller
                    name="groupId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={selectedGroupOption}
                        onChange={(option) =>
                          field.onChange(
                            (option as SelectOption)?.value || null
                          )
                        }
                        options={groupOptions}
                        isClearable
                        placeholder="Select a group..."
                        instanceId="group-select"
                      />
                    )}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Services without a group won't send notifications
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Notifications
                  </label>
                  <Controller
                    name="alertsEnabled"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          label={field.value ? "Enabled" : "Disabled"}
                          labelPosition="right"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          {field.value
                            ? "Notifications will be sent when incidents occur"
                            : "Health checks continue, but no notifications will be sent"}
                        </p>
                      </>
                    )}
                  />
                </div>
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
