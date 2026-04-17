export const botSettings = {
  name: 'My Bot',
  description:
    'A friendly bot that greets you every morning with an inspiring quote.',
  shortDescription: 'Daily inspiration & greetings',
  commands: [{ command: 'start', description: 'Start the bot' }],
  menuButton: (appUrl: string) => ({
    type: 'web_app' as const,
    text: 'Open App',
    web_app: { url: appUrl },
  }),
  profilePhoto: './assets/bot-avatar.jpg' as string | undefined,
  defaultAdministratorRights: undefined as
    | {
        rights: {
          is_anonymous?: boolean;
          can_manage_chat?: boolean;
          can_delete_messages?: boolean;
          can_manage_video_chats?: boolean;
          can_restrict_members?: boolean;
          can_promote_members?: boolean;
          can_change_info?: boolean;
          can_invite_users?: boolean;
          can_post_stories?: boolean;
          can_edit_stories?: boolean;
          can_delete_stories?: boolean;
          can_post_messages?: boolean;
          can_edit_messages?: boolean;
          can_pin_messages?: boolean;
          can_manage_topics?: boolean;
        };
        for_channels?: boolean;
      }
    | undefined,
};
