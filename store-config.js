// function withStoreConfig(nextConfig = {}) {
//   const features = nextConfig.features || {}
//   delete nextConfig.features

//   nextConfig.env = nextConfig.env || {}

//   Object.entries(features).forEach(([key, value]) => {
//     if (value) {
//       nextConfig.env[`FEATURE_${key.toUpperCase()}_ENABLED`] = true
//     }
//   })

//   return nextConfig
// }

// module.exports = { withStoreConfig }


// store-config.js
function withStoreConfig(nextConfig = {}) {
  const features = nextConfig.features || {}
  delete nextConfig.features

  nextConfig.env = nextConfig.env || {}

  // Loop through the features and set environment variables for each
  Object.entries(features).forEach(([key, value]) => {
    if (value) {
      nextConfig.env[`FEATURE_${key.toUpperCase()}_ENABLED`] = true
    }
  })

  return nextConfig
}

// Export your config with the search feature enabled
module.exports = withStoreConfig({
  features: {
    search: true
  }
})

