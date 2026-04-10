export interface User {
  chatId: number;
  name: string | null;
  state: "awaiting_name" | "ready";
  createdAt: Date;
}

export interface Message {
  chatId: number;
  direction: "bot" | "user";
  text: string;
  sentAt: Date;
}
