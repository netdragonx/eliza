import {
    composeContext,
    Content,
    elizaLogger,
    generateMessageResponse,
    generateText,
    HandlerCallback,
    IAgentRuntime,
    IImageDescriptionService,
    Memory,
    messageCompletionFooter,
    ModelClass,
    ServiceType,
    State,
    stringToUuid,
} from "@ai16z/eliza";
import { SearchMode } from "agent-twitter-client";
import { ClientBase } from "./base";
import { buildConversationThread, sendTweet, wait } from "./utils.ts";

const twitterSearchTemplate =
    `{{timeline}}

{{providers}}

Recent interactions between {{agentName}} and other users:
{{recentPostInteractions}}

About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{postDirections}}

{{recentPosts}}

# Task: Respond to the following post in the style and perspective of {{agentName}} (aka @{{twitterUserName}}). Write a {{adjective}} response for {{agentName}} to say directly in response to the post. don't generalize.
{{currentPost}}

IMPORTANT:
- Your response MUST be a single thought or statement
- Maximum 20 words
- No line breaks or double spaces
- No questions
- No emojis
- Be direct and concise

` + messageCompletionFooter;

export class TwitterSearchClient {
    private respondedTweets: Set<string> = new Set();
    private client: ClientBase;
    private runtime: IAgentRuntime;

    constructor(client: ClientBase, runtime: IAgentRuntime) {
        this.client = client;
        this.runtime = runtime;
    }

    async start() {
        const searchEnabled = !!this.runtime.getSetting(
            "TWITTER_SEARCH_ENABLED"
        );

        if (!searchEnabled) {
            elizaLogger.log("Twitter search disabled by configuration");
            return;
        }

        this.engageWithSearchTermsLoop();
    }

    private engageWithSearchTermsLoop() {
        this.engageWithSearchTerms().catch((error) => {
            elizaLogger.error("Error in search terms loop:", error);
        });

        const baseInterval = parseInt(
            this.runtime.getSetting("TWITTER_SEARCH_INTERVAL") || "3600"
        );

        const variation = Math.floor(Math.random() * 240) - 120;
        const searchInterval = (baseInterval + variation) * 1000;

        setTimeout(() => this.engageWithSearchTermsLoop(), searchInterval);
    }

    private async engageWithSearchTerms() {
        try {
            elizaLogger.debug("Starting engageWithSearchTerms");

            const searchTerm = [...this.runtime.character.topics][
                Math.floor(Math.random() * this.runtime.character.topics.length)
            ];
            elizaLogger.debug("Selected search term", searchTerm);

            const recentTweets = await this.client.fetchSearchTweets(
                searchTerm,
                20,
                SearchMode.Top
            );
            elizaLogger.debug("Fetched recent tweets");

            const homeTimeline = await this.client.fetchHomeTimeline(50);
            elizaLogger.debug("Fetched home timeline");

            await this.client.cacheTimeline(homeTimeline);
            elizaLogger.debug("Cached home timeline");

            const formattedHomeTimeline =
                `# ${this.runtime.character.name}'s Home Timeline\n\n` +
                homeTimeline
                    .map((tweet) => {
                        return `ID: ${tweet.id}\nFrom: ${tweet.name} (@${tweet.username})${tweet.inReplyToStatusId ? ` In reply to: ${tweet.inReplyToStatusId}` : ""}\nText: ${tweet.text}\n---\n`;
                    })
                    .join("\n");

            const slicedTweets = recentTweets.tweets
                .sort(() => Math.random() - 0.5)
                .slice(0, 20);
            elizaLogger.debug("Sliced tweets:", slicedTweets.length);

            if (slicedTweets.length === 0) {
                elizaLogger.debug(
                    "No valid tweets found for the search term",
                    searchTerm
                );
                return;
            }

            const prompt = `
  Here are some tweets related to the search term "${searchTerm}":

  ${[...slicedTweets, ...homeTimeline]
      .filter((tweet) => {
          const thread = tweet.thread;
          const botTweet = thread.find(
              (t) => t.username === this.runtime.getSetting("TWITTER_USERNAME")
          );
          return !botTweet;
      })
      .map(
          (tweet) => `
    ID: ${tweet.id}${tweet.inReplyToStatusId ? ` In reply to: ${tweet.inReplyToStatusId}` : ""}
    From: ${tweet.name} (@${tweet.username})
    Text: ${tweet.text}
  `
      )
      .join("\n")}

  Which tweet is the most interesting and relevant for Ruby to reply to? Please provide only the ID of the tweet in your response.
  Notes:
    - Respond to English tweets only
    - Respond to tweets that don't have a lot of hashtags, links, URLs or images
    - Respond to tweets that are not retweets
    - Respond to tweets where there is an easy exchange of ideas to have with the user
    - ONLY respond with the ID of the tweet`;

            elizaLogger.debug("Generated prompt for text generation");

            const mostInterestingTweetResponse = await generateText({
                runtime: this.runtime,
                context: prompt,
                modelClass: ModelClass.SMALL,
            });
            elizaLogger.debug("Most interesting tweet response");

            const tweetId = mostInterestingTweetResponse.trim();
            const selectedTweet = slicedTweets.find(
                (tweet) =>
                    tweet.id.toString().includes(tweetId) ||
                    tweetId.includes(tweet.id.toString())
            );

            if (!selectedTweet) {
                elizaLogger.debug(
                    "No matching tweet found for the selected ID"
                );
                return elizaLogger.debug("Selected tweet ID:", tweetId);
            }

            elizaLogger.debug(
                "Selected tweet to reply to:",
                selectedTweet?.text
            );

            if (
                selectedTweet.username ===
                this.runtime.getSetting("TWITTER_USERNAME")
            ) {
                elizaLogger.debug("Skipping tweet from bot itself");
                return;
            }

            const conversationId = selectedTweet.conversationId;
            const roomId = stringToUuid(
                conversationId + "-" + this.runtime.agentId
            );

            const userIdUUID = stringToUuid(selectedTweet.userId as string);

            await this.runtime.ensureConnection(
                userIdUUID,
                roomId,
                selectedTweet.username,
                selectedTweet.name,
                "twitter"
            );

            elizaLogger.debug("connection ensured");

            await buildConversationThread(selectedTweet, this.client);

            elizaLogger.debug("conversation thread built");

            const originalTweet = await this.client.requestQueue.add(() =>
                this.client.twitterClient.getTweet(selectedTweet.id)
            );

            elizaLogger.debug("original tweet fetched");

            const message = {
                id: stringToUuid(selectedTweet.id + "-" + this.runtime.agentId),
                agentId: this.runtime.agentId,
                content: {
                    text: selectedTweet.text,
                    url: selectedTweet.permanentUrl,
                    inReplyTo: selectedTweet.inReplyToStatusId
                        ? stringToUuid(
                              selectedTweet.inReplyToStatusId +
                                  "-" +
                                  this.runtime.agentId
                          )
                        : undefined,
                },
                userId: userIdUUID,
                roomId,
                createdAt: selectedTweet.timestamp * 1000,
            };

            if (!message.content.text) {
                return { text: "", action: "IGNORE" };
            }

            const replies = selectedTweet.thread;
            const replyContext = replies
                .filter(
                    (reply) =>
                        reply.username !==
                        this.runtime.getSetting("TWITTER_USERNAME")
                )
                .map((reply) => `@${reply.username}: ${reply.text}`)
                .join("\n");

            let tweetBackground = "";
            if (selectedTweet.isRetweet) {
                tweetBackground = `Retweeting @${originalTweet.username}: ${originalTweet.text}`;
            }

            const imageDescriptions = [];
            for (const photo of selectedTweet.photos) {
                const description = await this.runtime
                    .getService<IImageDescriptionService>(
                        ServiceType.IMAGE_DESCRIPTION
                    )
                    .describeImage(photo.url);
                imageDescriptions.push(description);
            }

            let state = await this.runtime.composeState(message, {
                twitterClient: this.client.twitterClient,
                twitterUserName: this.runtime.getSetting("TWITTER_USERNAME"),
                timeline: formattedHomeTimeline,
                tweetContext: `${tweetBackground}

  Original Post:
  By @${selectedTweet.username}
  ${selectedTweet.text}${replyContext.length > 0 && `\nReplies to original post:\n${replyContext}`}
  ${`Original post text: ${selectedTweet.text}`}
  ${selectedTweet.urls.length > 0 ? `URLs: ${selectedTweet.urls.join(", ")}\n` : ""}${imageDescriptions.length > 0 ? `\nImages in Post (Described): ${imageDescriptions.join(", ")}\n` : ""}
  `,
            });

            await this.saveRequestMessage(message, state as State);

            const context = composeContext({
                state,
                template:
                    this.runtime.character.templates?.twitterSearchTemplate ||
                    twitterSearchTemplate,
            });

            const responseContent = await generateMessageResponse({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            responseContent.inReplyTo = message.id;

            const response = responseContent;

            if (!response.text) {
                console.log("Returning: No response text found");
                return;
            }

            console.log(
                `Bot would respond to tweet ${selectedTweet.id} with: ${response.text}`
            );
            try {
                const callback: HandlerCallback = async (response: Content) => {
                    elizaLogger.debug(
                        "Starting tweet callback with response:",
                        response
                    );
                    const memories = await sendTweet(
                        this.client,
                        response,
                        message.roomId,
                        this.runtime.getSetting("TWITTER_USERNAME"),
                        tweetId
                    );
                    elizaLogger.debug(
                        "Tweet sent, received memories:",
                        memories
                    );
                    return memories;
                };

                const responseMessages = await callback(responseContent);
                elizaLogger.debug(
                    "Received response messages:",
                    responseMessages
                );

                state = await this.runtime.updateRecentMessageState(state);
                elizaLogger.debug("Updated recent message state:", state);

                for (const responseMessage of responseMessages) {
                    await this.runtime.messageManager.createMemory(
                        responseMessage,
                        false
                    );
                    elizaLogger.debug(
                        "Created memory for response message:",
                        responseMessage
                    );
                }

                state = await this.runtime.updateRecentMessageState(state);
                elizaLogger.debug("Updated recent message state again:", state);

                await this.runtime.evaluate(message, state);
                elizaLogger.debug("Evaluated message");

                await this.runtime.processActions(
                    message,
                    responseMessages,
                    state,
                    callback
                );
                elizaLogger.debug("Processed actions");

                this.respondedTweets.add(selectedTweet.id);
                elizaLogger.debug(
                    "Added tweet to responded tweets set:",
                    selectedTweet.id
                );

                const responseInfo = `Context:\n\n${context}\n\nSelected Post: ${selectedTweet.id} - ${selectedTweet.username}: ${selectedTweet.text}\nAgent's Output:\n${response.text}`;
                elizaLogger.debug("Generated response info");

                await this.runtime.cacheManager.set(
                    `twitter/tweet_generation_${selectedTweet.id}.txt`,
                    responseInfo
                );
                elizaLogger.debug("Cached response info");

                await wait();
                elizaLogger.debug("Completed tweet handling process");
            } catch (error) {
                console.error(`Error sending response post: ${error}`);
            }
        } catch (error) {
            elizaLogger.error("Error engaging with search terms:", error);
        }
    }

    private async saveRequestMessage(message: Memory, state: State) {
        return this.client.saveRequestMessage(message, state);
    }
}
