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
};
