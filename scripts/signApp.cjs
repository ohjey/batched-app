const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Custom signing script for Electron Forge on macOS.
 * This runs as a postPackage hook to properly sign the app with entitlements.
 */
module.exports = async function signApp(buildPath, appName) {
  // Skip if not running on macOS
  if (process.platform !== 'darwin') {
    return;
  }

  const appPath = path.join(buildPath, `${appName}.app`);

  if (!fs.existsSync(appPath)) {
    console.log('App not found at:', appPath);
    return;
  }

  console.log('==========================================');
  console.log('Ad-hoc signing app:', appPath);
  console.log('==========================================');

  try {
    // Step 1: Strip ALL existing signatures to start completely fresh
    console.log('Step 1: Removing existing signatures...');
    const frameworksPath = path.join(appPath, 'Contents/Frameworks');

    if (fs.existsSync(frameworksPath)) {
      // Remove signatures from frameworks
      try {
        const frameworks = execSync(`find "${frameworksPath}" -name "*.framework" -type d -depth 1`, {
          encoding: 'utf-8'
        }).trim().split('\n').filter(Boolean);

        frameworks.forEach(fw => {
          console.log(`  Removing signature: ${path.basename(fw)}`);
          try {
            execSync(`codesign --remove-signature "${fw}"`, { stdio: 'pipe' });
          } catch (e) {
            // Might not be signed, that's okay
          }
        });
      } catch (e) {
        // No frameworks found
      }

      // Remove signatures from helper apps
      try {
        const apps = execSync(`find "${frameworksPath}" -name "*.app" -type d`, {
          encoding: 'utf-8'
        }).trim().split('\n').filter(Boolean);

        apps.forEach(app => {
          console.log(`  Removing signature: ${path.basename(app)}`);
          try {
            execSync(`codesign --remove-signature "${app}"`, { stdio: 'pipe' });
          } catch (e) {
            // Might not be signed, that's okay
          }
        });
      } catch (e) {
        // No apps found
      }
    }

    // Remove main app signature
    try {
      execSync(`codesign --remove-signature "${appPath}"`, { stdio: 'pipe' });
    } catch (e) {
      // Might not be signed, that's okay
    }

    console.log('✓ All signatures removed\n');

    // Step 2: Sign everything in one deep pass with entitlements
    console.log('Step 2: Signing entire bundle with entitlements...');
    const entitlementsPath = path.join(__dirname, 'entitlements.mac.plist');

    execSync(
      `codesign --force --deep --sign - --entitlements "${entitlementsPath}" --options runtime --timestamp=none "${appPath}"`,
      { stdio: 'inherit' }
    );

    // Step 3: Verify the signature
    console.log('\nStep 3: Verifying signature...');
    execSync(`codesign --verify --deep --strict --verbose=2 "${appPath}"`, {
      stdio: 'inherit'
    });

    console.log('\n==========================================');
    console.log('✓ Signed successfully with consistent identity');
    console.log('==========================================');
  } catch (error) {
    console.error('\n==========================================');
    console.error('✗ Signing failed:', error.message);
    console.error('==========================================');
    throw error;
  }
};
