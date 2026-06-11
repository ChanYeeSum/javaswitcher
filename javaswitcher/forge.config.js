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
        setupExe: 'JDK-Switcher-Setup.exe',
        authors: 'ChanYeeSum',
        description: 'Quick switch between JDK versions on Windows',
        noMsi: true,
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