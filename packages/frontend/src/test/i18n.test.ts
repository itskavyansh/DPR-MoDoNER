import i18n from '../i18n';

// Simple test to verify i18n configuration
async function testI18n() {
  console.log('Testing i18n configuration...');

  // Test language switching
  await i18n.changeLanguage('en');
  console.log('English:', i18n.t('common.loading'));

  await i18n.changeLanguage('hi');
  console.log('Hindi:', i18n.t('common.loading'));

  await i18n.changeLanguage('as');
  console.log('Assamese:', i18n.t('common.loading'));
  
  // Test navigation translations
  await i18n.changeLanguage('en');
  console.log('English Dashboard:', i18n.t('navigation.dashboard'));
  
  await i18n.changeLanguage('hi');
  console.log('Hindi Dashboard:', i18n.t('navigation.dashboard'));
  
  await i18n.changeLanguage('as');
  console.log('Assamese Dashboard:', i18n.t('navigation.dashboard'));
}

testI18n().catch(console.error);

export {};