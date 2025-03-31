import { ClientInterface, ClientFetchManyOptions, ClientRequestOptions, BaseClient, BaseClientOptions, FaliedAttempt, HttpResponse,InvalidStatusCodeError, defaultUserAgent, delay } from "@xcrap/core"
import axios, { AxiosInstance, AxiosInterceptorManager, AxiosProxyConfig, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { RateLimitedAxiosInstance, rateLimitOptions } from "axios-rate-limit"
const axiosRateLimit = require("axios-rate-limit")

export type AxiosRequestOptions = ClientRequestOptions & AxiosRequestConfig<any>

export type AxiosInterceptors = {
    request: AxiosInterceptorManager<InternalAxiosRequestConfig>
    response: AxiosInterceptorManager<AxiosResponse>
}

export type AxiosFetchManyOptions = ClientFetchManyOptions<AxiosRequestOptions>

export type AxiosClientOptions = BaseClientOptions<AxiosProxyConfig> & {
    withCredentials?: boolean
    rateLimit?: rateLimitOptions
}

export class AxiosClient extends BaseClient<AxiosProxyConfig> implements ClientInterface {
    protected readonly axiosInstance: AxiosInstance
    protected readonly rateLimitedInstance: RateLimitedAxiosInstance
    readonly interceptors: AxiosInterceptors

    constructor(options: AxiosClientOptions = {}) {
        super(options)

        this.axiosInstance = axios.create({
            proxy: this.currentProxy as AxiosProxyConfig | undefined,
            headers: {
                "User-Agent": this.currentUserAgent ?? defaultUserAgent
            },
            ...(options.withCredentials && { withCredentials: options.withCredentials })
        })

        this.rateLimitedInstance = axiosRateLimit(
            this.axiosInstance as AxiosInstance,
            options.rateLimit ?? {}
        )

        this.rateLimitedInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
            config.proxy = this.currentProxy as AxiosProxyConfig | undefined

            if (config.headers) {
                config.headers["User-Agent"] = this.currentUserAgent ?? defaultUserAgent
            } else {
                (config as AxiosRequestConfig).headers = { "User-Agent": this.currentUserAgent }
            }

            return config
        })

        this.interceptors = this.rateLimitedInstance.interceptors
    }

    async fetch({
        maxRetries = 0,
        retries = 0,
        retryDelay,
        method = "GET",
        ...axiosOptions
    }: AxiosRequestOptions): Promise<HttpResponse> {
        const failedAttempts: FaliedAttempt[] = []

        const attemptRequest = async (currentRetry: number): Promise<HttpResponse> => {
            try {
                const optionsWithProxyUrl = {
                    ...axiosOptions,
                    url: this.currentProxyUrl ? `${this.currentProxyUrl}${axiosOptions.url}` : axiosOptions.url,
                }

                const response = await this.axiosInstance.request(optionsWithProxyUrl)

                if (!this.isSuccess(response.status)) {
                    throw new InvalidStatusCodeError(response.status)
                }

                return new HttpResponse({
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    body: response.data,
                    attempts: currentRetry + 1,
                    failedAttempts,
                })
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error"
                failedAttempts.push({ error: errorMessage, timestamp: new Date() })

                if (axios.isAxiosError(error) && currentRetry < maxRetries) {
                    if (retryDelay !== undefined && retryDelay > 0) {
                        await delay(retryDelay)
                    }

                    return await attemptRequest(currentRetry + 1)
                }

                return new HttpResponse({
                    status: error.response?.status || 500,
                    statusText: error.response?.statusText || "Request Failed",
                    body: error.response?.data || errorMessage,
                    headers: error.response?.headers || {},
                    attempts: currentRetry + 1,
                    failedAttempts,
                })
            }
        }

        return await attemptRequest(retries)
    }

    async fetchMany({ requests, concurrency, requestDelay }: AxiosFetchManyOptions): Promise<HttpResponse[]> {
        const results: HttpResponse[] = []
        const executing: Promise<void>[] = []

        for (let i = 0; i < requests.length; i++) {
            const promise = this.executeRequest({
                request: requests[i],
                index: i,
                requestDelay: requestDelay,
                results: results
            }).then(() => undefined)

            executing.push(promise)

            if (this.shouldThrottle(executing, concurrency)) {
                await this.handleConcurrency(executing)
            }
        }

        await Promise.all(executing)

        return results
    }
}