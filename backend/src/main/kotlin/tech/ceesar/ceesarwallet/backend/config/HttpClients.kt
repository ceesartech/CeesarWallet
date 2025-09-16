package tech.ceesar.ceesarwallet.backend.config

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest

object HttpClients {
    
    fun createInferenceClient(): HttpClient {
        return HttpClient(CIO) {
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = false
                    isLenient = true
                    ignoreUnknownKeys = true
                })
            }
            
            install(Logging) {
                level = LogLevel.INFO
            }
            
            install(HttpTimeout) {
                requestTimeoutMillis = 5000
                connectTimeoutMillis = 3000
                socketTimeoutMillis = 5000
            }
            
            defaultRequest {
                url(getInferenceServiceUrl())
            }
        }
    }
    
    fun createEngineClient(): HttpClient {
        return HttpClient(CIO) {
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = false
                    isLenient = true
                    ignoreUnknownKeys = true
                })
            }
            
            install(Logging) {
                level = LogLevel.INFO
            }
            
            install(HttpTimeout) {
                requestTimeoutMillis = 10000
                connectTimeoutMillis = 5000
                socketTimeoutMillis = 10000
            }
            
            defaultRequest {
                url(getEngineServiceUrl())
            }
        }
    }
    
    private fun getInferenceServiceUrl(): String {
        return try {
            val ssmClient = SsmClient.create()
            val request = GetParameterRequest.builder()
                .name("/trading-platform/inference-service-url")
                .build()
            ssmClient.getParameter(request).parameter().value()
        } catch (e: Exception) {
            // Fallback for development
            "http://localhost:8000"
        }
    }
    
    private fun getEngineServiceUrl(): String {
        return try {
            val ssmClient = SsmClient.create()
            val request = GetParameterRequest.builder()
                .name("/trading-platform/engine-service-url")
                .build()
            ssmClient.getParameter(request).parameter().value()
        } catch (e: Exception) {
            // Fallback for development
            "http://localhost:8001"
        }
    }
}
