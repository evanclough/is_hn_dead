export interface Comment {
  id: number;
  text: string;
  isBot: boolean;
  children: Comment[];
}

export interface Bot {
  username: string;
  llm: string;            // e.g. "openai-gpt-4o"
  personality: string;    // short human-readable summary
  commentsAuthored: number;
  bio: string;
}

export interface ResultsSummary {
  botIds: string[];   // usernames of all bots in order you’ll rank later
}