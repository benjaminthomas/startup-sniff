/**
 * Test utility for contact email functionality
 * Use this to verify Mailgun integration is working
 */

import { sendContactFormEmail, verifyContactEmailConfiguration, type ContactFormData } from '@/modules/contact';

/**
 * Test contact form email sending
 */
export async function testContactFormEmail(): Promise<void> {
  console.log('🧪 Testing contact form email functionality...');

  try {
    // First verify configuration
    console.log('📋 Verifying Mailgun configuration...');
    const configResult = await verifyContactEmailConfiguration();
    
    if (!configResult.success) {
      throw new Error(`Configuration failed: ${configResult.error}`);
    }
    console.log('✅ Mailgun configuration verified');

    // Test email data
    const testData: ContactFormData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'technical_support',
      company: 'Test Company',
      message: 'This is a test message from the contact form email functionality test. Please ignore this message.'
    };

    console.log('📧 Sending test contact form email...');
    await sendContactFormEmail(testData);
    
    console.log('✅ Test contact form email sent successfully!');
    console.log('📝 Check the following:');
    console.log('   1. Support team should receive the contact form submission');
    console.log('   2. Test user should receive a confirmation email');
    console.log('   3. Emails should be properly formatted with StartupSniff branding');
    
  } catch (error) {
    console.error('❌ Contact form email test failed:', error);
    throw error;
  }
}

/**
 * Test with environment variables
 */
export function checkEnvironmentVariables(): void {
  console.log('🔍 Checking required environment variables...');
  
  const required = [
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN',
  ];
  
  const optional = [
    'MAILGUN_HOST',
    'EMAIL_FROM',
    'EMAIL_FROM_NAME',
    'CONTACT_EMAIL'
  ];
  
  console.log('\nRequired variables:');
  required.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`  ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
  });
  
  console.log('\nOptional variables (will use defaults):');
  optional.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`  ${envVar}: ${value ? `✅ Set (${value})` : '⚠️  Using default'}`);
  });
}

// Export for use in development/testing
if (require.main === module) {
  // Run test if called directly
  checkEnvironmentVariables();
  testContactFormEmail().catch(console.error);
}
