const { withGradleProperties } = require('expo/config-plugins');

/**
 * Gives the Gradle daemon more memory than the Expo template (2 GB heap,
 * 512 MB metaspace). With R8 minify and resource shrinking on (see
 * expo-build-properties in app.json) the 1.3.1 release build ran out of
 * metaspace right after "BUILD SUCCESSFUL" and EAS reported a failure.
 */
const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) =>
        !(item.type === 'property' && item.key === 'org.gradle.jvmargs'),
    );
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: JVM_ARGS,
    });
    return config;
  });
};
