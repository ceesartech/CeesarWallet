package tech.ceesar.ceesarwallet.backend.config

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParameterRequest

object AuthenticationConfig {
    
    fun configure(application: Application) {
        val cognitoClient = CognitoIdentityProviderClient.create()
        val ssmClient = SsmClient.create()
        
        // Get JWT secret from SSM Parameter Store
        val jwtSecret = getJwtSecret(ssmClient)
        val jwtIssuer = getJwtIssuer(ssmClient)
        
        application.install(Authentication) {
            jwt("jwt") {
                realm = "Trading Platform"
                verifier(
                    JWT.require(Algorithm.HMAC256(jwtSecret))
                        .withAudience("trading-platform")
                        .withIssuer(jwtIssuer)
                        .build()
                )
                validate { credential ->
                    if (credential.payload.getClaim("username").asString() != "") {
                        JWTPrincipal(credential.payload)
                    } else {
                        null
                    }
                }
            }
        }
    }
    
    private fun getJwtSecret(ssmClient: SsmClient): String {
        return try {
            val request = GetParameterRequest.builder()
                .name("/trading-platform/jwt-secret")
                .withDecryption(true)
                .build()
            ssmClient.getParameter(request).parameter().value()
        } catch (e: Exception) {
            // Fallback for development
            "dev-secret-key-change-in-production"
        }
    }
    
    private fun getJwtIssuer(ssmClient: SsmClient): String {
        return try {
            val request = GetParameterRequest.builder()
                .name("/trading-platform/jwt-issuer")
                .build()
            ssmClient.getParameter(request).parameter().value()
        } catch (e: Exception) {
            // Fallback for development
            "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX"
        }
    }
}
