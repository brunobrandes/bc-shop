targetScope = 'subscription'

@description('Azure region for the resource group and workloads.')
param location string
param resourceGroupName string
param functionAppName string

@secure()
param atlasWebhookSecret string

@secure()
param bcAdminApiKey string

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

module workloads './resources.bicep' = {
  name: 'bc-shop-workloads'
  scope: resourceGroup
  params: {
    location: location
    functionAppName: functionAppName
    atlasWebhookSecret: atlasWebhookSecret
    bcAdminApiKey: bcAdminApiKey
  }
}

output functionAppName string = workloads.outputs.functionAppName
