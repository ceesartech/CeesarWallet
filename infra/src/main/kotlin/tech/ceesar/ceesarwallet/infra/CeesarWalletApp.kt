package tech.ceesar.ceesarwallet.infra

import software.amazon.awscdk.App
import software.amazon.awscdk.Environment
import software.amazon.awscdk.StackProps

fun main() {
    val app = App()
    
    val environment = Environment.builder()
        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
        .region(System.getenv("CDK_DEFAULT_REGION"))
        .build()
    
    val stackProps = StackProps.builder()
        .env(environment)
        .build()
    
    CeesarWalletStack(app, "CeesarWalletStack", stackProps)
    
    app.synth()
}
