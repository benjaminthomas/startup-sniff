/**
 * Notification Actions Index
 *
 * Exports all notification-related server actions
 */

export { sendWelcomeEmailAction } from './send-welcome-email'
export { sendMessageConfirmationAction } from './send-message-confirmation'
export {
  getEmailPreferencesAction,
  updateEmailPreferencesAction,
  unsubscribeFromAllEmailsAction,
  canSendEmailAction,
  type EmailPreferences,
} from './email-preferences'
