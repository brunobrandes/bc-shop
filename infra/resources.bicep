param location string
param webAppName string
param functionAppName string

@secure()
param atlasApiKey string

@secure()
param atlasCampaignIdPt string

@secure()
param atlasCampaignIdEn string

param atlasBaseUrl string

@secure()
param bcAgentApiKey string

@secure()
param atlasWebhookSecret string

var planName = 'plan-bc-shop'
var storageAccountName = take('st${uniqueString(subscription().id, resourceGroup().id)}', 24)

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    httpsOnly: true
    serverFarmId: plan.id
    siteConfig: {
      alwaysOn: true
      appCommandLine: 'node server.js'
      ftpsState: 'Disabled'
      http20Enabled: true
      linuxFxVersion: 'NODE|24-lts'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~24'
        }
        {
          name: 'ATLAS_API_KEY'
          value: atlasApiKey
        }
        {
          name: 'ATLAS_CAMPAIGN_ID_PT'
          value: atlasCampaignIdPt
        }
        {
          name: 'ATLAS_CAMPAIGN_ID_EN'
          value: atlasCampaignIdEn
        }
        // Compatibility with the current single-campaign server boundary.
        {
          name: 'ATLAS_CAMPAIGN_ID'
          value: atlasCampaignIdPt
        }
        {
          name: 'ATLAS_BASE_URL'
          value: atlasBaseUrl
        }
        {
          name: 'BC_AGENT_API_KEY'
          value: bcAgentApiKey
        }
      ]
    }
  }
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    httpsOnly: true
    reserved: true
    serverFarmId: plan.id
    siteConfig: {
      alwaysOn: true
      ftpsState: 'Disabled'
      http20Enabled: true
      linuxFxVersion: 'node|24'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~24'
        }
        {
          name: 'ATLAS_WEBHOOK_SECRET'
          value: atlasWebhookSecret
        }
      ]
    }
  }
}

output webAppName string = webApp.name
output functionAppName string = functionApp.name
