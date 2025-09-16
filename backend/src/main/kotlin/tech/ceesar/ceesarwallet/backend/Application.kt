package tech.ceesar.ceesarwallet.backend

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import kotlinx.serialization.json.Json
import tech.ceesar.ceesarwallet.backend.config.AuthenticationConfig
import tech.ceesar.ceesarwallet.backend.config.ErrorHandling
import tech.ceesar.ceesarwallet.backend.routes.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configureApplication()
    }.start(wait = true)
}

fun Application.configureApplication() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
    
    install(CORS) {
        anyHost()
        allowHeader("Content-Type")
        allowHeader("Authorization")
        allowMethod(io.ktor.http.HttpMethod.Options)
        allowMethod(io.ktor.http.HttpMethod.Put)
        allowMethod(io.ktor.http.HttpMethod.Delete)
        allowMethod(io.ktor.http.HttpMethod.Patch)
    }
    
    install(CallLogging) {
        level = org.slf4j.event.Level.INFO
    }
    
    install(Authentication) {
        AuthenticationConfig.configure(this)
    }
    
    ErrorHandling.configure(this)
    
    configureRouting()
}

fun Application.configureRouting() {
    AuthRoutes.configure(this)
    TradeRoutes.configure(this)
    InferenceRoutes.configure(this)
    SettingsRoutes.configure(this)
    AdminRoutes.configure(this)
    FraudRoutes.configure(this)
}
