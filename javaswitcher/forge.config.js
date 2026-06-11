module.exports = {
  packagerConfig: {
    asar: true,
    authors: 'ChanYeeSum',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'jdk_switcher',
        productName: 'JDK Switcher',
        exe: 'jdk-switcher.exe',
        authors: 'ChanYeeSum',
        description: 'Quick switch between JDK versions on Windows',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      config: {
        name: 'jdk-switcher',
      },
    },
  ],
};