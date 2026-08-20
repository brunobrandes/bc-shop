targetScope = 'subscription'

@description('Azure region for the resource group and workloads.')
param location string
param resourceGroupName string
param webAppName string
param functionAppName string

@secure()
param atlasApiKey string

@secure()
param atlasCampaignIdPt string

@secure()
param atlasCampaignIdEn string

param atlasBaseUrl string = 'https://api.youratlas.com/v1/api'

@secure()
param bcAgentApiKey string

@secure()
param atlasWebhookSecret string

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

module workloads './resources.bicep' = {
  name: 'bc-shop-workloads'
  scope: resourceGroup
  params: {
    location: location
    webAppName: webAppName
    functionAppName: functionAppName
    atlasApiKey: atlasApiKey
    atlasCampaignIdPt: atlasCampaignIdPt
    atlasCampaignIdEn: atlasCampaignIdEn
    atlasBaseUrl: atlasBaseUrl
    bcAgentApiKey: bcAgentApiKey
    atlasWebhookSecret: atlasWebhookSecret
  }
}

output webAppName string = workloads.outputs.webAppName
output functionAppName string = workloads.outputs.functionAppName
